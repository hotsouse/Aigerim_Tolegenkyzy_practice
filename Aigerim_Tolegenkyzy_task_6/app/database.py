from sqlmodel import create_engine,SQLModel,Session

DATABASE_URL="postgresql://ajger2:aigerim@localhost/ajger2"
engine=create_engine(DATABASE_URL,echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    
def get_session():
    with Session(engine) as session:
        yield session