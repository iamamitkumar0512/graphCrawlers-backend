/**
 * Error Handler Middleware
 *
 * This middleware provides centralized error handling for the application.
 * It catches all errors, processes them appropriately, and returns
 * standardized error responses to the client.
 */

import { Request, Response, NextFunction } from "express";

/**
 * Extended Error Interface
 *
 * Extends the base Error interface to include additional properties
 * for enhanced error handling and status code management.
 */
export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

/**
 * Global Error Handler Middleware
 *
 * Handles all errors that occur in the application, including:
 * - MongoDB/Mongoose errors (CastError, ValidationError, DuplicateKey)
 * - Application-specific errors
 * - Unexpected server errors
 *
 * @param err - The error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Create a copy of the error for processing
  let error = { ...err };
  error.message = err.message;

  // Log the error for debugging
  console.error(err);

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = { ...error, message, statusCode: 404 };
  }

  // Handle Mongoose duplicate key error
  if (err.name === "MongoError" && (err as any).code === 11000) {
    const message = "Duplicate field value entered";
    error = { ...error, message, statusCode: 400 };
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const message = Object.values((err as any).errors)
      .map((val: any) => val.message)
      .join(", ");
    error = { ...error, message, statusCode: 400 };
  }

  // Send error response to client
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
    // Include stack trace in development environment only
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
