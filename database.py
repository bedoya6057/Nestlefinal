from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os
import sys

import os
import sys

# La URL de Supabase IPv4 Session Pooler con los caracteres especiales (&&) codificados como %26%26
SUPABASE_URL = "postgresql://postgres.pmslnwffuxietvzeyylo:Cbnmpp2344%26%26@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# Usamos la variable de entorno DATABASE_URL si existe (ideal para Render),
# de lo contrario, usamos directamente la de Supabase.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", SUPABASE_URL)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
