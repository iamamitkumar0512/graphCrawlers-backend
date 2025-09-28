/**
 * Async Handler Middleware
 *
 * This middleware wraps async route handlers to automatically catch
 * and forward any errors to the error handling middleware. This prevents
 * the need to wrap every async route handler in try-catch blocks.
 */

import { Request, Response, NextFunction } from "express";

/**
 * Async Handler Higher-Order Function
 *
 * Wraps an async route handler function to automatically catch
 * and forward any Promise rejections to Express error middleware.
 *
 * @param fn - The async route handler function to wrap
 * @returns A new function that handles async errors automatically
 */
export const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
