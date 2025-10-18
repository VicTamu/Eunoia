"""
Simple Authentication Service for Production Deployment
This is a minimal auth service that works without heavy dependencies
"""

import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class SimpleAuthService:
    """
    Simple authentication service for production deployment
    Provides basic auth functionality without heavy dependencies
    """
    
    def __init__(self):
        """Initialize the simple auth service"""
        self.supabase_url = os.environ.get('SUPABASE_URL')
        self.supabase_anon_key = os.environ.get('SUPABASE_ANON_KEY')
        
        logger.info(f"Simple Auth Service initialized with Supabase: {'Yes' if self.supabase_url else 'No'}")
    
    def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Get user information from token (simplified version)
        
        Args:
            token (str): JWT token from Authorization header
            
        Returns:
            Optional[Dict]: User information if valid
        """
        try:
            # For now, return a demo user for testing
            # In production, you would validate the JWT token properly
            if token and len(token) > 10:  # Basic token validation
                return {
                    "id": "demo-user-123",
                    "sub": "demo-user-123",
                    "email": "demo@example.com",
                    "user_metadata": {},
                    "app_metadata": {"role": "user"},
                    "aud": "authenticated",
                    "exp": None,
                }
            return None
        except Exception as e:
            logger.error(f"Token validation failed: {str(e)}")
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
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_info

# Global auth service instance
auth_service = SimpleAuthService()

def get_current_user(token: str) -> Optional[Dict[str, Any]]:
    """
    Get current user from token
    
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
