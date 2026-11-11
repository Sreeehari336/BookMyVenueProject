from enum import Enum

class UserRole(str, Enum):
    USER ="user"
    OWNER="owner"
    ADMIN="admin"

