from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_active_user
from app.core import security
from app.services import user_service
from app.schemas.token import Token
from app.schemas.user import UserCreate
from app.models.user import User

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
def login_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = user_service.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(user.id, expires_delta=access_token_expires),
        "token_type": "bearer",
    }

@router.post("/register", status_code=status.HTTP_201_CREATED)
@router.post("/signup", status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Public signup endpoint allowing anyone to create an account and immediately
    receive a signed JWT access token for authenticated access.
    """
    # 1. Check if email is already taken
    existing_user = user_service.get_user_by_email(db, email=user_in.email.strip().lower())
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in.",
        )
    
    # 2. Validate password
    if not user_in.password or len(user_in.password.strip()) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long.",
        )
    
    # 3. Sanitize and validate role
    valid_roles = {"ADMIN", "MAINTENANCE", "HOD", "VIEWER"}
    requested_role = (user_in.role or "VIEWER").strip().upper()
    user_in.role = requested_role if requested_role in valid_roles else "VIEWER"
    user_in.email = user_in.email.strip().lower()
    user_in.name = user_in.name.strip()

    # 4. Create user in PostgreSQL
    created_user = user_service.create_user(db, user_in)

    # 5. Issue JWT access token for instant session start
    access_token_expires = timedelta(minutes=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(created_user.id, expires_delta=access_token_expires)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": created_user.id,
            "email": created_user.email,
            "name": created_user.name,
            "role": created_user.role,
            "department_id": created_user.department_id,
            "is_active": created_user.is_active,
        },
    }

@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_active_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "department_id": current_user.department_id,
        "is_active": current_user.is_active,
    }
