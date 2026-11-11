from fastapi import Depends,status,HTTPException,APIRouter
from sqlalchemy.orm import Session

from models import models
from schemas import schemas

from core.dependency import get_db, user_only
from core.security import hash_password,verify_password,create_access_token,get_current_user



router=APIRouter(prefix="/users",tags=["users"])

@router.post("/signup",response_model=schemas.UserResponse,status_code=status.HTTP_201_CREATED)
def create_user(user:schemas.UserCreate,db:Session=Depends(get_db)):
    user_query=db.query(models.User).filter(models.User.email==user.email).first()
    if user_query:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="User is already registered")
    hashed_password=hash_password(user.password)
    # print(hashed_password)
    new_user=models.User(username=user.username,email=user.email,password_hash=hashed_password,role=user.role.value)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    # print(hashed_password)
    return new_user
    

@router.post("/login")
def logging_in(email:str,password:str,db:Session=Depends(get_db)):
    user_query=db.query(models.User).filter(models.User.email==email).first()
    if not user_query:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid mail or password")
    verify_pass=verify_password(password,user_query.password_hash)
    if not verify_pass:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid mail or password")
    access_token=create_access_token(data={"sub":user_query.email})
    return {"access token":access_token, "token_type":"bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_current_user(
    current_user: models.User = Depends(get_current_user)
):
    return current_user


@router.get(
    "/favourites",
    response_model=list[schemas.VenueSearchResponse]
)
def get_my_favourites(
    current_user: models.User = Depends(user_only),
    db: Session = Depends(get_db)
):
    return (
        db.query(models.Venue)
        .join(
            models.Favourites,
            models.Favourites.venue_id == models.Venue.venue_id
        )
        .filter(models.Favourites.user_id == current_user.user_id)
        .all()
    )


@router.post(
    "/favourites/{venue_id}",
    response_model=schemas.VenueSearchResponse,
    status_code=status.HTTP_201_CREATED
)
def add_favourite(
    venue_id: int,
    current_user: models.User = Depends(user_only),
    db: Session = Depends(get_db)
):
    venue = (
        db.query(models.Venue)
        .filter(models.Venue.venue_id == venue_id)
        .first()
    )

    if venue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )

    existing_favourite = (
        db.query(models.Favourites)
        .filter(
            models.Favourites.user_id == current_user.user_id,
            models.Favourites.venue_id == venue_id
        )
        .first()
    )

    if existing_favourite is None:
        db.add(
            models.Favourites(
                user_id=current_user.user_id,
                venue_id=venue_id
            )
        )
        db.commit()

    return venue


@router.delete(
    "/favourites/{venue_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def remove_favourite(
    venue_id: int,
    current_user: models.User = Depends(user_only),
    db: Session = Depends(get_db)
):
    favourite = (
        db.query(models.Favourites)
        .filter(
            models.Favourites.user_id == current_user.user_id,
            models.Favourites.venue_id == venue_id
        )
        .first()
    )

    if favourite is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favourite not found"
        )

    db.delete(favourite)
    db.commit()
