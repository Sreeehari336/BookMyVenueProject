from fastapi import FastAPI, Request
from api.v1 import users,venues,bookings,admin
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(venues.routers)
app.include_router(bookings.routers)
app.include_router(admin.routers)

@app.get("/")
def welcome_page():
    return {"message":"Welcome to Home Page"}


# @app.post("/createuser")
# def create_user(user:schemas.UserCreate,db:Session=Depends(get_db)):
#     username=db.query(models.User).filter(models.User.email== user.email).first()
#     if username:
#         raise HTTPException(status_code=400, detail="Email already exists")
#     # hashing_password=PasswordHash.recommended()
#     hashed_password=hash_password(user.password)
#     username=models.User(username=user.username,email=user.email,password_hash=hashed_password,role=user.role)
#     #  
#     # if username.role.lower() not in allowed_roles:
#     #     raise HTTPException(status_code=400,detail='Roles can only be either user or an owner')
#     db.add(username)
#     db.commit()
#     db.refresh(username)
#     return {"username":username.username,  "Email":username.email, "Role":username.role}

# @app.post("/login")
# def authenticate_user(email:str,password:str, db: Session=Depends(get_db)):
#     user=db.query(models.User).filter(models.User.email==email).first()
#     if not user or not verify_password(password,user.password_hash):
#         raise HTTPException(status_code=401,detail="Username or password is incorrect")
#     return user











