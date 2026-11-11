from connection import engine

from models import User,Venue,Booking,VenueImages,Favourites,Reviews
from models import Base

Base.metadata.create_all(bind=engine)