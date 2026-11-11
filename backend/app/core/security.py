from pwdlib import PasswordHash
from datetime import datetime,timedelta
from dotenv import load_dotenv
import os
from fastapi import HTTPException,Depends,Security,status
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session
from .connection import get_db
from models import models
from typing import Annotated


load_dotenv()

hashing_password=PasswordHash.recommended()
SECRET_KEY=os.getenv("SECRET_KEY")
ALGORITHM=os.getenv("Algorithm")


def hash_password(password:str)-> str:
    return hashing_password.hash(password)

def verify_password(password:str,hashed_password:str)-> bool:
    return hashing_password.verify(password,hashed_password)

def create_access_token(data: dict, expires_delta: timedelta =None):
    to_encode=data.copy()
    if expires_delta:
        expire= datetime.utcnow()+ expires_delta
    else:
        expire =datetime.utcnow()+ timedelta(minutes=15)
    to_encode.update({"exp":expire})
    encode_jwt=jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)
    return encode_jwt

security=HTTPBearer()

def get_current_user(token:HTTPAuthorizationCredentials= Security(security),db:Session=Depends(get_db)):
    try:
        payload=jwt.decode(token.credentials,SECRET_KEY,algorithms=[ALGORITHM])
        email:str=payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401,detail="Inavlid User Credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401,detail= "Token has Expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_query=db.query(models.User).filter(models.User.email==email).first()
    if user_query is None:
        raise HTTPException(status_code=401,detail="User not found")
    return user_query


# def get_current_active_user(current_user:Annotated[models.User,Depends(get_current_user)]):
#     if current_user.disabled:
#         raise HTTPException(status_code=400,detail="Inactive user")
#     return current_user

# class RoleChecker:
#     def __init__(self,allowed_roles):
#         self.allowed_roles=allowed_roles
    
#     def __call__(self,user=Depends(get_current_user)):
#         if user.role not in self.allowed_roles:
#             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="You don't have enough permissions")
#         return user

class RoleChecker:
    def __init__(self, allowed_roles):
        self.allowed_roles = allowed_roles

    def __call__(self, user=Depends(get_current_user)):
        user_role = user.role.value if hasattr(user.role, "value") else user.role

        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have enough permissions"
            )

        return user



