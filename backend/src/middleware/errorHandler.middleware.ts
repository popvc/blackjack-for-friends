import type { ErrorRequestHandler } from "express";
import { AppError } from "../lib/errors";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError && err.isOperational ? err.message : "Internal server error!";

  if (!(err instanceof AppError) || !err.isOperational) {
    console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({ message });
};
