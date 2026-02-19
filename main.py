from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import extract
from database import SessionLocal, engine, Base
import models, schemas
from datetime import date, datetime
import json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
from reportlab.lib.utils import ImageReader

# Configuración de directorios para PDFs
PDF_DIR = "deliveries_pdf"
os.makedirs(PDF_DIR, exist_ok=True)

# Inicialización de Base de Datos
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DEPENDENCIAS ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- RUTAS DE LA API: USUARIOS ---

@app.post("/api/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.dni == user.dni).first()
    if db_user:
        raise HTTPException(status_code=400, detail="DNI ya registrado")
    new_user = models.User(**user.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/api/users/{dni}", response_model=schemas.User)
def read_user(dni: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.dni == dni).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

# --- ENTREGAS Y GENERACIÓN DE PDF ---

def generate_pdf(delivery_id, user, items, delivery_date):
    filename = f"delivery_{delivery_id}.pdf"
    filepath = os.path.join(PDF_DIR, filename)
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter
    
    logo_path = os.path.join("frontend", "src", "assets", "logo.png")
    if os.path.exists(logo_path):
        try:
            logo = ImageReader(logo_path)
            c.drawImage(logo, 40, height - 90, width=120, height=50, mask='auto', preserveAspectRatio=True)
        except:
            c.setFont("Helvetica-Bold", 14)
            c.drawString(40, height - 70, "SODEXO")
    
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, height - 120, "ACTA DE ENTREGA DE UNIFORMES Y EPP")
    
    y = height - 170
    c.setFont("Helvetica", 11)
    c.drawString(50, y, f"Trabajador: {user.name} {user.surname}")
    c.drawString(50, y - 15, f"DNI: {user.dni}")
    c.drawString(50, y - 30, f"Fecha: {datetime.now().strftime('%d/%m/%Y')}")

    data = [["Descripción", "Cantidad"]]
    for item in items:
        data.append([item['name'], str(item['qty'])])

    table = Table(data, colWidths=[350, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
    ]))
    
    w, h = table.wrap(width, height)
    table.drawOn(c, 50, y - 100 - h)
    c.save()
    return filepath

@app.post("/api/deliveries")
def create_delivery(delivery: schemas.DeliveryCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.dni == delivery.dni).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    items_list = [item.dict() for item in delivery.items]
    try:
        new_delivery = models.Delivery(dni=delivery.dni, date=datetime.now(), items_json=json.dumps(items_list), pdf_path="")
        db.add(new_delivery)
        db.commit()
        db.refresh(new_delivery)
        pdf_path = generate_pdf(new_delivery.id, user, items_list, datetime.now())
        new_delivery.pdf_path = pdf_path
        db.commit()
        return {"message": "Creado", "delivery_id": new_delivery.id, "pdf_url": f"/api/deliveries/{new_delivery.id}/pdf"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/deliveries/{delivery_id}/pdf")
def get_pdf(delivery_id: int, db: Session = Depends(get_db)):
    delivery = db.query(models.Delivery).filter(models.Delivery.id == delivery_id).first()
    if not delivery or not os.path.exists(delivery.pdf_path):
        raise HTTPException(status_code=404, detail="PDF no encontrado")
    return FileResponse(delivery.pdf_path, media_type="application/pdf")

# --- LAVANDERÍA (CORREGIDO) ---

@app.post("/api/laundry", response_model=schemas.Laundry)
def create_laundry(laundry_data: schemas.LaundryCreate, db: Session = Depends(get_db)):
    new_laundry = models.Laundry(
        guide_number=laundry_data.guide_number,
        date=datetime.now(),
        items_json=json.dumps([item.dict() for item in laundry_data.items]),
        status="Pendiente"
    )
    db.add(new_laundry)
    db.commit()
    db.refresh(new_laundry)
    return new_laundry

# ENDPOINT CRÍTICO PARA LA BÚSQUEDA DE RETORNO
@app.get("/api/laundry/{guide_number}/status")
def get_laundry_status(guide_number: str, db: Session = Depends(get_db)):
    laundry = db.query(models.Laundry).filter(models.Laundry.guide_number == guide_number).first()
    if not laundry:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    
    # Obtener retornos previos para calcular pendientes
    laundry_returns = db.query(models.LaundryReturn).filter(models.LaundryReturn.guide_number == guide_number).all()
    
    sent_items = {item['name']: item['qty'] for item in json.loads(laundry.items_json)}
    returned_items = {}
    for ret in laundry_returns:
        for item in json.loads(ret.items_json):
            returned_items[item['name']] = returned_items.get(item['name'], 0) + item['qty']
            
    return [{"name": n, "sent": q, "returned": returned_items.get(n, 0), "pending": q - returned_items.get(n, 0)} for n, q in sent_items.items()]

@app.post("/api/laundry/return", response_model=schemas.LaundryReturn)
def create_laundry_return(return_data: schemas.LaundryReturnCreate, db: Session = Depends(get_db)):
    laundry = db.query(models.Laundry).filter(models.Laundry.guide_number == return_data.guide_number).first()
    if not laundry:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    
    new_return = models.LaundryReturn(
        guide_number=return_data.guide_number, 
        date=datetime.now(), 
        items_json=json.dumps([item.dict() for item in return_data.items])
    )
    db.add(new_return)
    db.commit()
    
    # Actualizar estado de la guía automáticamente
    status_list = get_laundry_status(return_data.guide_number, db)
    total_pending = sum(i['pending'] for i in status_list)
    laundry.status = "Completa" if total_pending <= 0 else "Incompleta"
    db.commit()
    return new_return

# --- REPORTES Y ESTADÍSTICAS ---

@app.get("/api/delivery/report")
def get_delivery_report(month: int = None, year: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Delivery)
    if year: query = query.filter(extract('year', models.Delivery.date) == year)
    if month: query = query.filter(extract('month', models.Delivery.date) == month)
    records = query.order_by(models.Delivery.date.desc()).all()
    res = []
    for rec in records:
        user = db.query(models.User).filter(models.User.dni == rec.dni).first()
        res.append({
            "id": rec.id, "user": f"{user.name} {user.surname}" if user else "N/A", 
            "dni": rec.dni, "items": ", ".join([f"{i['qty']} {i['name']}" for i in json.loads(rec.items_json)]), "date": rec.date
        })
    return res

@app.get("/api/reports/laundry")
def get_laundry_report(guide_number: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Laundry)
    if guide_number: query = query.filter(models.Laundry.guide_number.contains(guide_number))
    services = query.order_by(models.Laundry.date.desc()).all()
    return [{"guide_number": s.guide_number, "date": s.date, "items_count": ", ".join([f"{i['qty']} {i['name']}" for i in json.loads(s.items_json)]), "status": s.status} for s in services]

@app.get("/api/stats")
def get_stats(month: int = None, year: int = None, db: Session = Depends(get_db)):
    users = db.query(models.User).count()
    dq = db.query(models.Delivery)
    if year: dq = dq.filter(extract('year', models.Delivery.date) == year)
    if month: dq = dq.filter(extract('month', models.Delivery.date) == month)
    return {"users_count": users, "deliveries_count": dq.count(), "laundry_total_count": db.query(models.Laundry).count()}

# --- CATCH-ALL FRONTEND ---
if os.path.exists("frontend/dist/assets"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    if full_path.startswith("api"): raise HTTPException(status_code=404)
    index = os.path.join("frontend", "dist", "index.html")
    return FileResponse(index) if os.path.exists(index) else RedirectResponse(url="/docs")
