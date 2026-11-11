from pydantic import BaseModel
from sqlalchemy.orm import DeclarativeBase,Mapped,mapped_column,relationship
from sqlalchemy import DateTime,ForeignKey,Time,Date,String,func
from datetime import datetime,time,date
from config import UserRole

class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__='users'
    user_id:Mapped[int]=mapped_column(primary_key=True)
    username:Mapped[str]=mapped_column(
        String(50),
        nullable=False
    )
    email:Mapped[str]=mapped_column(
        String(255),
         unique=True,
         nullable=False
    )
    password_hash:Mapped[str]=mapped_column(
        String(255),
        nullable=False
    )
    role:Mapped[UserRole]=mapped_column(
        String(20),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
    DateTime,
    server_default=func.now()
    )

    favourites = relationship(
        "Favourites",
        back_populates="user"
    )


class Venue(Base):
    __tablename__='venue'
    venue_id:Mapped[int]=mapped_column(
        primary_key=True
    )
    owner_id:Mapped[int]=mapped_column(
        ForeignKey("users.user_id"))
    
    title:Mapped[str]=mapped_column(
        String(255),
        nullable=False
    )

    description:Mapped[str]=mapped_column(
        String(500),
        nullable=False
    )
    address:Mapped[str]=mapped_column(
        String(255),
        nullable=False
    )
    city:Mapped[str]=mapped_column(
        String(50),
        nullable=False
    )
    price_per_hour:Mapped[int]=mapped_column(
        nullable=False
    )   
    capacity:Mapped[int]=mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(
    DateTime,
    server_default=func.now()
    )
    
    favourites = relationship(
        "Favourites",
        back_populates="venue"
    )


# class Booking(Base):
#     __tablename__="booking"

#     booking_id:Mapped[int]=mapped_column(
#         primary_key=True
#     )
#     user_id:Mapped[int]=mapped_column(
#         ForeignKey("users.user_id")
#     )
#     venue_id:Mapped[int]=mapped_column(
#         ForeignKey("venue.venue_id")
#     )
#     booking_date:Mapped[date]=mapped_column(
#         Date
#         )
#     # booking_time:Mapped[time]=mapped_column(
#     #     Time
#     #     )

#     start_time:Mapped[time]=mapped_column(
#         Time
#         )
#     end_time:Mapped[time]=mapped_column(
#         Time
#         )
#     status:Mapped[str]=mapped_column(
#         String(20),
#         nullable=False,
#         default="confirmed"
#         )   
#     total_price:Mapped[int]=mapped_column(
#         nullable=False
#     )


#     created_at: Mapped[datetime] = mapped_column(
#     DateTime,
#     server_default=func.now()
#     )


# class VenueImages(Base):
#     __tablename__="venueimages"

#     image_id:Mapped[int]=mapped_column(
#         primary_key=True
#     )
#     venue_id:Mapped[int]=mapped_column(
#         ForeignKey("venue.venue_id")
#     )
#     image_url:Mapped[str]=mapped_column(
#         String(50),
#         nullable=False
#     )

class Booking(Base):
    __tablename__ = "booking"

    booking_id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),
        nullable=False
    )

    venue_id: Mapped[int] = mapped_column(
        ForeignKey("venue.venue_id"),
        nullable=False
    )

    check_in_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    check_out_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    start_time: Mapped[time] = mapped_column(
        Time,
        nullable=False
    )

    end_time: Mapped[time] = mapped_column(
        Time,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="confirmed"
    )

    total_price: Mapped[int] = mapped_column(
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now()
    )


class Favourites(Base):
    __tablename__="favourites"
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),
        primary_key=True
    )

    venue_id: Mapped[int] = mapped_column(
        ForeignKey("venue.venue_id"),
        primary_key=True
    )
    user = relationship(
        "User",
        back_populates="favourites"
        )
    venue = relationship(
        "Venue",
         back_populates="favourites")

class Reviews(Base):
    __tablename__='reviews'
    review_id:Mapped[int]=mapped_column(
        primary_key=True
    )
    user_id:Mapped[int]=mapped_column(
        ForeignKey("users.user_id")
    )
    venue_id:Mapped[int]=mapped_column(
        ForeignKey("venue.venue_id")
    )
    rating:Mapped[int | None]=mapped_column(
        nullable=True
    )
    comment:Mapped[str | None]=mapped_column(
        String(1000),
        nullable=True
    )
    