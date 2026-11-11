from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from models import models
from schemas import schemas
from core.dependency import get_db, user_only, owner_only,owner_or_admin
from core.security import get_current_user

routers = APIRouter(prefix="/bookings", tags=["Bookings"])


# --------------------------------------------------
# 1. CREATE BOOKING
# --------------------------------------------------

@routers.post(
    "/createbooking",
    response_model=schemas.BookingResponse,
    status_code=status.HTTP_201_CREATED
)
def create_booking(
    booking: schemas.BookingCreate,
    current_user: models.User = Depends(user_only),
    db: Session = Depends(get_db)
):
    # Check whether the venue exists.
    venue = (
        db.query(models.Venue)
        .filter(models.Venue.venue_id == booking.venue_id)
        .first()
    )

    if venue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )

    # Check that the check-in date is not in the past.
    if booking.check_in_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-in date cannot be in the past"
        )

    # Combine dates and times into complete datetimes.
    check_in_datetime = datetime.combine(
        booking.check_in_date,
        booking.start_time
    )

    check_out_datetime = datetime.combine(
        booking.check_out_date,
        booking.end_time
    )

    # Check that checkout occurs after check-in.
    if check_out_datetime <= check_in_datetime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out must be after check-in"
        )

    # --------------------------------------------------
    # Check for overlapping bookings across dates
    # --------------------------------------------------

    # An existing booking starts before the requested
    # checkout, including bookings on earlier dates.
    existing_starts_before_checkout = or_(
        models.Booking.check_in_date < booking.check_out_date,
        and_(
            models.Booking.check_in_date == booking.check_out_date,
            models.Booking.start_time < booking.end_time
        )
    )

    # An existing booking ends after the requested
    # check-in, including bookings on later dates.
    existing_ends_after_checkin = or_(
        models.Booking.check_out_date > booking.check_in_date,
        and_(
            models.Booking.check_out_date == booking.check_in_date,
            models.Booking.end_time > booking.start_time
        )
    )

    overlapping_booking = (
        db.query(models.Booking)
        .filter(
            models.Booking.venue_id == booking.venue_id,
            models.Booking.status != "cancelled",
            existing_starts_before_checkout,
            existing_ends_after_checkin
        )
        .first()
    )

    if overlapping_booking:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Venue is already booked for the selected time"
        )

    # --------------------------------------------------
    # Calculate duration and total price
    # --------------------------------------------------

    duration = check_out_datetime - check_in_datetime
    duration_hours = duration.total_seconds() / 3600

    total_price = int(duration_hours * venue.price_per_hour)

    # --------------------------------------------------
    # Save the booking
    # --------------------------------------------------

    new_booking = models.Booking(
        user_id=current_user.user_id,
        venue_id=booking.venue_id,
        check_in_date=booking.check_in_date,
        check_out_date=booking.check_out_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        total_price=total_price
    )

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    return new_booking


# --------------------------------------------------
# 2. GET THE CURRENT USER'S BOOKINGS
# --------------------------------------------------

@routers.get(
    "/my",
    response_model=list[schemas.BookingResponse]
)
def get_my_bookings(
    current_user: models.User = Depends(user_only),
    db: Session = Depends(get_db)
):
    bookings = (
        db.query(models.Booking)
        .filter(
            models.Booking.user_id == current_user.user_id
        )
        .order_by(models.Booking.created_at.desc())
        .all()
    )

    return bookings


# --------------------------------------------------
# 3. GET A SINGLE BOOKING
# --------------------------------------------------

@routers.get(
    "/{booking_id}",
    response_model=schemas.BookingResponse
)
def get_booking(
    booking_id: int,
    current_user: models.User = Depends(user_only),
    db: Session = Depends(get_db)
):
    booking = (
        db.query(models.Booking)
        .filter(
            models.Booking.booking_id == booking_id,
            models.Booking.user_id == current_user.user_id
        )
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    return booking


# --------------------------------------------------
# 4. CANCEL A BOOKING
# --------------------------------------------------

@routers.patch(
    "/{booking_id}/cancel",
    response_model=schemas.BookingResponse
)
def cancel_booking(
    booking_id: int,
    current_user: models.User = Depends(user_only),
    db: Session = Depends(get_db)
):
    booking = (
        db.query(models.Booking)
        .filter(
            models.Booking.booking_id == booking_id,
            models.Booking.user_id == current_user.user_id
        )
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


@routers.patch(
    "/owner/bookings/{booking_id}/cancel",
    response_model=schemas.BookingResponse
)
def owner_cancel_booking(
    booking_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify owner role
    current_role = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else current_user.role
    )

    if current_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only venue owners can cancel bookings"
        )

    # Find booking
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

    # Verify venue ownership
    venue = (
        db.query(models.Venue)
        .filter(models.Venue.venue_id == booking.venue_id)
        .first()
    )

    if venue is None or venue.owner_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to cancel this booking"
        )

    # Prevent duplicate cancellation
    if booking.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking is already cancelled"
        )

    booking.status = "cancelled"

    db.commit()
    db.refresh(booking)

    return booking



# --------------------------------------------------
# 5. GET BOOKINGS FOR ALL VENUES OWNED BY THE OWNER
# --------------------------------------------------

@routers.get(
    "/owner",
    response_model=list[schemas.BookingResponse]
)
def get_owner_bookings(
    current_user: models.User = Depends(owner_only),
    db: Session = Depends(get_db)    
):
    print("OWNER ENDPOINT EXECUTED")    
    print("CURRENT USER:", current_user.user_id)
    print("CURRENT ROLE:", current_user.role)
    print("OWNER BOOKINGS ROUTE HIT")
    bookings = (
        db.query(models.Booking)
        .join(
            models.Venue,
            models.Booking.venue_id == models.Venue.venue_id
        )
        .filter(
            models.Venue.owner_id == current_user.user_id
        )
        .order_by(models.Booking.created_at.desc())
        .all()
    )

    return bookings

@routers.get(
    "/owner/allbookings",
    response_model=list[schemas.OwnerBookingResponse]
)
def get_owner_all_bookings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_role = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else current_user.role
    )

    if current_role != "owner":
        raise HTTPException(
            status_code=403,
            detail="Only venue owners can access these bookings"
        )

    bookings = (
        db.query(
            models.Booking.booking_id,
            models.Booking.user_id,
            models.User.username.label("customer_name"),
            models.User.email.label("customer_email"),
            models.Booking.venue_id,
            models.Venue.title.label("venue_title"),
            models.Booking.check_in_date,
            models.Booking.check_out_date,
            models.Booking.start_time,
            models.Booking.end_time,
            models.Booking.status,
            models.Booking.total_price
        )
        .join(
            models.Venue,
            models.Booking.venue_id == models.Venue.venue_id
        )
        .join(
            models.User,
            models.Booking.user_id == models.User.user_id
        )
        .filter(
            models.Venue.owner_id == current_user.user_id
        )
        .order_by(models.Booking.created_at.desc())
        .all()
    )

    return bookings

# --------------------------------------------------
# 6. GET BOOKINGS FOR A SPECIFIC VENUE
# --------------------------------------------------


@routers.get(
    "/owner/venue/{venue_id}",
    response_model=list[schemas.OwnerBookingResponse]
)
def get_venue_bookings(
    venue_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check owner role
    current_role = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else current_user.role
    )

    if current_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only venue owners can access venue bookings"
        )

    # Check whether venue exists
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

    # Verify venue ownership
    if venue.owner_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view bookings for this venue"
        )

    # Fetch bookings with customer and venue details
    bookings = (
        db.query(
            models.Booking.booking_id,
            models.Booking.user_id,
            models.User.username.label("customer_name"),
            models.User.email.label("customer_email"),
            models.Booking.venue_id,
            models.Venue.title.label("venue_title"),
            models.Booking.check_in_date,
            models.Booking.check_out_date,
            models.Booking.start_time,
            models.Booking.end_time,
            models.Booking.status,
            models.Booking.total_price
        )
        .join(
            models.User,
            models.Booking.user_id == models.User.user_id
        )
        .join(
            models.Venue,
            models.Booking.venue_id == models.Venue.venue_id
        )
        .filter(
            models.Booking.venue_id == venue_id
        )
        .order_by(models.Booking.created_at.desc())
        .all()
    )

    return bookings

