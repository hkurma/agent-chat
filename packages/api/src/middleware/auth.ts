import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { APIError, ErrorCode } from "../error";

// Add auth middleware here
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Skip authentication for health check and auth routes
  if (req.path.startsWith("/api/health") || req.path.startsWith("/api/auth")) {
    next();
    return;
  }

  // Check if user is authenticated by bearer token for other routes
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    throw new APIError(ErrorCode.UNAUTHORIZED);
  const token = authHeader.split(" ")[1];
  const user = verifyToken(token);
  req.userId = user.userId;
  next();
}
