"""
Supabase Built-in Authentication Service
Uses Supabase client for authentication instead of custom JWT verification
"""

import os
import logging
import jwt
from typing import Optional, Dict, Any
from supabase import create_client, Client
from fastapi import HTTPException, status
from sqlalchemy import text

logger = logging.getLogger(__name__)

class SupabaseAuthService:
    """
    Authentication service using Supabase's built-in auth
    """
    
    def __init__(self):
        self.supabase_url = os.environ.get('SUPABASE_URL')
        self.supabase_service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
        self.supabase_anon_key = os.environ.get('SUPABASE_ANON_KEY')
        self.supabase_jwt_secret = os.environ.get('SUPABASE_JWT_SECRET')

        # Database connection for user_profiles table
        self.supabase_db_password = os.environ.get('SUPABASE_DB_PASSWORD')
        self.supabase_db_host = os.environ.get('SUPABASE_DB_HOST', 'db.wglvjoncodlrvkgleyvv.supabase.co')
        self.supabase_db_port = os.environ.get('SUPABASE_DB_PORT', '5432')
        self.supabase_db_name = os.environ.get('SUPABASE_DB_NAME', 'postgres')
        self.supabase_db_host_ipv4 = os.environ.get('SUPABASE_DB_HOST_IPV4')  # optional
        
        if not self.supabase_url or not self.supabase_service_key or not self.supabase_anon_key:
            raise ValueError("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY must be set")
        
        if not self.supabase_db_password:
            raise ValueError("SUPABASE_DB_PASSWORD must be set for user_profiles access")
        
        # Create Supabase client with service role key for backend operations
        self.supabase: Client = create_client(self.supabase_url, self.supabase_service_key)

        # JWKS client for projects using asymmetric JWT signing keys (ES256/RS256).
        # Only used when no symmetric JWT secret is configured.
        self.jwks_client = None
        if not self.supabase_jwt_secret and self.supabase_url:
            try:
                jwks_url = f"{self.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
                self.jwks_client = jwt.PyJWKClient(jwks_url)
            except Exception as exc:
                logger.warning(f"Could not initialize JWKS client: {exc}")

        logger.info("Supabase auth service initialized with user_profiles support")
        if self.supabase_jwt_secret:
            logger.info("Access tokens verified locally with the project JWT secret (HS256).")
        elif self.jwks_client is not None:
            logger.info("Access tokens verified locally via JWKS (asymmetric signing keys).")
        else:
            logger.warning(
                "No JWT secret or JWKS client available; access tokens will be verified "
                "via the Supabase auth server (slower, per-request network call)."
            )
    
    def get_user_from_profiles_table(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user information from user_profiles table
        
        Args:
            user_id (str): Supabase user ID
            
        Returns:
            Optional[Dict]: User information if found
        """
        try:
            response = self.supabase.table("user_profiles").select(
                "id,user_id,email,full_name,display_name,role,is_active,created_at,updated_at,last_login"
            ).eq("user_id", user_id).single().execute()
            data = response.data
            if data:
                logger.info(f"Found user in profiles table: {data.get('user_id')}")
                return {
                    "id": data.get("user_id"),
                    "sub": data.get("user_id"),
                    "email": data.get("email"),
                    "full_name": data.get("full_name"),
                    "display_name": data.get("display_name"),
                    "role": data.get("role"),
                    "is_active": data.get("is_active"),
                    "created_at": data.get("created_at"),
                    "updated_at": data.get("updated_at"),
                    "last_login": data.get("last_login"),
                    "user_metadata": {},
                    "app_metadata": {"role": data.get("role")},
                    "aud": "authenticated",
                    "exp": None,
                }
            else:
                logger.warning(f"No user found in profiles table for user_id: {user_id}")
                return None
        except Exception as e:
            logger.error(f"Error querying user_profiles table via Supabase: {e}")
            return None
    
    def _verify_with_secret(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify a Supabase access token locally using the project JWT secret.

        Validates the signature and expiry (and the standard "authenticated"
        audience). Returns the decoded claims, or None if the secret is not
        configured or the token is invalid/expired.
        """
        if not self.supabase_jwt_secret:
            return None
        try:
            return jwt.decode(
                token,
                self.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except jwt.ExpiredSignatureError:
            logger.info("Rejected an expired access token")
            return None
        except jwt.InvalidTokenError as exc:
            logger.warning(f"Rejected an invalid access token: {exc}")
            return None

    def _verify_with_jwks(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify a Supabase access token locally using the project's JWKS
        (asymmetric signing keys, ES256/RS256).

        Returns the decoded claims, or None for an invalid/expired token.
        Raises on infrastructure errors (e.g. JWKS fetch failure) so the caller
        can fall back to server-side verification.
        """
        signing_key = self.jwks_client.get_signing_key_from_jwt(token)
        try:
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                audience="authenticated",
            )
        except jwt.ExpiredSignatureError:
            logger.info("Rejected an expired access token")
            return None
        except jwt.InvalidTokenError as exc:
            logger.warning(f"Rejected an invalid access token: {exc}")
            return None

    def _verify_with_supabase(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify a token against the Supabase auth server.

        The auth server validates the signature and expiry server-side, so a
        returned user means the token is genuinely valid. Used when no local
        JWT secret is configured. Returns normalized claims, or None.
        """
        try:
            user_supabase = create_client(self.supabase_url, self.supabase_anon_key)
            # set_session expects (access_token, refresh_token); we only have the access token.
            user_supabase.auth.set_session(token, "")
            response = user_supabase.auth.get_user()
            if response and getattr(response, "user", None):
                user = response.user
                return {
                    "sub": user.id,
                    "email": user.email,
                    "user_metadata": user.user_metadata or {},
                    "app_metadata": user.app_metadata or {},
                    "role": (user.app_metadata or {}).get("role", "authenticated"),
                    "aud": user.aud,
                    "exp": getattr(user, "exp", None),
                }
            logger.warning("Supabase auth server returned no user for the provided token")
            return None
        except Exception as exc:
            logger.warning(f"Supabase auth-server token verification failed: {exc}")
            return None

    def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify a Supabase access token and return the authenticated user.

        The token's signature AND expiry are always verified. Verification is
        local when possible (HS256 via the project JWT secret, or ES256/RS256 via
        the project's JWKS), and falls back to the Supabase auth server only when
        no local path is available. Invalid or expired tokens are always rejected.

        Args:
            token (str): JWT token from the Authorization header

        Returns:
            Optional[Dict]: User information if the token is valid, else None
        """
        if not token:
            return None

        # Strip an optional "Bearer " prefix.
        if token.startswith("Bearer "):
            token = token[7:]

        # Verify the token. Each local path is authoritative: a None result means
        # the token is genuinely invalid/expired and must be rejected. Only fall
        # back to server-side verification when no local path could run (or an
        # infrastructure error prevented it).
        claims = None
        verified_locally = False

        if self.supabase_jwt_secret:
            claims = self._verify_with_secret(token)
            verified_locally = True
        elif self.jwks_client is not None:
            try:
                claims = self._verify_with_jwks(token)
                verified_locally = True
            except Exception as exc:
                logger.warning(f"JWKS verification unavailable, falling back to auth server: {exc}")

        if not verified_locally:
            claims = self._verify_with_supabase(token)

        if not claims:
            return None

        user_id = claims.get("sub")
        if not user_id:
            logger.warning("Verified token is missing a subject (sub) claim")
            return None

        # Enrich with profile data when available; fall back to verified claims.
        user_info = self.get_user_from_profiles_table(user_id)
        if user_info:
            user_info["exp"] = claims.get("exp")
            return user_info

        return {
            "id": user_id,
            "sub": user_id,
            "email": claims.get("email"),
            "user_metadata": claims.get("user_metadata", {}),
            "app_metadata": claims.get("app_metadata", {}),
            "role": claims.get("role", "authenticated"),
            "aud": claims.get("aud"),
            "exp": claims.get("exp"),
        }
    
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

# Global auth service instance
auth_service = SupabaseAuthService()

def get_current_user(token: str) -> Optional[Dict[str, Any]]:
    """
    Get current user from JWT token using Supabase's built-in auth
    
    Args:
        token (str): JWT token from Authorization header
        
    Returns:
        Optional[Dict]: User information if authenticated
    """
    return auth_service.get_user_from_token(token)

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
    return auth_service.require_auth(token)
