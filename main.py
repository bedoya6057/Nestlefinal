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

# --- CONFIGURACIÓN DEL FRONTEND ---

# 1. Montar la carpeta de 'assets' generada por Vite
if os.path.exists("frontend/dist/assets"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

# 2. Ruta raíz para cargar el index.html de producción
@app.get("/")
async def read_index():
    index_path = os.path.join("frontend", "dist", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return RedirectResponse(url="/docs")

# --- DEPENDENCIAS ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- RUTAS DE LA API ---

@app.post("/api/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.dni == user.dni).first()
    if db_user:
        raise HTTPException(status_code=400, detail="DNI already registered")
    new_user = models.User(**user.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/api/users/{dni}", response_model=schemas.User)
def read_user(dni: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.dni == dni).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def determine_items(contract_type: str):
    items = []
    if contract_type == "Regular Otro sindicato":
        items = [
            {"name": "Juego de Uniforme (Chaqueta, Pantalon, Polo, Polera)", "qty": 2},
            {"name": "Jabones de tocador", "qty": 24},
            {"name": "Toallas", "qty": 2}
        ]
    elif contract_type == "Regular PYA":
        items = [
            {"name": "Juego de Uniforme (Chaqueta, Pantalon, Polo, Polera)", "qty": 3},
            {"name": "Jabones Bolivar", "qty": 24},
            {"name": "Jabones de tocador", "qty": 22},
            {"name": "Toallas", "qty": 2}
        ]
    elif contract_type == "Temporal":
        items = [
            {"name": "Juego de Uniforme (Chaqueta, Pantalon, Polo, Polera)", "qty": 3},
            {"name": "Par de zapatos", "qty": 1},
            {"name": "Candado", "qty": 1},
            {"name": "Casillero", "qty": 1},
             {"name": "Jabones Bolivar", "qty": 2}
        ]
    return items

def generate_pdf(delivery_id, user, items, delivery_date):
    filename = f"delivery_{delivery_id}.pdf"
    filepath = os.path.join(PDF_DIR, filename)
    
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter
    
    # --- LOGO EN MINÚSCULAS ---
    # Ruta corregida para buscar el logo en la carpeta de assets del código fuente
    logo_path = "frontend/src/assets/logo.png" 
    
    if os.path.exists(logo_path):
        try:
            logo = ImageReader(logo_path)
            iw, ih = logo.getSize()
            aspect = ih / float(iw)
            draw_width = 120
            draw_height = draw_width * aspect
            c.drawImage(logo, 40, height - 50 - draw_height, width=draw_width, height=draw_height, mask='auto', preserveAspectRatio=True)
        except Exception as e:
            c.drawString(40, height - 100, "SODEXO")
        
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, height - 120, "ACTA DE ENTREGA DE UNIFORMES Y EPP")
    
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 50, height - 60, f"Acta N°: {delivery_id:06d}")
    c.drawRightString(width - 50, height - 75, f"Fecha: {delivery_date.strftime('%Y-%m-%d')}")
    
    y_info = height - 180
    c.setLineWidth(1)
    c.setStrokeColor(colors.lightgrey)
    c.rect(50, y_info - 60, width - 100, 70, fill=0)
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(60, y_info - 20, "DATOS DEL TRABAJADOR:")
    
    c.setFont("Helvetica", 10)
    c.drawString(60, y_info - 40, f"Nombre Completo: {user.name} {user.surname}")
    c.drawString(300, y_info - 40, f"DNI: {user.dni}")
    c.drawString(60, y_info - 55, f"Contratación: {user.contract_type}    Talla: {user.size if hasattr(user, 'size') else '-'}")

    y_table = y_info - 100
    data = [["Item / Descripción", "Cantidad"]]
    for item in items:
        data.append([item['name'], str(item['qty'])])

    table = Table(data, colWidths=[350, 100])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.navy),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    w, h = table.wrap(width, height)
    table.drawOn(c, 80, y_table - h)
    
    y_sig = 150
    c.setFont("Helvetica", 9)
    c.drawString(50, y_sig + 60, "Declaro haber recibido a mi entera satisfacción los bienes arriba descritos.")
    c.line(100, y_sig, 250, y_sig)
    c.drawCentredString(175, y_sig - 15, "ENTREGADO POR")
    c.drawCentredString(175, y_sig - 30, "LOGÍSTICA / ROPERÍA")
    
    c.line(350, y_sig, 500, y_sig)
    c.drawCentredString(425, y_sig - 15, "RECIBIDO POR")
    c.drawCentredString(425, y_sig - 30, f"{user.name} {user.surname}")
    c.drawCentredString(425, y_sig - 45, f"DNI: {user.dni}")
    
    c.save()
    return filepath

@app.post("/api/deliveries")
def create_delivery(delivery: schemas.DeliveryCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.dni == delivery.dni).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    items_list = [item.dict() for item in delivery.items]
    
    try:
        new_delivery = models.Delivery(
            dni=delivery.dni,
            date=delivery.date,
            items_json=json.dumps(items_list),
            pdf_path=""
        )
        db.add(new_delivery)
        db.commit()
        db.refresh(new_delivery)
        
        pdf_path = generate_pdf(new_delivery.id, user, items_list, delivery.date)
        new_delivery.pdf_path = pdf_path
        db.commit()
        
        return {"message": "Delivery created", "delivery_id": new_delivery.id, "items": items_list, "pdf_url": f"/api/deliveries/{new_delivery.id}/pdf"}
    except Exception as e:
        import traceback
        with open("error_log.txt", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/deliveries/{delivery_id}/pdf")
def get_pdf(delivery_id: int, db: Session = Depends(get_db)):
    delivery = db.query(models.Delivery).filter(models.Delivery.id == delivery_id).first()
    if not delivery or not os.path.exists(delivery.pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(delivery.pdf_path, media_type="application/pdf", filename=os.path.basename(delivery.pdf_path))

@app.post("/api/laundry", response_model=schemas.Laundry)
def create_laundry(laundry_data: schemas.LaundryCreate, db: Session = Depends(get_db)):
    # Check if guide exists
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
        
        # Calculate pending
        returns = db.query(models.LaundryReturn).filter(models.LaundryReturn.guide_number == s.guide_number).all()
        returned_map = {}
        for r in returns:
            for i in json.loads(r.items_json):
                returned_map[i['name']] = returned_map.get(i['name'], 0) + i['qty']
        
        pending_list = []
        for i in items:
            sent = i['qty']
            done = returned_map.get(i['name'], 0)
            pending = sent - done
            if pending > 0:
                pending_list.append(f"{pending} {i['name']}")
        
        pending_summary = ", ".join(pending_list) if pending_list else "Ninguna"

        result.append({
            "guide_number": s.guide_number,
            "date": s.date,
            "items_count": items_summary,
            "pending_items": pending_summary,
            "status": s.status
        })
    return result

# ... (rest of code)

@app.get("/api/reports/laundry")
def get_laundry_report(guide_number: str = None, month: int = None, year: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Laundry)
    
    if guide_number:
        query = query.filter(models.Laundry.guide_number.contains(guide_number))
    if year:
        query = query.filter(extract('year', models.Laundry.date) == year)
    if month:
        query = query.filter(extract('month', models.Laundry.date) == month)
        
    records = query.order_by(models.Laundry.date.desc()).all()
    report_data = []
    
    for rec in records:
        try:
            # Get items sent
            items = json.loads(rec.items_json)
            items_summary = ", ".join([f"{i['qty']} {i['name']}" for i in items if i['qty'] > 0])
            
            # Get return info
            returns = db.query(models.LaundryReturn).filter(models.LaundryReturn.guide_number == rec.guide_number).all()
            last_return_date = None
            returned_map = {}
            if returns:
                last_return_date = max(r.date for r in returns)
                for r in returns:
                    for i in json.loads(r.items_json):
                        returned_map[i['name']] = returned_map.get(i['name'], 0) + i['qty']
            
            pending_list = []
            for i in items:
                sent = i['qty']
                done = returned_map.get(i['name'], 0)
                pending = sent - done
                if pending > 0:
                    pending_list.append(f"{pending} {i['name']}")
                    
            pending_summary = ", ".join(pending_list) if pending_list else "Ninguna"
                
            report_data.append({
                "id": rec.id,
                "guide_number": rec.guide_number,
                "date": rec.date,
                "items": items_summary,
                "pending_items": pending_summary,
                "status": rec.status,
                "return_date": last_return_date
            })
        except:
            continue
        
    return report_data

@app.get("/api/laundry/{guide_number}/status")
def get_laundry_status(guide_number: str, db: Session = Depends(get_db)):
    laundry = db.query(models.Laundry).filter(models.Laundry.guide_number == guide_number).first()
    if not laundry:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    
    laundry_returns = db.query(models.LaundryReturn).filter(models.LaundryReturn.guide_number == guide_number).all()
    
    sent_items = {}
    for item in json.loads(laundry.items_json):
        sent_items[item['name']] = item['qty']
        
    returned_items = {}
    for ret in laundry_returns:
        for item in json.loads(ret.items_json):
            returned_items[item['name']] = returned_items.get(item['name'], 0) + item['qty']
            
    result = []
    for name, qty_sent in sent_items.items():
        qty_returned = returned_items.get(name, 0)
        result.append({
            "name": name,
            "sent": qty_sent,
            "returned": qty_returned,
            "pending": qty_sent - qty_returned
        })
        
    return result

@app.post("/api/laundry/return", response_model=schemas.LaundryReturn)
def create_laundry_return(return_data: schemas.LaundryReturnCreate, db: Session = Depends(get_db)):
    laundry = db.query(models.Laundry).filter(models.Laundry.guide_number == return_data.guide_number).first()
    if not laundry:
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    items_list = [item.dict() for item in return_data.items]
    new_return = models.LaundryReturn(
        guide_number=return_data.guide_number, 
        date=datetime.now(), 
        items_json=json.dumps(items_list)
    )
    db.add(new_return)
    db.commit()
    db.refresh(new_return)
    
    # Update status
    laundry_returns = db.query(models.LaundryReturn).filter(models.LaundryReturn.guide_number == return_data.guide_number).all()
    
    total_sent = 0
    for item in json.loads(laundry.items_json):
        total_sent += item['qty']
        
    total_returned = 0
    for ret in laundry_returns:
        for item in json.loads(ret.items_json):
            total_returned += item['qty']
            
    if total_returned >= total_sent:
        laundry.status = "Completa"
    elif total_returned > 0:
        laundry.status = "Incompleta"
    else:
        laundry.status = "Pendiente"
        
    db.commit()
    
    return new_return

@app.get("/api/stats")
def get_stats(month: int = None, year: int = None, db: Session = Depends(get_db)):
    users_count = db.query(models.User).count()
    
    # Filter Deliveries
    delivery_query = db.query(models.Delivery)
    if year:
        delivery_query = delivery_query.filter(extract('year', models.Delivery.date) == year)
    if month:
        delivery_query = delivery_query.filter(extract('month', models.Delivery.date) == month)
    deliveries_count = delivery_query.count()
    
    # Filter Laundry
    laundry_query = db.query(models.Laundry)
    if year:
        laundry_query = laundry_query.filter(extract('year', models.Laundry.date) == year)
    if month:
        laundry_query = laundry_query.filter(extract('month', models.Laundry.date) == month)
    
    laundry_total_count = laundry_query.count()
    
    # Active laundry count (filtered by status and potentially date)
    laundry_active_query = laundry_query.filter(models.Laundry.status != "Completa")
    laundry_active_count = laundry_active_query.count()

    # Calculate item specific stats for Laundry (filtered)
    laundry_records = laundry_query.all()
    polos_count = 0
    pantalones_count = 0
    chaquetas_count = 0

    for record in laundry_records:
        try:
            items = json.loads(record.items_json)
            for item in items:
                name_lower = item['name'].lower()
                qty = item.get('qty', 0)
                if 'polo' in name_lower:
                    polos_count += qty
                elif 'pantalon' in name_lower:
                    pantalones_count += qty
                elif 'chaqueta' in name_lower:
                    chaquetas_count += qty
        except:
            pass

    return {
        "users_count": users_count,
        "deliveries_count": deliveries_count,
        "laundry_total_count": laundry_total_count,
        "laundry_active_count": laundry_active_count,
        "laundry_polos_count": polos_count,
        "laundry_pantalones_count": pantalones_count,
        "laundry_chaquetas_count": chaquetas_count
    }

@app.get("/api/laundry/{guide_number}/status")
def get_laundry_status(guide_number: str, db: Session = Depends(get_db)):
    laundry = db.query(models.Laundry).filter(models.Laundry.guide_number == guide_number).first()
    if not laundry:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    
    laundry_returns = db.query(models.LaundryReturn).filter(models.LaundryReturn.guide_number == guide_number).all()
    
    sent_items = {}
    for item in json.loads(laundry.items_json):
        sent_items[item['name']] = item['qty']
        
    returned_items = {}
    for ret in laundry_returns:
        for item in json.loads(ret.items_json):
            returned_items[item['name']] = returned_items.get(item['name'], 0) + item['qty']
            
    result = []
    for name, qty_sent in sent_items.items():
        qty_returned = returned_items.get(name, 0)
        result.append({
            "name": name,
            "sent": qty_sent,
            "returned": qty_returned,
            "pending": qty_sent - qty_returned
        })
        
    return result

@app.post("/api/laundry/return", response_model=schemas.LaundryReturn)
def create_laundry_return(return_data: schemas.LaundryReturnCreate, db: Session = Depends(get_db)):
    laundry = db.query(models.Laundry).filter(models.Laundry.guide_number == return_data.guide_number).first()
    if not laundry:
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    # Check validation logic here if needed (prevent over-returning)
    # For now, just record it
    
    items_list = [item.dict() for item in return_data.items]
    new_return = models.LaundryReturn(
        guide_number=return_data.guide_number, 
        date=datetime.now(), 
        items_json=json.dumps(items_list)
    )
    db.add(new_return)
    db.commit()
    db.refresh(new_return)
    
    # Update status
    laundry_returns = db.query(models.LaundryReturn).filter(models.LaundryReturn.guide_number == return_data.guide_number).all()
    
    total_sent = 0
    for item in json.loads(laundry.items_json):
        total_sent += item['qty']
        
    total_returned = 0
    for ret in laundry_returns:
        for item in json.loads(ret.items_json):
            total_returned += item['qty']
            
    if total_returned >= total_sent:
        laundry.status = "Completado"
    elif total_returned > 0:
        laundry.status = "Parcial"
    else:
        laundry.status = "Pendiente"
        
    db.commit()
    
    return new_return

@app.get("/api/reports/laundry")
def get_laundry_report(guide_number: str = None, month: int = None, year: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Laundry)
    
    if guide_number:
        query = query.filter(models.Laundry.guide_number.contains(guide_number))
    if year:
        query = query.filter(extract('year', models.Laundry.date) == year)
    if month:
        query = query.filter(extract('month', models.Laundry.date) == month)
        
    records = query.order_by(models.Laundry.date.desc()).all()
    report_data = []
    
    for rec in records:
        try:
            # Get items sent
            items_sent = json.loads(rec.items_json)
            items_summary = ", ".join([f"{i['qty']} {i['name']}" for i in items_sent if i['qty'] > 0])
            
            # Get return info
            returns = db.query(models.LaundryReturn).filter(models.LaundryReturn.guide_number == rec.guide_number).all()
            last_return_date = None
            if returns:
                last_return_date = max(r.date for r in returns)
                
            report_data.append({
                "id": rec.id,
                "guide_number": rec.guide_number,
                "date": rec.date,
                "items": items_summary,
                "status": rec.status,
                "return_date": last_return_date
            })
        except:
            continue
        
    return report_data

@app.get("/api/delivery/report")
def get_delivery_report(dni: str = None, month: int = None, year: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Delivery)
    if dni: query = query.filter(models.Delivery.dni.contains(dni))
    records = query.all()
    report_data = []
    for rec in records:
        if year and rec.date.year != year: continue
        if month and rec.date.month != month: continue
        user = db.query(models.User).filter(models.User.dni == rec.dni).first()
        if not user: continue
        items_str = ", ".join([f"{i['qty']} {i['name']}" for i in json.loads(rec.items_json)])
        report_data.append({"id": rec.id, "user": f"{user.name} {user.surname}", "dni": rec.dni, "contract_type": user.contract_type, "items": items_str, "date": rec.date.isoformat(), "sort_date": rec.date})
    report_data.sort(key=lambda x: x['sort_date'], reverse=True)
    return report_data

@app.post("/api/uniform-returns", response_model=schemas.UniformReturnResponse)
def create_uniform_return(return_data: schemas.UniformReturnCreate, db: Session = Depends(get_db)):
    try:
        # Verify user
        user = db.query(models.User).filter(models.User.dni == return_data.dni).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Save to DB
        db_return = models.UniformReturn(
            dni=return_data.dni,
            items_json=json.dumps([item.dict() for item in return_data.items]),
            observations=return_data.observations,
            date=datetime.now()
        )
        db.add(db_return)
        db.commit()
        db.refresh(db_return)
        return db_return
    except Exception as e:
        import traceback
        with open("error_log.txt", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/uniform-returns/report")
def get_uniform_return_report(db: Session = Depends(get_db)):
    returns = db.query(models.UniformReturn).order_by(models.UniformReturn.date.desc()).all()
    result = []
    
    for r in returns:
        user = db.query(models.User).filter(models.User.dni == r.dni).first()
        user_name = f"{user.name} {user.surname}" if user else "Desconocido"
        
        # Aggregate items into a single string
        items_list = []
        try:
            items_data = json.loads(r.items_json)
            for item in items_data:
                items_list.append(f"{item['name']} ({item['qty']})")
        except:
            items_list.append("Error parsing items")
            
        items_str = ", ".join(items_list)

        result.append({
            "id": r.id,
            "dni": r.dni,
            "user": user_name,
            "date": r.date,
            "items": items_str
        })
    
    return result

# --- CATCH-ALL PARA REACT ROUTER ---
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    # Si la ruta comienza con api, dejamos que FastAPI maneje el 404
    if full_path.startswith("api"):
         raise HTTPException(status_code=404, detail="API Endpoint not found")
    
    # Si es un archivo estático que no existe
    if full_path.startswith("assets") or full_path.startswith("frontend"):
         raise HTTPException(status_code=404, detail="File not found")

    # Intentar servir archivo estático desde frontend/dist (ej. logo.png, vite.svg)
    static_file_path = os.path.join("frontend", "dist", full_path)
    if os.path.isfile(static_file_path):
        return FileResponse(static_file_path)

    # Para todo lo demás (rutas de React), entregamos el index.html
    index_path = os.path.join("frontend", "dist", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return RedirectResponse(url="/docs")

