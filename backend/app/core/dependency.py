from .connection import SessionLocal

from .security import RoleChecker

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()

    
# user_only=RoleChecker(["user"])
# user_or_owner_or_admin=RoleChecker(["user","admin","owner"])
# owner_only=RoleChecker(["owner"])
# admin_only=RoleChecker(["admin"])
# owner_or_admin=RoleChecker(["admin","owner"])

user_only = RoleChecker(["user"])
user_or_owner_or_admin = RoleChecker(["user", "admin", "owner"])
owner_only = RoleChecker(["owner"])
admin_only = RoleChecker(["admin"])
owner_or_admin = RoleChecker(["admin", "owner"])

# print("USER ONLY:", user_only.allowed_roles)
# print("OWNER ONLY:", owner_only.allowed_roles)