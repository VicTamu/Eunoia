"""
Standardized Error Handling System for Eunoia Journal
Provides consistent error handling, logging, and response formatting across all services
"""

import logging
import traceback
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, Union
from enum import Enum
from dataclasses import dataclass
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse

# Set up structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ErrorCode(Enum):
    """Standardized error codes for the application"""
    # Authentication & Authorization
    AUTH_TOKEN_MISSING = "AUTH_001"
    AUTH_TOKEN_INVALID = "AUTH_002"
    AUTH_TOKEN_EXPIRED = "AUTH_003"
    AUTH_INSUFFICIENT_PERMISSIONS = "AUTH_004"
    
    # Database & Data
    DB_CONNECTION_ERROR = "DB_001"
    DB_QUERY_ERROR = "DB_002"
    DB_CONSTRAINT_ERROR = "DB_003"
    DATA_NOT_FOUND = "DATA_001"
    DATA_VALIDATION_ERROR = "DATA_002"
    DATA_DUPLICATE_ERROR = "DATA_003"
    
    # ML & AI Services
    ML_MODEL_LOAD_ERROR = "ML_001"
    ML_ANALYSIS_ERROR = "ML_002"
    ML_API_ERROR = "ML_003"
    ML_FALLBACK_ERROR = "ML_004"
    
    # External Services
    EXTERNAL_API_ERROR = "EXT_001"
    EXTERNAL_TIMEOUT = "EXT_002"
    EXTERNAL_RATE_LIMIT = "EXT_003"
    
    # General Application
    INTERNAL_SERVER_ERROR = "APP_001"
    VALIDATION_ERROR = "APP_002"
    CONFIGURATION_ERROR = "APP_003"
    NETWORK_ERROR = "APP_004"

class ErrorSeverity(Enum):
    """Error severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class ErrorContext:
    """Context information for errors"""
    request_id: str
    user_id: Optional[str] = None
    endpoint: Optional[str] = None
    timestamp: datetime = None
    additional_data: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()

@dataclass
class StandardError:
    """Standardized error structure"""
    code: ErrorCode
    message: str
    detail: Optional[str] = None
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
    context: Optional[ErrorContext] = None
    original_exception: Optional[Exception] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for JSON response"""
        return {
            "error": {
                "code": self.code.value,
                "message": self.message,
                "detail": self.detail,
                "severity": self.severity.value,
                "request_id": self.context.request_id if self.context else None,
                "timestamp": self.context.timestamp.isoformat() if self.context else None,
                "user_id": self.context.user_id if self.context else None,
                "endpoint": self.context.endpoint if self.context else None
            }
        }

class ErrorHandler:
    """Centralized error handling class"""
    
    @staticmethod
    def create_error_context(
        user_id: Optional[str] = None,
        endpoint: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> ErrorContext:
        """Create error context with unique request ID"""
        return ErrorContext(
            request_id=str(uuid.uuid4()),
            user_id=user_id,
            endpoint=endpoint,
            additional_data=additional_data
        )
    
    @staticmethod
    def log_error(error: StandardError, include_traceback: bool = True) -> None:
        """Log error with appropriate level based on severity"""
        log_message = f"[{error.code.value}] {error.message}"
        if error.detail:
            log_message += f" - {error.detail}"
        
        if error.context:
            log_message += f" | Request: {error.context.request_id}"
            if error.context.user_id:
                log_message += f" | User: {error.context.user_id}"
        
        if include_traceback and error.original_exception:
            log_message += f"\nTraceback: {traceback.format_exc()}"
        
        # Log based on severity
        if error.severity == ErrorSeverity.CRITICAL:
            logger.critical(log_message)
        elif error.severity == ErrorSeverity.HIGH:
            logger.error(log_message)
        elif error.severity == ErrorSeverity.MEDIUM:
            logger.warning(log_message)
        else:
            logger.info(log_message)
    
    @staticmethod
    def create_http_exception(
        error: StandardError,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    ) -> HTTPException:
        """Create HTTPException from StandardError"""
        ErrorHandler.log_error(error)
        return HTTPException(
            status_code=status_code,
            detail=error.to_dict()
        )
    
    @staticmethod
    def create_json_response(
        error: StandardError,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    ) -> JSONResponse:
        """Create JSONResponse from StandardError"""
        ErrorHandler.log_error(error)
        return JSONResponse(
            status_code=status_code,
            content=error.to_dict()
        )

# Predefined error creators for common scenarios
class ErrorFactory:
    """Factory for creating common error types"""
    
    @staticmethod
    def authentication_error(
        message: str = "Authentication failed",
        detail: Optional[str] = None,
        context: Optional[ErrorContext] = None
    ) -> StandardError:
        """Create authentication error"""
        return StandardError(
            code=ErrorCode.AUTH_TOKEN_INVALID,
            message=message,
            detail=detail,
            severity=ErrorSeverity.HIGH,
            context=context
        )
    
    @staticmethod
    def validation_error(
        message: str = "Validation failed",
        detail: Optional[str] = None,
        context: Optional[ErrorContext] = None
    ) -> StandardError:
        """Create validation error"""
        return StandardError(
            code=ErrorCode.VALIDATION_ERROR,
            message=message,
            detail=detail,
            severity=ErrorSeverity.MEDIUM,
            context=context
        )
    
    @staticmethod
    def database_error(
        message: str = "Database operation failed",
        detail: Optional[str] = None,
        context: Optional[ErrorContext] = None,
        original_exception: Optional[Exception] = None
    ) -> StandardError:
        """Create database error"""
        return StandardError(
            code=ErrorCode.DB_QUERY_ERROR,
            message=message,
            detail=detail,
            severity=ErrorSeverity.HIGH,
            context=context,
            original_exception=original_exception
        )
    
    @staticmethod
    def ml_service_error(
        message: str = "ML analysis failed",
        detail: Optional[str] = None,
        context: Optional[ErrorContext] = None,
        original_exception: Optional[Exception] = None
    ) -> StandardError:
        """Create ML service error"""
        return StandardError(
            code=ErrorCode.ML_ANALYSIS_ERROR,
            message=message,
            detail=detail,
            severity=ErrorSeverity.MEDIUM,
            context=context,
            original_exception=original_exception
        )
    
    @staticmethod
    def external_service_error(
        message: str = "External service error",
        detail: Optional[str] = None,
        context: Optional[ErrorContext] = None,
        original_exception: Optional[Exception] = None
    ) -> StandardError:
        """Create external service error"""
        return StandardError(
            code=ErrorCode.EXTERNAL_API_ERROR,
            message=message,
            detail=detail,
            severity=ErrorSeverity.MEDIUM,
            context=context,
            original_exception=original_exception
        )
    
    @staticmethod
    def not_found_error(
        resource: str = "Resource",
        context: Optional[ErrorContext] = None
    ) -> StandardError:
        """Create not found error"""
        return StandardError(
            code=ErrorCode.DATA_NOT_FOUND,
            message=f"{resource} not found",
            detail=f"The requested {resource.lower()} could not be found",
            severity=ErrorSeverity.MEDIUM,
            context=context
        )
    
    @staticmethod
    def internal_server_error(
        message: str = "Internal server error",
        detail: Optional[str] = None,
        context: Optional[ErrorContext] = None,
        original_exception: Optional[Exception] = None
    ) -> StandardError:
        """Create internal server error"""
        return StandardError(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message=message,
            detail=detail,
            severity=ErrorSeverity.CRITICAL,
            context=context,
            original_exception=original_exception
        )

# Decorator for automatic error handling
def handle_errors(
    error_code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    include_traceback: bool = True
):
    """Decorator for automatic error handling in service methods"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                context = ErrorHandler.create_error_context()
                error = StandardError(
                    code=error_code,
                    message=f"Error in {func.__name__}: {str(e)}",
                    detail=str(e),
                    severity=severity,
                    context=context,
                    original_exception=e
                )
                ErrorHandler.log_error(error, include_traceback)
                raise ErrorHandler.create_http_exception(error)
        return wrapper
    return decorator

# Global error handler instance
error_handler = ErrorHandler()
error_factory = ErrorFactory()
