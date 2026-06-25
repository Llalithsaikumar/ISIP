import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.utils.config import settings
from backend.utils.logging import logger

# Ensure the parent directory for SQLite database exists if it is a local path
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///"):
    db_path = db_url.replace("sqlite:///", "")
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        logger.info(f"Creating database directory: {db_dir}")
        os.makedirs(db_dir, exist_ok=True)

# Create engine settings for SQLite to handle multi-threaded FastAPI requests safely
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=False  # Set to True for SQL queries logging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    FastAPI Dependency to yield database sessions.
    Guarantees session closing after request lifecycle completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
