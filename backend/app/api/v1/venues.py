from fastapi import Depends,HTTPException,APIRouter,status
from sqlalchemy.orm import Session
from typing import List

from models import models
from schemas import schemas
from core.dependency import (
    get_db,
    owner_only,
    owner_or_admin,
    user_or_owner_or_admin,
    user_only,
)
from core.security import RoleChecker,get_current_user


routers=APIRouter(prefix="/venues",tags=["Venues"])


@routers.post("/addvenues",response_model=schemas.VenueResponse,status_code=status.HTTP_201_CREATED)
def create_venues(venues:schemas.VenueCreate,current_user=Depends(owner_only),db:Session=Depends(get_db)):
    new_venue=models.Venue(
        owner_id=current_user.user_id,
        title=venues.title,
        description=venues.description,
        address=venues.address,
        city=venues.city,
        price_per_hour=venues.price_per_hour,
        capacity=venues.capacity
        )
    db.add(new_venue)
    db.commit()
    db.refresh(new_venue)

    return new_venue

@routers.get(
    "/",
    response_model=list[schemas.VenueSearchResponse]
)
def get_all_venues(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    venues = (
        db.query(models.Venue)
        .all()
    )

    return venues
#     return venues


@routers.get(
    "/myvenues",
    response_model=list[schemas.OwnerVenueResponse]
)
def get_my_venues(
    db: Session = Depends(get_db),
    current_user=Depends(owner_only)
):
    venues = (
        db.query(models.Venue)
        .filter(models.Venue.owner_id == current_user.user_id)
        .all()
    )

    return venues

@routers.get(
    "/location/{city}",
    response_model=list[schemas.VenueSearchResponse]
)
def get_venues_by_location(
    city: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    venues = (
        db.query(models.Venue)
        .filter(models.Venue.city == city)
        .all()
    )
    return venues


@routers.get(
    "/{venue_id}/reviews",
    response_model=schemas.VenueReviewsResponse
)
def get_venue_reviews(
    venue_id: int,
    current_user: models.User = Depends(get_current_user),
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

    review_rows = (
        db.query(
            models.Reviews,
            models.User.username.label("username")
        )
        .join(
            models.User,
            models.Reviews.user_id == models.User.user_id
        )
        .filter(models.Reviews.venue_id == venue_id)
        .order_by(models.Reviews.review_id.desc())
        .all()
    )

    reviews = [
        {
            "review_id": review.review_id,
            "user_id": review.user_id,
            "username": username,
            "venue_id": review.venue_id,
            "rating": review.rating,
            "comment": review.comment,
        }
        for review, username in review_rows
    ]

    current_role = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else current_user.role
    )
    can_review = False

    if current_role == "user":
        can_review = (
            db.query(models.Booking)
            .filter(
                models.Booking.user_id == current_user.user_id,
                models.Booking.venue_id == venue_id,
                models.Booking.status != "cancelled"
            )
            .first()
            is not None
        )

    return {"reviews": reviews, "can_review": can_review}


@routers.post(
    "/{venue_id}/reviews",
    response_model=schemas.ReviewResponse,
    status_code=status.HTTP_201_CREATED
)
def create_venue_review(
    venue_id: int,
    review: schemas.ReviewCreate,
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

    eligible_booking = (
        db.query(models.Booking)
        .filter(
            models.Booking.user_id == current_user.user_id,
            models.Booking.venue_id == venue_id,
            models.Booking.status != "cancelled"
        )
        .first()
    )

    if eligible_booking is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must have an active booking for this venue to review it"
        )

    comment = review.comment.strip() if review.comment else None

    new_review = models.Reviews(
        user_id=current_user.user_id,
        venue_id=venue_id,
        rating=review.rating,
        comment=comment
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return {
        "review_id": new_review.review_id,
        "user_id": new_review.user_id,
        "username": current_user.username,
        "venue_id": new_review.venue_id,
        "rating": new_review.rating,
        "comment": new_review.comment,
    }

@routers.get(
    "/type/{title}",
    response_model=list[schemas.VenueSearchResponse]
)
def get_venues_by_type(
    title: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    venues = (
        db.query(models.Venue)
        .filter(models.Venue.title.like(f"%{title}%"))
        .all()
    )

    return venues



@routers.get(
    "/venueid/{id}",
    response_model=schemas.VenueResponse
)
def get_venues_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    venue = (
        db.query(models.Venue)
        .filter(models.Venue.venue_id == id)
        .first()
    )

    if venue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )

    return venue

@routers.put(
    "/update/{id}",
    response_model=schemas.VenueResponse
)
def update_venue(
    id: int,
    venue: schemas.VenueUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(owner_or_admin)
):

    existing_venue = (
        db.query(models.Venue)
        .filter(models.Venue.venue_id == id)
        .first()
    )

    if existing_venue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )

    # If the logged-in user is an owner,
    # ensure they own this venue.
    # Admins can update any venue.
    if (
        current_user.role == "owner"
        and existing_venue.owner_id != current_user.user_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to update this venue."
        )

    existing_venue.title = venue.title
    existing_venue.description = venue.description
    existing_venue.address = venue.address
    existing_venue.city = venue.city
    existing_venue.price_per_hour = venue.price_per_hour
    existing_venue.capacity = venue.capacity

    db.commit()
    db.refresh(existing_venue)

    return existing_venue


@routers.patch("/patch/{id}", response_model=schemas.VenueResponse)
def patch_venue(
    id: int,
    venue: schemas.VenuePatch,
    db: Session = Depends(get_db),
    current_user=Depends(owner_or_admin)
):

    existing_venue = (
        db.query(models.Venue)
        .filter(models.Venue.venue_id == id)
        .first()
    )

    if existing_venue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )

    if (
        current_user.role == "owner"
        and existing_venue.owner_id != current_user.user_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to update this venue."
        )

    update_data = venue.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(existing_venue, key, value)

    db.commit()
    db.refresh(existing_venue)

    return existing_venue



@routers.delete("/delete/{id}", status_code=status.HTTP_200_OK)
def delete_venue(
    id: int,
    db: Session = Depends(get_db),
    current_user=Depends(owner_or_admin)
):
    # 1. Find the venue
    existing_venue = (
        db.query(models.Venue)
        .filter(models.Venue.venue_id == id)
        .first()
    )

    # 2. Check if venue exists
    if existing_venue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )

    # 3. Owner can delete only their own venue
    #    Admin can delete any venue
    if (
        current_user.role == "owner"
        and existing_venue.owner_id != current_user.user_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this venue."
        )

    # 4. Mark the venue for deletion
    db.delete(existing_venue)

    # 5. Actually execute the DELETE in the database
    db.commit()

    return {
        "message": "Venue deleted successfully"
    }

 
