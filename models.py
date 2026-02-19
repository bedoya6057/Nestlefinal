from sqlalchemy import Column, Integer, String, DateTime, Text
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    dni = Column(String, unique=True, index=True)
    name = Column(String)
    surname = Column(String)
    contract_type = Column(String) # "Regular Otro sindicato", "Regular PYA", "Temporal"

class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    dni = Column(String, index=True) # Linked to User DNI
    date = Column(DateTime)
    items_json = Column(Text) # JSON string of items
    pdf_path = Column(String)

class Laundry(Base):
    __tablename__ = "laundry"

    id = Column(Integer, primary_key=True, index=True)
    guide_number = Column(String, unique=True, index=True)
    date = Column(DateTime)
    items_json = Column(Text)
    weight = Column(Integer, default=0) 
    status = Column(String, default="Pendiente") # Pendiente, Parcial, Completado

class LaundryReturn(Base):
    __tablename__ = "laundry_returns"

    id = Column(Integer, primary_key=True, index=True)
    guide_number = Column(String, index=True) # References Laundry guide_number
    date = Column(DateTime)
    items_json = Column(Text)
    status = Column(String) # Completa, Incompleta
    observation = Column(Text) # Detalles de faltantes

class UniformReturn(Base):
    __tablename__ = "uniform_returns"

    id = Column(Integer, primary_key=True, index=True)
    dni = Column(String, index=True)
    date = Column(DateTime)
    items_json = Column(Text)

