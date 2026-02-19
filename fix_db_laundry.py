from database import engine, SessionLocal
from sqlalchemy import text

def migrate_db():
    print("Migrating Database...")
    try:
        with engine.connect() as connection:
            # Check if column exists (naive check or just try to add it)
            # SQLite doesn't support IF NOT EXISTS in ALTER TABLE ADD COLUMN usually, but we can try.
            # If it fails, it means it might exist or table doesn't exist.
            try:
                connection.execute(text("ALTER TABLE laundry ADD COLUMN weight FLOAT DEFAULT 0"))
                print("Added 'weight' column to 'laundry' table.")
            except Exception as e:
                print(f"Column might already exist or table missing: {e}")
                
            # Also check if 'dni' column exists and if we should remove it? 
            # SQLite doesn't support DROP COLUMN easily. We will just ignore it.
            
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate_db()
