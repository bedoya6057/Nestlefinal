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

# Configuración de directorios
import sys

# Configuración de directorios
if sys.platform == "linux":
    PDF_DIR = "/tmp/deliveries_pdf"
else:
    PDF_DIR = "deliveries_pdf"

os.makedirs(PDF_DIR, exist_ok=True)

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- USUARIOS ---
@app.get("/api/users/{dni}", response_model=schemas.User)
def read_user(dni: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.dni == dni).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@app.post("/api/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.dni == user.dni).first()
    if db_user:
        print(f"Error: DNI {user.dni} already registered", file=sys.stderr)
        raise HTTPException(status_code=400, detail="DNI already registered")
    try:
        new_user = models.User(**user.dict())
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception as e:
        print(f"Database Error creating user: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=str(e))

# --- ENTREGAS Y PDF ---
def generate_pdf(delivery_id, user, items, delivery_date):
    filename = f"delivery_{delivery_id}.pdf"
    filepath = os.path.join(PDF_DIR, filename)
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, height - 100, "ACTA DE ENTREGA DE UNIFORMES Y EPP")
    
    y = height - 150
    c.setFont("Helvetica", 11)
    c.drawString(50, y, f"Trabajador: {user.name} {user.surname}")
    c.drawString(50, y - 15, f"DNI: {user.dni}")
    
    data = [["Descripción", "Cantidad"]]
    for item in items:
        data.append([item['name'], str(item['qty'])])

    table = Table(data, colWidths=[350, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    w, h = table.wrap(width, height)
    table.drawOn(c, 50, y - 100 - h)
    c.save()
    return filepath

@app.post("/api/deliveries")
def create_delivery(delivery: schemas.DeliveryCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.dni == delivery.dni).first()
    if not user: raise HTTPException(status_code=404)
    items_list = [item.dict() for item in delivery.items]
    new_delivery = models.Delivery(dni=delivery.dni, date=datetime.now(), items_json=json.dumps(items_list), pdf_path="")
    db.add(new_delivery)
    db.commit()
    db.refresh(new_delivery)
    pdf_path = generate_pdf(new_delivery.id, user, items_list, datetime.now())
    new_delivery.pdf_path = pdf_path
    db.commit()
    return {"delivery_id": new_delivery.id, "pdf_url": f"/api/deliveries/{new_delivery.id}/pdf"}

@app.get("/api/deliveries/{delivery_id}/pdf")
def get_pdf(delivery_id: int, db: Session = Depends(get_db)):
    delivery = db.query(models.Delivery).filter(models.Delivery.id == delivery_id).first()
    return FileResponse(delivery.pdf_path, media_type="application/pdf")

# --- LAVANDERÍA CON CÁLCULO DE PENDIENTES ---
@app.get("/api/laundry/{guide_number}/status")
def get_laundry_status(guide_number: str, db: Session = Depends(get_db)):
    laundry = db.query(models.Laundry).filter(models.Laundry.guide_number == guide_number).first()
    if not laundry: raise HTTPException(status_code=404)
    returns = db.query(models.LaundryReturn).filter(models.LaundryReturn.guide_number == guide_number).all()
    sent_items = json.loads(laundry.items_json)
    ret_map = {}
    for r in returns:
        for i in json.loads(r.items_json):
            ret_map[i['name']] = ret_map.get(i['name'], 0) + i['qty']
    return [{"name": i['name'], "pending": i['qty'] - ret_map.get(i['name'], 0)} for i in sent_items]

@app.post("/api/laundry/return")
def create_laundry_return(ret: schemas.LaundryReturnCreate, db: Session = Depends(get_db)):
    laundry = db.query(models.Laundry).filter(models.Laundry.guide_number == ret.guide_number).first()
    new_ret = models.LaundryReturn(guide_number=ret.guide_number, date=datetime.now(), items_json=json.dumps([i.dict() for i in ret.items]))
    db.add(new_ret)
    db.commit()
    # Actualizar estado
    status_list = get_laundry_status(ret.guide_number, db)
    laundry.status = "Completo" if sum(i['pending'] for i in status_list) <= 0 else "Incompleta"
    db.commit()
    return {"message": "ok"}

@app.post("/api/laundry")
def create_laundry(laundry: schemas.LaundryCreate, db: Session = Depends(get_db)):
    # Verificar si ya existe
    existing = db.query(models.Laundry).filter(models.Laundry.guide_number == laundry.guide_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Número de guía ya registrado")
    
    items_list = [item.dict() for item in laundry.items]
    new_laundry = models.Laundry(
        guide_number=laundry.guide_number,
        date=datetime.now(),
        items_json=json.dumps(items_list),
        status="Pendiente"
    )
    db.add(new_laundry)
    db.commit()
    db.refresh(new_laundry)
    return new_laundry

# --- DASHBOARD & REPORTES ---
@app.get("/api/stats")
def get_stats(month: int = None, year: int = None, db: Session = Depends(get_db)):
    laundry_q = db.query(models.Laundry)
    if year: laundry_q = laundry_q.filter(extract('year', models.Laundry.date) == year)
    if month: laundry_q = laundry_q.filter(extract('month', models.Laundry.date) == month)
    
    p, pa, ch = 0, 0, 0
    for r in laundry_q.all():
        for i in json.loads(r.items_json):
            n = i['name'].lower()
            if 'polo' in n: p += i['qty']
            elif 'pantalon' in n: pa += i['qty']
            elif 'chaqueta' in n: ch += i['qty']

    return {
        "users_count": db.query(models.User).count(),
        "deliveries_count": db.query(models.Delivery).count(),
        "laundry_polos_count": p, "laundry_pantalones_count": pa, "laundry_chaquetas_count": ch,
        "laundry_active_count": laundry_q.filter(models.Laundry.status != "Completo").count()
    }

@app.get("/api/reports/laundry")
def get_laundry_report(guide_number: str = None, month: int = None, year: int = None, db: Session = Depends(get_db)):
    q = db.query(models.Laundry)
    if guide_number: q = q.filter(models.Laundry.guide_number == guide_number)
    if month: q = q.filter(extract('month', models.Laundry.date) == month)
    if year: q = q.filter(extract('year', models.Laundry.date) == year)
    
    services = q.order_by(models.Laundry.date.desc()).all()
    res = []
    for s in services:
        returns = db.query(models.LaundryReturn).filter(models.LaundryReturn.guide_number == s.guide_number).all()
        ret_map = {}
        last_return_date = None
        for r in returns:
            if not last_return_date or r.date > last_return_date:
                last_return_date = r.date
            for i in json.loads(r.items_json): ret_map[i['name']] = ret_map.get(i['name'], 0) + i['qty']
        
        pend = [f"{i['qty'] - ret_map.get(i['name'], 0)} {i['name']}" for i in json.loads(s.items_json) if (i['qty'] - ret_map.get(i['name'], 0)) > 0]
        
        status = s.status
        if status == "Completa":
            status = "Completo"

        res.append({
            "guide_number": s.guide_number, 
            "date": s.date, 
            "return_date": last_return_date,
            "status": status,
            "items_count": ", ".join([f"{i['qty']} {i['name']}" for i in json.loads(s.items_json)]),
            "pending_items": ", ".join(pend) if pend else "Ninguna"
        })
    return res

@app.get("/api/delivery/report")
def get_delivery_report(month: int = None, year: int = None, db: Session = Depends(get_db)):
    q = db.query(models.Delivery)
    if month: q = q.filter(extract('month', models.Delivery.date) == month)
    if year: q = q.filter(extract('year', models.Delivery.date) == year)
    
    res = []
    for d in q.order_by(models.Delivery.date.desc()).all():
        user = db.query(models.User).filter(models.User.dni == d.dni).first()
        items = json.loads(d.items_json)
        items_str = ", ".join([f"{i['qty']} {i['name']}" for i in items])
        res.append({
            "id": d.id,
            "user": f"{user.name} {user.surname}" if user else "Desconocido",
            "dni": d.dni,
            "date": d.date,
            "items": items_str
        })
    return res

@app.post("/api/uniform-returns")
def create_uniform_return(ret: schemas.UniformReturnCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.dni == ret.dni).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    items_list = [item.dict() for item in ret.items]
    new_return = models.UniformReturn(
        dni=ret.dni,
        date=datetime.now(),
        items_json=json.dumps(items_list),
        observations=ret.observations
    )
    db.add(new_return)
    db.commit()
    db.refresh(new_return)
    return {"message": "Devolución registrada exitosamente", "id": new_return.id}

@app.get("/api/uniform-returns/report")
def get_uniform_return_report(db: Session = Depends(get_db)):
    q = db.query(models.UniformReturn).order_by(models.UniformReturn.date.desc()).all()
    res = []
    for r in q:
        user = db.query(models.User).filter(models.User.dni == r.dni).first()
        items = json.loads(r.items_json)
        items_str = ", ".join([f"{i['qty']} {i['name']}" for i in items])
        res.append({
            "id": r.id,
            "user": f"{user.name} {user.surname}" if user else "Desconocido",
            "dni": r.dni,
            "date": r.date,
            "items": items_str,
            "observations": r.observations
        })
    return res

# CATCH-ALL
if os.path.exists("frontend/dist/assets"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    if full_path.startswith("api"): raise HTTPException(status_code=404)
    index = os.path.join("frontend", "dist", "index.html")
    return FileResponse(index) if os.path.exists(index) else RedirectResponse(url="/docs")
