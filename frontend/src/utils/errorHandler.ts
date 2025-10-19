/**
 * Standardized Error Handling System for Eunoia Journal Frontend
 * Provides consistent error handling, logging, and user feedback across all components
 */

export enum ErrorCode {
  // Network & API Errors
  NETWORK_ERROR = 'NET_001',
  API_TIMEOUT = 'NET_002',
  API_UNAUTHORIZED = 'NET_003',
  API_FORBIDDEN = 'NET_004',
  API_NOT_FOUND = 'NET_005',
  API_SERVER_ERROR = 'NET_006',

  // Validation Errors
  VALIDATION_ERROR = 'VAL_001',
  REQUIRED_FIELD_MISSING = 'VAL_002',
  INVALID_FORMAT = 'VAL_003',

  // Authentication Errors
  AUTH_TOKEN_MISSING = 'AUTH_001',
  AUTH_TOKEN_EXPIRED = 'AUTH_002',
  AUTH_LOGIN_FAILED = 'AUTH_003',

  // Data Errors
  DATA_LOAD_ERROR = 'DATA_001',
  DATA_SAVE_ERROR = 'DATA_002',
  DATA_NOT_FOUND = 'DATA_003',

  // ML/AI Errors
  ML_ANALYSIS_ERROR = 'ML_001',
  ML_SERVICE_UNAVAILABLE = 'ML_002',

  // General Application Errors
  UNKNOWN_ERROR = 'APP_001',
  CONFIGURATION_ERROR = 'APP_002',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  requestId: string;
  userId?: string;
  component?: string;
  action?: string;
  timestamp: Date;
  additionalData?: Record<string, unknown>;
}

export interface StandardError {
  code: ErrorCode;
  message: string;
  detail?: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  originalError?: Error;
  userMessage?: string; // User-friendly message for display
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: StandardError[] = [];

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Create error context with unique request ID
   */
  createErrorContext(
    userId?: string,
    component?: string,
    action?: string,
    additionalData?: Record<string, unknown>,
  ): ErrorContext {
    return {
      requestId: this.generateRequestId(),
      userId,
      component,
      action,
      timestamp: new Date(),
      additionalData,
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create standardized error from various error sources
   */
  createError(
    code: ErrorCode,
    message: string,
    options: {
      detail?: string;
      severity?: ErrorSeverity;
      context?: ErrorContext;
      originalError?: Error;
      userMessage?: string;
    } = {},
  ): StandardError {
    const {
      detail,
      severity = ErrorSeverity.MEDIUM,
      context,
      originalError,
      userMessage,
    } = options;

    const error: StandardError = {
      code,
      message,
      detail,
      severity,
      context: context || this.createErrorContext(),
      originalError,
      userMessage: userMessage || this.getUserFriendlyMessage(code, message),
    };

    this.logError(error);
    return error;
  }

  /**
   * Log error with appropriate level
   */
  logError(error: StandardError): void {
    // Add to error log
    this.errorLog.push(error);

    // Console logging based on severity
    const logMessage = `[${error.code}] ${error.message} | Request: ${error.context.requestId}`;

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        // eslint-disable-next-line no-console
        console.error(logMessage, error);
        break;
      case ErrorSeverity.HIGH:
        // eslint-disable-next-line no-console
        console.error(logMessage, error);
        break;
      case ErrorSeverity.MEDIUM:
        // eslint-disable-next-line no-console
        console.warn(logMessage, error);
        break;
      case ErrorSeverity.LOW:
        // eslint-disable-next-line no-console
        console.info(logMessage, error);
        break;
    }

    // In production, you might want to send errors to a logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(error);
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(code: ErrorCode, _message: string): string {
    const userMessages: Record<ErrorCode, string> = {
      [ErrorCode.NETWORK_ERROR]:
        'Unable to connect to the server. Please check your internet connection.',
      [ErrorCode.API_TIMEOUT]: 'The request is taking too long. Please try again.',
      [ErrorCode.API_UNAUTHORIZED]: 'Please log in to continue.',
      [ErrorCode.API_FORBIDDEN]: 'You do not have permission to perform this action.',
      [ErrorCode.API_NOT_FOUND]: 'The requested resource was not found.',
      [ErrorCode.API_SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
      [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ErrorCode.REQUIRED_FIELD_MISSING]: 'Please fill in all required fields.',
      [ErrorCode.INVALID_FORMAT]: 'Please check the format of your input.',
      [ErrorCode.AUTH_TOKEN_MISSING]: 'Please log in to continue.',
      [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
      [ErrorCode.AUTH_LOGIN_FAILED]: 'Login failed. Please check your credentials.',
      [ErrorCode.DATA_LOAD_ERROR]: 'Failed to load data. Please try refreshing the page.',
      [ErrorCode.DATA_SAVE_ERROR]: 'Failed to save data. Please try again.',
      [ErrorCode.DATA_NOT_FOUND]: 'No data found.',
      [ErrorCode.ML_ANALYSIS_ERROR]:
        'AI analysis is temporarily unavailable. Your entry has been saved.',
      [ErrorCode.ML_SERVICE_UNAVAILABLE]: 'AI features are temporarily unavailable.',
      [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
      [ErrorCode.CONFIGURATION_ERROR]: 'Application configuration error. Please contact support.',
    };

    return userMessages[code] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Send error to logging service (placeholder for production)
   */
  private sendToLoggingService(error: StandardError): void {
    // In production, implement actual logging service integration
    // e.g., Sentry, LogRocket, etc.
    // eslint-disable-next-line no-console
    console.log('Sending error to logging service:', error);
  }

  /**
   * Handle API errors from axios responses
   */
  handleApiError(error: unknown, context?: Partial<ErrorContext>): StandardError {
    const errorContext = this.createErrorContext(
      context?.userId,
      context?.component,
      context?.action,
      context?.additionalData,
    );

    // Narrow unknown - check if it's an axios error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;

    if (err.response) {
      // Server responded with error status
      const status = err.response.status;
      const data = err.response.data;

      let code: ErrorCode;
      let message: string;
      let severity: ErrorSeverity = ErrorSeverity.MEDIUM;

      switch (status) {
        case 400:
          code = ErrorCode.VALIDATION_ERROR;
          message = data?.detail || 'Bad request';
          break;
        case 401:
          code = ErrorCode.API_UNAUTHORIZED;
          message = 'Unauthorized';
          severity = ErrorSeverity.HIGH;
          break;
        case 403:
          code = ErrorCode.API_FORBIDDEN;
          message = 'Forbidden';
          severity = ErrorSeverity.HIGH;
          break;
        case 404:
          code = ErrorCode.API_NOT_FOUND;
          message = 'Not found';
          break;
        case 408:
          code = ErrorCode.API_TIMEOUT;
          message = 'Request timeout';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          code = ErrorCode.API_SERVER_ERROR;
          message = 'Server error';
          severity = ErrorSeverity.HIGH;
          break;
        default:
          code = ErrorCode.API_SERVER_ERROR;
          message = `HTTP ${status} error`;
      }

      return this.createError(code, message, {
        detail: data?.detail || String(err.message || ''),
        severity,
        context: errorContext,
        originalError: err,
      });
    } else if (err.request) {
      // Network error
      return this.createError(ErrorCode.NETWORK_ERROR, 'Network error', {
        detail: String(err.message || ''),
        severity: ErrorSeverity.HIGH,
        context: errorContext,
        originalError: err,
      });
    } else {
      // Other error
      return this.createError(ErrorCode.UNKNOWN_ERROR, 'Unknown error', {
        detail: String(err?.message || ''),
        context: errorContext,
        originalError: err,
      });
    }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10): StandardError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Export error factory functions for common scenarios
export const createApiError = (error: unknown, context?: Partial<ErrorContext>) =>
  errorHandler.handleApiError(error, context);

export const createValidationError = (message: string, context?: Partial<ErrorContext>) =>
  errorHandler.createError(ErrorCode.VALIDATION_ERROR, message, {
    context: context
      ? errorHandler.createErrorContext(
          context.userId,
          context.component,
          context.action,
          context.additionalData,
        )
      : undefined,
  });

export const createNetworkError = (message: string, context?: Partial<ErrorContext>) =>
  errorHandler.createError(ErrorCode.NETWORK_ERROR, message, {
    context: context
      ? errorHandler.createErrorContext(
          context.userId,
          context.component,
          context.action,
          context.additionalData,
        )
      : undefined,
    severity: ErrorSeverity.HIGH,
  });

export const createDataError = (message: string, context?: Partial<ErrorContext>) =>
  errorHandler.createError(ErrorCode.DATA_LOAD_ERROR, message, {
    context: context
      ? errorHandler.createErrorContext(
          context.userId,
          context.component,
          context.action,
          context.additionalData,
        )
      : undefined,
  });

export const createMLError = (message: string, context?: Partial<ErrorContext>) =>
  errorHandler.createError(ErrorCode.ML_ANALYSIS_ERROR, message, {
    context: context
      ? errorHandler.createErrorContext(
          context.userId,
          context.component,
          context.action,
          context.additionalData,
        )
      : undefined,
    severity: ErrorSeverity.LOW, // ML errors are often non-critical
  });
