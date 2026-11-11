from pydantic import BaseModel,Field,ConfigDict
from typing import Optional
from datetime import datetime,time,date
from config import UserRole
# from enum import Enum

# class UserRole(Enum):
#     USER ="user"
#     OWNER="owner"
#     ADMIN="admin"

class UserCreate(BaseModel):
    username :str =Field(min_length=1,max_length=100)
    email:str =Field(min_length=1,max_length=50)
    password:str =Field(min_length=1,max_length=100)
    role:UserRole


class UserResponse(BaseModel):
    # model_config= ConfigDict(from_attributes=True)
    user_id:int
    username: str =Field(min_length=1,max_length=100)
    email :str =Field(min_length=1,max_length=100)
    role:UserRole


class UserUpdate(BaseModel):
    username:Optional[str] =Field(min_length=1,max_length=100) 
    email:Optional[str] =Field(min_length=1,max_length=100)
    password:Optional[str] =Field(min_length=1,max_length=100)
    role:Optional[str] =Field(min_length=1,max_length=100)


class UserRoleUpdate(BaseModel):
    role: UserRole


class VenueCreate(BaseModel):
    title:str =Field(min_length=1,max_length=100)
    description:str =Field(min_length=1,max_length=100)
    address:str=Field(min_length=1,max_length=100)
    city:str =Field(min_length=1,max_length=100)    
    price_per_hour:int
    capacity:Optional[int]=None




class VenueResponse(BaseModel):
    venue_id:int 
    owner_id:int 
    title:str =Field(min_length=1,max_length=100)
    city:str =Field(min_length=1,max_length=100)
    price_per_hour:int=Field(ge=1)
    capacity:Optional[int]=None

class VenueSearchResponse(BaseModel):
    venue_id: int
    title: str
    description: str
    address: str
    city: str
    price_per_hour: int
    capacity: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class OwnerVenueResponse(BaseModel):
    venue_id: int
    owner_id: int
    title: str
    description: str
    address: str
    city: str
    price_per_hour: int
    capacity: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class VenueUpdate(BaseModel):
    title:Optional[str]=Field(min_length=1,max_length=100)
    description:Optional[str]=Field(min_length=1,max_length=100)
    city:Optional[str]=Field(min_length=1,max_length=100)
    address:Optional[str]=Field(min_length=1,max_length=100)
    price_per_hour:Optional[int]
    capacity:Optional[int]=None

class VenuePatch(BaseModel):
    title: str | None = None
    description: str | None = None
    address: str | None = None
    city: str | None = None
    price_per_hour: int | None = None
    capacity: int | None = None

# class BookingCreate(BaseModel):
#     # user_id:int =Field(min_length=1,max_length=100)
#     venue_id:int = Field(gt=0)
#     booking_date:date=Field()
#     start_time:time=Field()
#     end_time:time=Field()

# class BookingResponse(BaseModel):
#     booking_id:int=Field()
#     user_id:int=Field()
#     venue_id:int=Field()
#     booking_date:date
#     start_time:time=Field()
#     end_time:time=Field()
#     status:str=Field()
#     total_price: int


class BookingCreate(BaseModel):
    venue_id: int = Field(gt=0)
    check_in_date: date
    check_out_date: date
    start_time: time
    end_time: time


class BookingResponse(BaseModel):
    booking_id: int
    user_id: int
    venue_id: int
    check_in_date: date
    check_out_date: date
    start_time: time
    end_time: time
    status: str
    total_price: int


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=1000)


class ReviewResponse(BaseModel):
    review_id: int
    user_id: int
    username: str
    venue_id: int
    rating: Optional[int] = None
    comment: Optional[str] = None


class VenueReviewsResponse(BaseModel):
    reviews: list[ReviewResponse]
    can_review: bool


# admin specific schema for admin venue creation
class AdminVenueCreate(VenueCreate):
    owner_id: int

# admin specific schema for updating the owner
class VenueOwnerUpdate(BaseModel):
    owner_id: int

class OwnerBookingResponse(BaseModel):
    booking_id: int
    user_id: int
    customer_name: str
    customer_email: str
    venue_id: int
    venue_title: str
    check_in_date: date
    check_out_date: date
    start_time: time
    end_time: time
    status: str
    total_price: float