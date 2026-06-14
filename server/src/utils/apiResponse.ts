import type { Response } from 'express';

/** Standard success envelope used by the auth endpoints. */
export function sendSuccess(
  res: Response,
  data: unknown = {},
  message = 'Operation successful',
  status = 200,
): void {
  res.status(status).json({ success: true, data, message });
}
