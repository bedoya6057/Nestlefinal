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
    weight: float = 0

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
    status: str
    observation: str
    class Config:
        orm_mode = True

class UniformReturnBase(BaseModel):
    dni: str

class UniformReturnCreate(UniformReturnBase):
    items: List[Item]
    date: datetime

class UniformReturn(UniformReturnBase):
    id: int
    date: datetime
    items_json: str
    class Config:
        orm_mode = True

class LaundryStatus(BaseModel):
    name: str
    sent: int
    returned: int
    pending: int

class LaundryPendingItem(BaseModel):
    name: str
    qty: int

class LaundryPendingUser(BaseModel):
    dni: str | None
    user_name: str | None
    user_surname: str | None
    pending_items: List[LaundryPendingItem]


