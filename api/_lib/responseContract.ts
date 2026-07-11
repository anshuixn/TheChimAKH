import type { VercelResponse } from '@vercel/node';
import { logError } from './logger.js';

export type ResponseCategory =
  | 'SUCCESS'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'BOT_VERIFICATION_REJECTED'
  | 'DEPENDENCY_UNAVAILABLE'
  | 'CONFIGURATION_ERROR'
  | 'IDEMPOTENCY_CONFLICT'
  | 'METHOD_NOT_ALLOWED'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'PAYLOAD_TOO_LARGE'
  | 'ORIGIN_REJECTED'
  | 'INTERNAL_ERROR';

export interface ApiResponse<T = any> {
  success: boolean;
  category: ResponseCategory;
  message: string;
  requestId: string;
  data?: T;
  errors?: Record<string, string>; // Field-specific validation errors
}

const CATEGORY_STATUS_MAP: Record<ResponseCategory, number> = {
  SUCCESS: 200,
  VALIDATION_ERROR: 400,
  RATE_LIMITED: 429,
  BOT_VERIFICATION_REJECTED: 400,
  DEPENDENCY_UNAVAILABLE: 503,
  CONFIGURATION_ERROR: 500,
  IDEMPOTENCY_CONFLICT: 409,
  METHOD_NOT_ALLOWED: 451, // or 405
  UNSUPPORTED_MEDIA_TYPE: 415,
  PAYLOAD_TOO_LARGE: 413,
  ORIGIN_REJECTED: 403,
  INTERNAL_ERROR: 500,
};

// Map METHOD_NOT_ALLOWED to 405
CATEGORY_STATUS_MAP['METHOD_NOT_ALLOWED'] = 405;

export function sendResponse<T>(
  res: VercelResponse,
  category: ResponseCategory,
  message: string,
  requestId: string,
  data?: T,
  errors?: Record<string, string>
): void {
  const status = CATEGORY_STATUS_MAP[category] || 500;
  
  const payload: ApiResponse<T> = {
    success: category === 'SUCCESS',
    category,
    message,
    requestId,
    data,
    errors,
  };

  res.status(status).json(payload);
}

export function sendInternalError(
  res: VercelResponse,
  error: any,
  requestId: string,
  customMessage = 'AN UNEXPECTED INTERNAL RUNTIME REGRESSION OCCURRED.'
): void {
  logError(`[InternalError] Request ${requestId} failed.`, error, { requestId });
  
  // Strict check: Never expose raw exceptions, database outputs, stacks, or file paths
  sendResponse(res, 'INTERNAL_ERROR', customMessage, requestId);
}
