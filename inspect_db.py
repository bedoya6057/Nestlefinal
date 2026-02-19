from sqlalchemy import create_engine, inspect
from database import Base

# Create an engine
engine = create_engine("sqlite:///./roperia.db", connect_args={"check_same_thread": False})

def inspect_db():
    inspector = inspect(engine)
    columns = inspector.get_columns('laundry_returns')
    print("Columns in 'laundry_returns' table:")
    for column in columns:
        print(f"- {column['name']} ({column['type']})")

if __name__ == "__main__":
    inspect_db()
