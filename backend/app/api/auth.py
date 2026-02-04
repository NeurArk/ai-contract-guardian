"""Auth API endpoints.

Ce module définit les endpoints pour l'authentification.
"""

from datetime import timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_current_user_id,
    get_password_hash,
    verify_password,
    verify_refresh_token,
)
from app.db.session import get_db, get_redis_client
from app.models import User, UserCreate, UserLogin, UserResponse, TokenRefresh

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Créer un nouveau compte utilisateur.
    
    Args:
        user_data: Données de l'utilisateur
        db: Session de base de données
        
    Returns:
        L'utilisateur créé
        
    Raises:
        HTTPException: Si l'email est déjà utilisé
    """
    # Vérifie si l'email existe déjà
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé",
        )
    
    # Crée le nouvel utilisateur
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user


@router.post("/login")
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Connecter un utilisateur et retourner les tokens JWT.
    
    Args:
        credentials: Email et mot de passe
        db: Session de base de données
        
    Returns:
        Tokens d'accès et de rafraîchissement
        
    Raises:
        HTTPException: Si les identifiants sont invalides
    """
    # Recherche l'utilisateur
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé",
        )
    
    # Crée les tokens
    token_data = {"sub": str(user.id), "email": user.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
    }


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Récupérer le profil de l'utilisateur connecté.
    
    Args:
        current_user_id: ID de l'utilisateur connecté
        db: Session de base de données
        
    Returns:
        Le profil utilisateur
        
    Raises:
        HTTPException: Si l'utilisateur n'est pas trouvé
    """
    result = await db.execute(select(User).where(User.id == current_user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé",
        )
    
    return user


@router.post("/refresh")
async def refresh_token(
    token_data: TokenRefresh,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Refresh access token using refresh token.
    
    Implements refresh token rotation - a new refresh token is issued
    and the old one is invalidated.
    
    Args:
        token_data: Refresh token
        request: FastAPI request object
        db: Session de base de données
        
    Returns:
        New access token and refresh token
        
    Raises:
        HTTPException: If refresh token is invalid or revoked
    """
    redis = await get_redis_client()
    
    # Check if token is blacklisted
    if redis:
        is_blacklisted = await redis.get(f"blacklist:refresh:{token_data.refresh_token}")
        if is_blacklisted:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # Verify refresh token
    payload = verify_refresh_token(token_data.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Blacklist the old refresh token
    if redis:
        # Get token expiry from payload
        exp = payload.get("exp")
        if exp:
            ttl = int(exp) - int(__import__('time').time())
            if ttl > 0:
                await redis.setex(
                    f"blacklist:refresh:{token_data.refresh_token}",
                    ttl,
                    "1"
                )
    
    # Create new tokens (token rotation)
    token_data_new = {"sub": str(user.id), "email": user.email}
    new_access_token = create_access_token(token_data_new)
    new_refresh_token = create_refresh_token(token_data_new)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(
    request: Request,
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """Logout user and invalidate tokens.
    
    Args:
        request: FastAPI request object
        current_user_id: ID of the current user
        
    Returns:
        Success message
    """
    redis = await get_redis_client()
    
    if redis:
        # Get authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            access_token = auth_header[7:]
            
            # Blacklist access token
            try:
                from app.core.security import decode_token
                payload = decode_token(access_token)
                if payload and payload.get("exp"):
                    ttl = int(payload.get("exp")) - int(__import__('time').time())
                    if ttl > 0:
                        await redis.setex(
                            f"blacklist:access:{access_token}",
                            ttl,
                            "1"
                        )
            except Exception:
                pass  # Ignore errors during logout
        
        # Clear any user-specific cache
        await redis.delete(f"user:{current_user_id}")
    
    return {"message": "Successfully logged out"}


@router.post("/logout-all")
async def logout_all_devices(
    current_user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """Logout from all devices by invalidating all user tokens.
    
    Args:
        current_user_id: ID of the current user
        
    Returns:
        Success message
    """
    redis = await get_redis_client()
    
    if redis:
        # Increment token version to invalidate all existing tokens
        await redis.incr(f"user:{current_user_id}:token_version")
        # Clear user cache
        await redis.delete(f"user:{current_user_id}")
    
    return {"message": "Successfully logged out from all devices"}
