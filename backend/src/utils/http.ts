import type { Response } from 'express';

export function sendError(
  res: Response,
  status: number,
  message = 'Something went wrong.',
): void {
  res.status(status).json({ error: message });
}

export function getBodyValue<T>(value: T | undefined, fallback: T): T {
  return value ?? fallback;
}
