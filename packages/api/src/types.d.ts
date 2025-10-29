import "express";

interface JWTPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request extends JWTPayload {}
  }
}
