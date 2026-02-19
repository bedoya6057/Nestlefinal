from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

class UserBase(BaseModel):
    dni: str
    name: str
    surname: str
    contract_type: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    class Config:
        orm_mode = True

class DeliveryBase(BaseModel):
    dni: str

class Item(BaseModel):
    name: str
    qty: int

class DeliveryCreate(DeliveryBase):
    items: List[Item]
    date: datetime

class Delivery(DeliveryBase):
    id: int
    date: datetime
    items_json: str
    pdf_path: str
    class Config:
        orm_mode = True

class LaundryBase(BaseModel):
    guide_number: str

class LaundryCreate(LaundryBase):
    items: List[Item]

class Laundry(LaundryBase):
    id: int
    date: datetime
    items_json: str
    status: str
    class Config:
        orm_mode = True

class LaundryReturnBase(BaseModel):
    guide_number: str

class LaundryReturnCreate(LaundryReturnBase):
    items: List[Item]

class LaundryReturn(LaundryReturnBase):
    id: int
    date: datetime
    items_json: str
    class Config:
        orm_mode = True

class UniformReturnBase(BaseModel):
    dni: str
    observations: Optional[str] = None

class UniformReturnCreate(UniformReturnBase):
    items: List[Item]

class UniformReturnResponse(UniformReturnBase):
    id: int
    date: datetime
    items_json: str
    class Config:
        orm_mode = True


