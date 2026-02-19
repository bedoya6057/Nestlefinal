from database import engine, Base
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE laundry_returns ADD COLUMN status VARCHAR"))
            conn.execute(text("ALTER TABLE laundry_returns ADD COLUMN observation TEXT"))
            conn.commit()
            print("Migration successful")
        except Exception as e:
            print(f"Migration failed (maybe columns exist): {e}")

if __name__ == "__main__":
    migrate()
