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
import mimetypes

mimetypes.init()
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')

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

# --- CONFIGURACIÓN DEL FRONTEND (MODIFICADA) ---

# 1. Montar la carpeta de 'assets' generada por Vite (JS y CSS)
# Esta es la clave para que la pantalla deje de estar en blanco
# El navegador pide /assets/index-....js y aquí le decimos dónde buscarlo.
if os.path.exists("frontend/dist/assets"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

# 2. Ruta raíz para cargar el index.html de la carpeta 'dist'
# 2. Ruta raíz para cargar el index.html
@app.get("/")
async def read_root():
    index_path = os.path.join("frontend", "dist", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend not found"}



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
    
    # --- Header ---
    # Nota: Si tu logo está dentro de dist/assets, deberías actualizar esta ruta si quieres que salga en el PDF.
    # Por ahora lo dejamos apuntando a frontend/logo.png si existe en el repo original.
    logo_path = "frontend/logo.png" 
    
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
def create_laundry(laundry: schemas.LaundryCreate, db: Session = Depends(get_db)):
    try:
        # Check if guide number exists
        existing_guide = db.query(models.Laundry).filter(models.Laundry.guide_number == laundry.guide_number).first()
        if existing_guide:
            raise HTTPException(status_code=400, detail="Numero de guia ya existe")

        items_list = [item.dict() for item in laundry.items]

        new_laundry = models.Laundry(
            guide_number=laundry.guide_number,
            weight=laundry.weight,
            date=datetime.now(),
            items_json=json.dumps(items_list)
        )
        db.add(new_laundry)
        db.commit()
        db.refresh(new_laundry)
        
        return new_laundry
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        with open("error_log.txt", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

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
    
    # Active laundry count (filtered by date of creation/sending)
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

@app.get("/api/laundry", response_model=list)
def get_recent_laundry(db: Session = Depends(get_db)):
    # Return last 10 movements for dashboard
    records = db.query(models.Laundry).order_by(models.Laundry.date.desc()).limit(10).all()
    
    result_list = []
    for rec in records:
        # Determine strict status
        status = rec.status if rec.status else "En Proceso"
        
        result_list.append({
            "guide_number": rec.guide_number,
            "items_count": sum(i['qty'] for i in json.loads(rec.items_json)),
            "date": rec.date,
            "status": status
        })
    return result_list

@app.get("/api/laundry/{dni}/status")
def get_laundry_status(dni: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.dni == dni).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    laundry_entries = db.query(models.Laundry).filter(models.Laundry.dni == dni).all()
    laundry_returns = db.query(models.LaundryReturn).filter(models.LaundryReturn.dni == dni).all()
    item_totals = {}
    for entry in laundry_entries:
        for item in json.loads(entry.items_json):
            name = item['name']
            if name not in item_totals: item_totals[name] = {"sent": 0, "returned": 0}
            item_totals[name]["sent"] += item['qty']
    for entry in laundry_returns:
        for item in json.loads(entry.items_json):
            name = item['name']
            if name not in item_totals: item_totals[name] = {"sent": 0, "returned": 0}
            item_totals[name]["returned"] += item['qty']
    return [{"name": n, "sent": c["sent"], "returned": c["returned"], "pending": c["sent"] - c["returned"]} for n, c in item_totals.items()]

@app.get("/api/laundry/guide/{guide_number}", response_model=schemas.Laundry)
def get_laundry_by_guide(guide_number: str, db: Session = Depends(get_db)):
    laundry = db.query(models.Laundry).filter(models.Laundry.guide_number == guide_number).first()
    if not laundry:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    return laundry

@app.post("/api/laundry/return", response_model=schemas.LaundryReturn)
def create_laundry_return(return_data: schemas.LaundryReturnCreate, db: Session = Depends(get_db)):
    try:
        # 1. Buscar la guía original
        original_laundry = db.query(models.Laundry).filter(models.Laundry.guide_number == return_data.guide_number).first()
        if not original_laundry:
            raise HTTPException(status_code=404, detail="Guía no encontrada")

        # 2. Calcular diferencia
        original_items = {item['name']: item['qty'] for item in json.loads(original_laundry.items_json)}
        returned_items = {item.name: item.qty for item in return_data.items}
        
        missing_items = []
        for name, qty_sent in original_items.items():
            qty_returned = returned_items.get(name, 0)
            if qty_returned < qty_sent:
                missing = qty_sent - qty_returned
                missing_items.append(f"{missing} {name}")
        
        # 3. Determinar estado y observación
        if not missing_items:
            status = "Completa"
            observation = "Devolución completa"
        else:
            status = "Incompleta"
            observation = "Falta: " + ", ".join(missing_items)

        return_items_list = [item.dict() for item in return_data.items]

        # 4. Guardar
        new_return = models.LaundryReturn(
            guide_number=return_data.guide_number,
            date=datetime.now(),
            items_json=json.dumps(return_items_list),
            status=status,
            observation=observation
        )
        db.add(new_return)
        
        # Actualizar estado de la lavandería original si es necesario (opcional, por ahora solo return)
        original_laundry.status = status
        
        db.commit()
        db.refresh(new_return)
        return new_return
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        with open("error_log.txt", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/laundry/report")
def get_laundry_report(guide: str = None, month: int = None, year: int = None, db: Session = Depends(get_db)):
    # Base query for Laundry Shipments
    query = db.query(models.Laundry)
    
    if guide:
        query = query.filter(models.Laundry.guide_number.contains(guide))
    
    # Filter by date if provided
    # Note: SQLite doesn't have robust date filtering in SQLAlchemy simply, doing python side filtering for simplicity or standard extract if needed.
    # We will filter python side for month/year to avoid db dialect issues for now, or use extract.
    
    laundry_records = query.order_by(models.Laundry.date.desc()).all()
    
    report_data = []
    
    for record in laundry_records:
        if year and record.date.year != year: continue
        if month and record.date.month != month: continue
        
        # Parse Items
        try:
            items_list = json.loads(record.items_json)
            items_str = ", ".join([f"{i['qty']} {i['name']}" for i in items_list])
        except:
            items_str = "Error parsing items"
            
        # Find associated return
        laundry_return = db.query(models.LaundryReturn).filter(models.LaundryReturn.guide_number == record.guide_number).first()
        
        status = "Enviado"
        observation = "-"
        return_date = "-"
        
        if laundry_return:
            # If return exists, use its status (Completa/Incompleta)
            # Or map internal status to user facing
            status = laundry_return.status # e.g. "Completa", "Incompleta"
            
            # Refine status display
            if status == "Completa":
                status = "Recibido Completo"
            elif status == "Incompleta":
                status = "Recibido Incompleto"
                
            observation = laundry_return.observation if laundry_return.observation else "-"
            return_date = laundry_return.date.isoformat()
        else:
            # Check record.status if set manually or default
            pass

        final_status = status if status else "Enviado"

        report_data.append({
            "id": record.id,
            "guide_number": record.guide_number,
            "send_date": record.date.isoformat(),
            "items": items_str,
            # "weight": record.weight, # Optional to show
            "status": final_status,
            "observation": observation,
            "return_date": return_date,
            "sort_date": record.date
        })
        
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

@app.post("/api/uniform-returns", response_model=schemas.UniformReturn)
def create_uniform_return(return_data: schemas.UniformReturnCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.dni == return_data.dni).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    items_list = [item.dict() for item in return_data.items]
    
    try:
        new_return = models.UniformReturn(
            dni=return_data.dni,
            date=return_data.date,
            items_json=json.dumps(items_list)
        )
        db.add(new_return)
        db.commit()
        db.refresh(new_return)
        return new_return
    except Exception as e:
        import traceback
        with open("error_log.txt", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/uniform-returns/report")
def get_uniform_return_report(dni: str = None, month: int = None, year: int = None, db: Session = Depends(get_db)):
    query = db.query(models.UniformReturn)
    if dni: query = query.filter(models.UniformReturn.dni.contains(dni))
    records = query.all()
    report_data = []

    for rec in records:
        if year and rec.date.year != year: continue
        if month and rec.date.month != month: continue
        
        user = db.query(models.User).filter(models.User.dni == rec.dni).first()
        if not user: continue
        
        try:
            items = json.loads(rec.items_json)
            # Filter out items with 0 qty just in case, or show all
            params_str = ", ".join([f"{item['name']} ({item['qty']})" for item in items if item['qty'] > 0])
            
            report_data.append({
                "id": rec.id, 
                "dni": rec.dni, 
                "user": f"{user.name} {user.surname}", 
                "contract_type": user.contract_type,
                "date": rec.date.isoformat(), 
                "items": params_str,
                "sort_date": rec.date
            })
        except:
             continue

    report_data.sort(key=lambda x: x['sort_date'], reverse=True)
    return report_data