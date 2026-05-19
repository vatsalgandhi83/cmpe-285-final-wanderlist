from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import User
from schemas import RegisterRequest, LoginRequest, AuthResponse
from auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check duplicate
    existing = await db.execute(select(User).where(User.username == req.username))
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(username=req.username, password=hash_password(req.password), is_anon=0)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(user.id, user.username)
    return AuthResponse(token=token, username=user.username, user_id=user.id)

@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalars().first()
    if not user or not user.password or not verify_password(req.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_token(user.id, user.username)
    return AuthResponse(token=token, username=user.username, user_id=user.id)
