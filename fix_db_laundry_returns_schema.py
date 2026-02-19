from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            # Add guide_number column to laundry_returns
            print("Attempting to add guide_number column to laundry_returns...")
            conn.execute(text("ALTER TABLE laundry_returns ADD COLUMN guide_number VARCHAR"))
            conn.commit()
            print("Added guide_number column.")
        except Exception as e:
            print(f"guide_number error (maybe exists): {e}")

if __name__ == "__main__":
    migrate()
