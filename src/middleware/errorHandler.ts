import type { Request, Response, NextFunction } from "express"
import type { ApiErrorResponse } from "../types"

export interface AppError extends Error {
  statusCode?: number
  code?: string
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500
  const body: ApiErrorResponse = {
    error: {
      message: err.message ?? "Internal server error",
      code: err.code ?? "INTERNAL_ERROR",
    },
  }
  res.status(statusCode).json(body)
}

export function notFound(_req: Request, res: Response): void {
  const body: ApiErrorResponse = {
    error: {
      message: "Route not found",
      code: "NOT_FOUND",
    },
  }
  res.status(404).json(body)
}

export function createError(
  message: string,
  statusCode: number,
  code: string
): AppError {
  const err: AppError = new Error(message)
  err.statusCode = statusCode
  err.code = code
  return err
}
