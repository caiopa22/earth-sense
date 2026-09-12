import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.ts";
import { sendError } from "../utils/http.ts";

export const getAuthenticatedUserId = (req: AuthenticatedRequest, res: Response): string | null => {
  const userId = req.user?.id;

  if (!userId) {
    sendError(res, 401, 'Authentication required.');
    return null;
  }

  return userId;
};