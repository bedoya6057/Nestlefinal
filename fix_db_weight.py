from database import engine, Base
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            # Try to add weight column to laundry table
            conn.execute(text("ALTER TABLE laundry ADD COLUMN weight FLOAT DEFAULT 0"))
            conn.commit()
            print("Added weight column to laundry table")
        except Exception as e:
            print(f"Migration result (probably exists): {e}")

if __name__ == "__main__":
    migrate()
