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

# --- ENTREGAS Y PDF CORREGIDO ---

def generate_pdf(delivery_id, user, items, delivery_date):
    filename = f"delivery_{delivery_id}.pdf"
    filepath = os.path.join(PDF_DIR, filename)
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter
    
    # 1. INTENTO DE LOGO
    # Se busca en la carpeta de origen del build de Render
    logo_path = os.path.join("frontend", "src", "assets", "logo.png")
    if os.path.exists(logo_path):
        try:
            logo = ImageReader(logo_path)
            c.drawImage(logo, 40, height - 90, width=120, height=50, mask='auto', preserveAspectRatio=True)
        except:
            c.setFont("Helvetica-Bold", 20)
            c.drawString(40, height - 70, "SODEXO")
    
    # 2. ENCABEZADO
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, height - 120, "ACTA DE ENTREGA DE UNIFORMES Y EPP")
    
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 50, height - 60, f"Acta N°: {delivery_id:06d}")
    c.drawRightString(width - 50, height - 75, f"Fecha: {datetime.now().strftime('%d/%m/%Y')}")

    # 3. DATOS DEL TRABAJADOR
    y = height - 180
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, "DATOS DEL TRABAJADOR")
    c.line(50, y - 5, 200, y - 5)
    
    c.setFont("Helvetica", 10)
    y -= 25
    c.drawString(50, y, f"Nombres y Apellidos: {user.name} {user.surname}")
    y -= 15
    c.drawString(50, y, f"DNI: {user.dni}")
    y -= 15
    c.drawString(50, y, f"Tipo de Contrato: {user.contract_type}")

    # 4. TABLA DE ITEMS
    y -= 40
    data = [["Descripción del Artículo", "Cantidad"]]
    for item in items:
        data.append([item['name'], str(item['qty'])])

    # Estilo de la tabla
    table = Table(data, colWidths=[350, 100])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.navy),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    # Dibujar tabla
    w, h = table.wrap(width, height)
    table.drawOn(c, 50, y - h)

    # 5. FIRMAS
    y_firma = 150
    c.setFont("Helvetica", 9)
    c.drawString(50, y_firma + 60, "Declaro haber recibido conforme los equipos y uniformes detallados.")
    
    c.line(70, y_firma, 220, y_firma)
    c.drawCentredString(145, y_firma - 15, "ENTREGADO POR")
    
    c.line(360, y_firma, 510, y_firma)
    c.drawCentredString(435, y_firma - 15, "RECIBIDO POR (FIRMA)")
    c.drawCentredString(435, y_firma - 30, f"DNI: {user.dni}")

    c.save()
    return filepath

@app.post("/api/deliveries")
def create_delivery(delivery: schemas.DeliveryCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.dni == delivery.dni).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    items_list = [item.dict() for item in delivery.items]
    try:
        new_delivery = models.Delivery(
            dni=delivery.dni,
            date=datetime.now(),
            items_json=json.dumps(items_list),
            pdf_path=""
        )
        db.add(new_delivery)
        db.commit()
        db.refresh(new_delivery)
        
        # Generar el PDF con los datos reales
        pdf_path = generate_pdf(new_delivery.id, user, items_list, datetime.now())
        new_delivery.pdf_path = pdf_path
        db.commit()
        
        return {
            "message": "Delivery created", 
            "delivery_id": new_delivery.id, 
            "items": items_list,
            "pdf_url": f"/api/deliveries/{new_delivery.id}/pdf"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/deliveries/{delivery_id}/pdf")
def get_pdf(delivery_id: int, db: Session = Depends(get_db)):
    delivery = db.query(models.Delivery).filter(models.Delivery.id == delivery_id).first()
    if not delivery or not os.path.exists(delivery.pdf_path):
        raise HTTPException(status_code=404, detail="PDF no encontrado")
    return FileResponse(delivery.pdf_path, media_type="application/pdf")

# --- LAVANDERÍA ---

@app.post("/api/laundry", response_model=schemas.Laundry)
def create_laundry(laundry_data: schemas.LaundryCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Laundry).filter(models.Laundry.guide_number == laundry_data.guide_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="El número de guía ya existe")
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

@app.get("/api/laundry")
def get_laundry_services(db: Session = Depends(get_db)):
    services = db.query(models.Laundry).order_by(models.Laundry.date.desc()).limit(10).all()
    result = []
    for s in services:
        items = json.loads(s.items_json)
        items_summary = ", ".join([f"{i['qty']} {i['name']}" for i in items if i['qty'] > 0])
        returns = db.query(models.LaundryReturn).filter(models.LaundryReturn.guide_number == s.guide_number).all()
        returned_map = {}
        for r in returns:
            for i in json.loads(r.items_json):
                returned_map[i['name']] = returned_map.get(i['name'], 0) + i['qty']
        pending_list = [f"{i['qty'] - returned_map.get(i['name'], 0)} {i['name']}" for i in items if (i['qty'] - returned_map.get(i['name'], 0)) > 0]
        result.append({
            "guide_number": s.guide_number,
            "date": s.date,
            "items_count": items_summary,
            "pending_items": ", ".join(pending_list) if pending_list else "Ninguna",
            "status": s.status
        })
    return result

@app.get("/api/laundry/{guide_number}/status")
def get_laundry_status(guide_number: str, db: Session = Depends(get_db)):
    laundry = db.query(models.Laundry).filter(models.Laundry.guide_number == guide_number).first()
    if not laundry: raise HTTPException(status_code=404, detail="Guía no encontrada")
    returns = db.query(models.LaundryReturn).filter(models.LaundryReturn.guide_number == guide_number).all()
    sent = {item['name']: item['qty'] for item in json.loads(laundry.items_json)}
    ret = {}
    for r in returns:
        for i in json.loads(r.items_json): ret[i['name']] = ret.get(i['name'], 0) + i['qty']
    return [{"name": n, "sent": q, "returned": ret.get(n, 0), "pending": q - ret.get(n, 0)} for n, q in sent.items()]

@app.post("/api/laundry/return", response_model=schemas.LaundryReturn)
def create_laundry_return(return_data: schemas.LaundryReturnCreate, db: Session = Depends(get_db)):
    laundry = db.query(models.Laundry).filter(models.Laundry.guide_number == return_data.guide_number).first()
    if not laundry: raise HTTPException(status_code=404, detail="Guía no encontrada")
    new_ret = models.LaundryReturn(guide_number=return_data.guide_number, date=datetime.now(), items_json=json.dumps([i.dict() for i in return_data.items]))
    db.add(new_ret)
    db.commit()
    status_list = get_laundry_status(return_data.guide_number, db)
    laundry.status = "Completa" if sum(i['pending'] for i in status_list) <= 0 else "Incompleta"
    db.commit()
    return new_ret

# --- DEVOLUCIÓN DE UNIFORMES ---

@app.post("/api/uniform-returns", response_model=schemas.UniformReturnResponse)
def create_uniform_return(ret: schemas.UniformReturnCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.dni == ret.dni).first()
    if not user: raise HTTPException(status_code=404, detail="Usuario no encontrado")
    new_ur = models.UniformReturn(dni=ret.dni, items_json=json.dumps([i.dict() for i in ret.items]), observations=ret.observations, date=datetime.now())
    db.add(new_ur)
    db.commit()
    db.refresh(new_ur)
    return new_ur

@app.get("/api/uniform-returns/report")
def get_uniform_return_report(db: Session = Depends(get_db)):
    returns = db.query(models.UniformReturn).order_by(models.UniformReturn.date.desc()).all()
    res = []
    for r in returns:
        user = db.query(models.User).filter(models.User.dni == r.dni).first()
        items = json.loads(r.items_json)
        res.append({
            "id": r.id, "dni": r.dni, "user": f"{user.name} {user.surname}" if user else "Desconocido",
            "date": r.date, "items": ", ".join([f"{i['qty']} {i['name']}" for i in items])
        })
    return res

# --- ESTADÍSTICAS ---

@app.get("/api/stats")
def get_stats(month: int = None, year: int = None, db: Session = Depends(get_db)):
    users = db.query(models.User).count()
    dq = db.query(models.Delivery)
    lq = db.query(models.Laundry)
    if year:
        dq = dq.filter(extract('year', models.Delivery.date) == year)
        lq = lq.filter(extract('year', models.Laundry.date) == year)
    if month:
        dq = dq.filter(extract('month', models.Delivery.date) == month)
        lq = lq.filter(extract('month', models.Laundry.date) == month)
    
    p, pa, ch = 0, 0, 0
    for r in lq.all():
        for i in json.loads(r.items_json):
            n = i['name'].lower()
            if 'polo' in n: p += i['qty']
            elif 'pantalon' in n: pa += i['qty']
            elif 'chaqueta' in n: ch += i['qty']

    return {
        "users_count": users, "deliveries_count": dq.count(), "laundry_total_count": lq.count(),
        "laundry_active_count": lq.filter(models.Laundry.status != "Completa").count(),
        "laundry_polos_count": p, "laundry_pantalones_count": pa, "laundry_chaquetas_count": ch
    }

# --- CATCH-ALL FRONTEND ---

if os.path.exists("frontend/dist/assets"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    if full_path.startswith("api"): raise HTTPException(status_code=404, detail="API no encontrada")
    static_file = os.path.join("frontend", "dist", full_path)
    if os.path.isfile(static_file): return FileResponse(static_file)
    index = os.path.join("frontend", "dist", "index.html")
    return FileResponse(index) if os.path.exists(index) else RedirectResponse(url="/docs")
