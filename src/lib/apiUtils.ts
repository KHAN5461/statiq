import { Response } from "express";

export function handleApiError(res: Response, error: any, defaultMessage = "Internal Server Error", statusCode = 500) {
  console.error("[API Error]:", error);
  
  // If we wanted to add specific error handling logic based on error types, we could do it here
  if (error?.status) {
    statusCode = error.status;
  }

  const errorMessage = error?.message || defaultMessage;
  
  return res.status(statusCode).json({ error: errorMessage });
}

export function handleApiSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json(data);
}
