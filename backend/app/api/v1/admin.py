from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import models
from schemas import schemas
from config import UserRole
from core.dependency import get_db, admin_only


routers = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# @routers.get(
#     "/users",
#     response_model=list[schemas.UserResponse]
# )
# def get_all_users(
#     current_user: models.User = Depends(admin_only),
#     db: Session = Depends(get_db)
# ):
#     users = (
#         db.query(models.User)
#         .all()
#     )

    # return users


@routers.get(
    "/users",
    response_model=list[schemas.UserResponse]
)
def get_users(
    role: UserRole | None = None,
    current_user: models.User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    query = db.query(models.User)

    if role is not None:
        query = query.filter(models.User.role == role)

    return query.all()

@routers.get(
    "/users/{user_id}/bookings",
    response_model=list[schemas.BookingResponse]
)
def get_user_bookings(
    user_id: int,
    current_user: models.User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    user = (
        db.query(models.User)
        .filter(models.User.user_id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    bookings = (
        db.query(models.Booking)
        .filter(models.Booking.user_id == user_id)
        .all()
    )

    return bookings

@routers.get(
    "/users/{user_id}",
    response_model=schemas.UserResponse
)
def get_user(
    user_id: int,
    current_user: models.User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    user = (
        db.query(models.User)
        .filter(models.User.user_id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@routers.patch(
    "/users/{user_id}/role",
    response_model=schemas.UserResponse
)
def update_user_role(
    user_id: int,
    role_update: schemas.UserRoleUpdate,
    current_user: models.User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    user = (
        db.query(models.User)
        .filter(models.User.user_id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role"
        )

    user.role = role_update.role

    db.commit()
    db.refresh(user)

    return user

@routers.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_user(
    user_id: int,
    current_user: models.User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    user = (
        db.query(models.User)
        .filter(models.User.user_id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Admin cannot delete their own account
    if user.user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )

    # Check for active bookings
    active_booking = (
        db.query(models.Booking)
        .filter(
            models.Booking.user_id == user_id,
            models.Booking.status != "cancelled"
        )
        .first()
    )

    if active_booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete user because they have an active booking"
        )

    db.delete(user)
    db.commit()

    return None

@routers.patch(
    "/bookings/{booking_id}/cancel",
    response_model=schemas.BookingResponse
)
def admin_cancel_booking(
    booking_id: int,
    current_user: models.User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    booking = (
        db.query(models.Booking)
        .filter(models.Booking.booking_id == booking_id)
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    if booking.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking is already cancelled"
        )

    booking.status = "cancelled"

    db.commit()
    db.refresh(booking)

    return booking

@routers.get(
    "/bookings",
    response_model=list[schemas.BookingResponse]
)
def get_all_bookings(
    current_user: models.User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    bookings = (
        db.query(models.Booking)
        .all()
    )

    return bookings

@routers.get(
    "/bookings/{booking_id}",
    response_model=schemas.BookingResponse
)
def get_booking(
    booking_id: int,
    current_user: models.User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    booking = (
        db.query(models.Booking)
        .filter(models.Booking.booking_id == booking_id)
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    return booking

# @routers.get(
#     "/venues",
#     response_model=list[schemas.VenueResponse]
# )
# def get_all_venues(
#     current_user: models.User = Depends(admin_only),
#     db: Session = Depends(get_db)
# ):
#     venues = db.query(models.Venue).all()

#     return venues

@routers.get(
    "/venues",
    response_model=list[schemas.VenueResponse]
)
def get_all_venues(
    owner_id: int | None = None,
    current_user: models.User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    query = db.query(models.Venue)

    if owner_id is not None:
        query = query.filter(
            models.Venue.owner_id == owner_id
        )

    return query.all()


@routers.get(
    "/venues/{venue_id}",
    response_model=schemas.VenueResponse
)
def get_venue(
    venue_id: int,
    current_user: models.User = Depends(admin_only),
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

    return venue

@routers.patch(
    "/venues/{venue_id}",
    response_model=schemas.VenueResponse
)
def update_venue(
    venue_id: int,
    venue_update: schemas.VenuePatch,
    current_user: models.User = Depends(admin_only),
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

    update_data = venue_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(venue, field, value)

    db.commit()
    db.refresh(venue)

    return venue


@routers.delete(
    "/venues/{venue_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_venue(
    venue_id: int,
    current_user: models.User = Depends(admin_only),
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

    # Check for active bookings
    active_booking = (
        db.query(models.Booking)
        .filter(
            models.Booking.venue_id == venue_id,
            models.Booking.status != "cancelled"
        )
        .first()
    )

    if active_booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete venue because it has an active booking"
        )

    db.delete(venue)
    db.commit()

    return None

# @routers.post(
#     "/venues",
#     response_model=schemas.VenueResponse,
#     status_code=status.HTTP_201_CREATED
# )
# def create_venue(
#     venue: schemas.VenueCreate,
#     current_user: models.User = Depends(admin_only),
#     db: Session = Depends(get_db)
# ):
#     owner = (
#         db.query(models.User)
#         .filter(
#             # models.User.user_id == venue.owner_id,
#             models.User.role == UserRole.OWNER
#         )
#         .first()
#     )

#     if owner is None:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Owner not found"
#         )

#     new_venue = models.Venue(
#         title=venue.title,
#         address=venue.address,
#         capacity=venue.capacity,
#         price_per_hour=venue.price_per_hour,
#         # owner_id=venue.owner_id
#     )

#     db.add(new_venue)
#     db.commit()
#     db.refresh(new_venue)

#     return new_venue

@routers.post(
    "/venues",
    response_model=schemas.VenueResponse,
    status_code=status.HTTP_201_CREATED
)
def create_venue(
    venue: schemas.AdminVenueCreate,
    current_user: models.User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    # Check whether the selected owner exists
    owner = (
        db.query(models.User)
        .filter(
            models.User.user_id == venue.owner_id,
            models.User.role == schemas.UserRole.OWNER
        )
        .first()
    )

    if owner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner not found"
        )

    # Create the venue
    new_venue = models.Venue(
        title=venue.title,
        description=venue.description,
        address=venue.address,
        city=venue.city,
        price_per_hour=venue.price_per_hour,
        capacity=venue.capacity,
        owner_id=venue.owner_id
    )

    db.add(new_venue)
    db.commit()
    db.refresh(new_venue)

    return new_venue

@routers.patch(
    "/venues/{venue_id}/owner",
    response_model=schemas.VenueResponse
)
def change_venue_owner(
    venue_id: int,
    owner_update: schemas.VenueOwnerUpdate,
    current_user: models.User = Depends(admin_only),
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

    owner = (
        db.query(models.User)
        .filter(
            models.User.user_id == owner_update.owner_id,
            models.User.role == UserRole.OWNER
        )
        .first()
    )

    if owner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner not found"
        )

    venue.owner_id = owner_update.owner_id

    db.commit()
    db.refresh(venue)

    return venue

# @routers.get(
#     "/owners",
#     response_model=list[schemas.UserResponse]
# )
# def get_all_owners(
#     current_user: models.User = Depends(admin_only),
#     db: Session = Depends(get_db)
# ):
#     owners = (
#         db.query(models.User)
#         .filter(models.User.role == UserRole.OWNER)
#         .all()
#     )

#     return owners

@routers.get(
    "/owners/{owner_id}/venues",
    response_model=list[schemas.VenueResponse]
)
def get_owner_venues(
    owner_id: int,
    current_user: models.User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    owner = (
        db.query(models.User)
        .filter(
            models.User.user_id == owner_id,
            models.User.role == UserRole.OWNER
        )
        .first()
    )

    if owner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner not found"
        )

    venues = (
        db.query(models.Venue)
        .filter(models.Venue.owner_id == owner_id)
        .all()
    )

    return venues

@routers.get("/dashboard")
def get_admin_dashboard(
    current_user: models.User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    total_users = db.query(models.User).count()

    total_owners = (
        db.query(models.User)
        .filter(models.User.role == UserRole.OWNER)
        .count()
    )

    total_venues = db.query(models.Venue).count()

    total_bookings = db.query(models.Booking).count()

    active_bookings = (
        db.query(models.Booking)
        .filter(models.Booking.status != "cancelled")
        .count()
    )

    cancelled_bookings = (
        db.query(models.Booking)
        .filter(models.Booking.status == "cancelled")
        .count()
    )

    return {
        "total_users": total_users,
        "total_owners": total_owners,
        "total_venues": total_venues,
        "total_bookings": total_bookings,
        "active_bookings": active_bookings,
        "cancelled_bookings": cancelled_bookings
    }

@routers.get("/revenue")
def get_revenue(
    current_user: models.User = Depends(admin_only),
    db: Session = Depends(get_db)
):
    total_revenue = (
        db.query(func.sum(models.Booking.total_price))
        .filter(models.Booking.status != "cancelled")
        .scalar()
    )

    if total_revenue is None:
        total_revenue = 0

    return {
        "total_revenue": total_revenue
    }