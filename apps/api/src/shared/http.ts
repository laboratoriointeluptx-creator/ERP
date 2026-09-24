import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: Record<string, unknown> | undefined;

  public constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Resource not found' },
  } satisfies ApiError);
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: { issues: error.issues },
      },
    } satisfies ApiError);
    return;
  }

  const isHttpError = error instanceof HttpError;
  const statusCode = isHttpError ? error.statusCode : 500;
  const body: ApiError = {
    success: false,
    error: {
      code: isHttpError ? error.code : 'INTERNAL_ERROR',
      message: isHttpError ? error.message : 'Internal server error',
      ...(isHttpError && error.details ? { details: error.details } : {}),
    },
  };

  response.status(statusCode).json(body);
};
