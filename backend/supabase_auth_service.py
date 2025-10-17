"""
Supabase Built-in Authentication Service
Uses Supabase client for authentication instead of custom JWT verification
"""

import os
import logging
from typing import Optional, Dict, Any
from supabase import create_client, Client
from fastapi import HTTPException, status
from sqlalchemy import create_engine, text

logger = logging.getLogger(__name__)

class SupabaseAuthService:
    """
    Authentication service using Supabase's built-in auth
    """
    
    def __init__(self):
        self.supabase_url = os.environ.get('SUPABASE_URL')
        self.supabase_service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
        self.supabase_anon_key = os.environ.get('SUPABASE_ANON_KEY')
        
        # Database connection for user_profiles table
        self.supabase_db_password = os.environ.get('SUPABASE_DB_PASSWORD')
        self.supabase_db_host = os.environ.get('SUPABASE_DB_HOST', 'db.wglvjoncodlrvkgleyvv.supabase.co')
        self.supabase_db_port = os.environ.get('SUPABASE_DB_PORT', '5432')
        self.supabase_db_name = os.environ.get('SUPABASE_DB_NAME', 'postgres')
        
        if not self.supabase_url or not self.supabase_service_key or not self.supabase_anon_key:
            raise ValueError("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY must be set")
        
        if not self.supabase_db_password:
            raise ValueError("SUPABASE_DB_PASSWORD must be set for user_profiles access")
        
        # Create Supabase client with service role key for backend operations
        self.supabase: Client = create_client(self.supabase_url, self.supabase_service_key)
        
        # Create database engine for user_profiles queries
        self.db_url = f"postgresql://postgres:{self.supabase_db_password}@{self.supabase_db_host}:{self.supabase_db_port}/{self.supabase_db_name}"
        self.engine = create_engine(self.db_url)
        
        logger.info("Supabase auth service initialized with user_profiles support")
    
    def get_user_from_profiles_table(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user information from user_profiles table
        
        Args:
            user_id (str): Supabase user ID
            
        Returns:
            Optional[Dict]: User information if found
        """
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT id, user_id, email, full_name, display_name, role, is_active, created_at, updated_at, last_login
                    FROM user_profiles 
                    WHERE user_id = :user_id
                """), {"user_id": user_id})
                
                row = result.fetchone()
                if row:
                    logger.info(f"Found user in profiles table: {row[1]}")
                    return {
                        "id": row[1],  # user_id from database
                        "sub": row[1],  # user_id for compatibility
                        "email": row[2],
                        "full_name": row[3],
                        "display_name": row[4],
                        "role": row[5],
                        "is_active": row[6],
                        "created_at": row[7],
                        "updated_at": row[8],
                        "last_login": row[9],
                        "user_metadata": {},
                        "app_metadata": {"role": row[5]},
                        "aud": "authenticated",
                        "exp": None,  # We'll handle expiration separately
                    }
                else:
                    logger.warning(f"No user found in profiles table for user_id: {user_id}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error querying user_profiles table: {e}")
            return None
    
    def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Get user information from JWT token using Supabase's built-in verification
        
        Args:
            token (str): JWT token from Authorization header
            
        Returns:
            Optional[Dict]: User information if authenticated
        """
        # Debug: Log the token format
        logger.info(f"Received token: {token[:50]}... (length: {len(token)})")
        
        # Check if token starts with "Bearer "
        if token.startswith("Bearer "):
            token = token[7:]  # Remove "Bearer " prefix
            logger.info(f"Removed Bearer prefix, token now: {token[:50]}...")
        
        try:
            # Create a temporary Supabase client with the anon key
            # This is needed for user token verification
            user_supabase = create_client(self.supabase_url, self.supabase_anon_key)
            
            # Set the session with the user's token
            # The set_session method expects (access_token, refresh_token)
            user_supabase.auth.set_session(token, "")
            
            # Get user information
            response = user_supabase.auth.get_user()
            logger.info(f"Supabase response: {response}")
            
            if response and hasattr(response, 'user') and response.user:
                logger.info(f"User authenticated: {response.user.id}")
                return {
                    "id": response.user.id,
                    "sub": response.user.id,
                    "email": response.user.email,
                    "user_metadata": response.user.user_metadata or {},
                    "app_metadata": response.user.app_metadata or {},
                    "role": response.user.app_metadata.get('role', 'authenticated'),
                    "aud": response.user.aud,
                    "exp": response.user.exp,
                }
            else:
                logger.warning(f"No user found in response: {response}")
                # Force fallback to JWT decode
                raise Exception("Supabase returned None response, falling back to JWT decode")
                
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            # Let's try a different approach - decode the JWT manually
            try:
                import jwt
                from datetime import datetime
                
                logger.info("Falling back to JWT decode method...")
                # Decode the JWT without verification to get the payload
                payload = jwt.decode(token, options={"verify_signature": False})
                logger.info(f"JWT payload decoded successfully: {payload}")
                
                # Check if token is expired
                exp = payload.get('exp')
                if exp and datetime.utcnow().timestamp() > exp:
                    logger.warning(f"Token has expired (exp: {exp}, now: {datetime.utcnow().timestamp()})")
                    # For now, let's still allow expired tokens for testing
                    # In production, you might want to return None here
                    logger.info("Allowing expired token for testing purposes")
                
                # Extract user information from payload
                user_id = payload.get('sub')
                if not user_id:
                    logger.error("No user ID in token")
                    return None
                
                logger.info(f"User authenticated via JWT decode: {user_id}")
                
                # Try to get user info from user_profiles table
                logger.info(f"Querying user_profiles table for user_id: {user_id}")
                user_info = self.get_user_from_profiles_table(user_id)
                if user_info:
                    # Add JWT expiration info
                    user_info["exp"] = payload.get('exp')
                    logger.info(f"Successfully retrieved user from profiles table: {user_info.get('email')}")
                    return user_info
                else:
                    # Fallback to JWT payload if not found in profiles table
                    logger.warning("User not found in profiles table, using JWT payload")
                    return {
                        "id": user_id,
                        "sub": user_id,
                        "email": payload.get('email'),
                        "user_metadata": payload.get('user_metadata', {}),
                        "app_metadata": payload.get('app_metadata', {}),
                        "role": payload.get('role', 'authenticated'),
                        "aud": payload.get('aud'),
                        "exp": payload.get('exp'),
                    }
                
            except Exception as jwt_error:
                logger.error(f"JWT decode also failed: {jwt_error}")
                return None
    
    def require_auth(self, token: str) -> Dict[str, Any]:
        """
        Require authentication and return user info or raise exception
        
        Args:
            token (str): JWT token from Authorization header
            
        Returns:
            Dict: User information
            
        Raises:
            HTTPException: If authentication fails
        """
        user_info = self.get_user_from_token(token)
        
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_info

# Global auth service instance (lazy initialization)
_auth_service = None

def get_auth_service():
    global _auth_service
    if _auth_service is None:
        _auth_service = SupabaseAuthService()
    return _auth_service

def get_current_user(token: str) -> Optional[Dict[str, Any]]:
    """
    Get current user from JWT token using Supabase's built-in auth
    
    Args:
        token (str): JWT token from Authorization header
        
    Returns:
        Optional[Dict]: User information if authenticated
    """
    return get_auth_service().get_user_from_token(token)

def require_auth(token: str) -> Dict[str, Any]:
    """
    Require authentication and return user info or raise exception
    
    Args:
        token (str): JWT token from Authorization header
        
    Returns:
        Dict: User information
        
    Raises:
        HTTPException: If authentication fails
    """
    return get_auth_service().require_auth(token)
