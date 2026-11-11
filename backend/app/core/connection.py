from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
engine = create_engine(
    "mysql+pymysql://root:root@localhost:3306/bookmyvenue",
    echo=True
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

# database connection

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()
