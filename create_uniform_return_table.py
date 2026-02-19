from database import engine
from models import Base, UniformReturn

def migrate():
    print("Creating uniform_returns table...")
    UniformReturn.__table__.create(bind=engine)
    print("Table created successfully.")

if __name__ == "__main__":
    migrate()
