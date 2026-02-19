from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            # Add guide_number column
            print("Attempting to add guide_number column...")
            conn.execute(text("ALTER TABLE laundry ADD COLUMN guide_number VARCHAR"))
            print("Added guide_number column.")
        except Exception as e:
            print(f"guide_number error (maybe exists): {e}")

        try:
            # Add status column
            print("Attempting to add status column...")
            conn.execute(text("ALTER TABLE laundry ADD COLUMN status VARCHAR DEFAULT 'Pendiente'"))
            print("Added status column.")
        except Exception as e:
            print(f"status error (maybe exists): {e}")
            
        conn.commit()
        print("Migration finished.")

if __name__ == "__main__":
    migrate()
