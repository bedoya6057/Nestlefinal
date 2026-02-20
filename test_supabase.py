import sys
from sqlalchemy import create_engine, text

# La contraseña tiene caracteres especiales (&&) que se codifican a %26%26
url = "postgresql://postgres.pmslnwffuxietvzeyylo:Cbnmpp2344%26%26@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

try:
    engine = create_engine(url)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT version();")).scalar()
        print(f"SUCCESS: Connected to {res}")
except Exception as e:
    print(f"ERROR: Connection failed:\n{e}")
