import { Router, Request, Response } from "express";
import db from "../services/database";
import { APIError } from "../error";
import { ErrorCode } from "../error";

// Router for users
const router = Router();

// Get current user
router.get("/me", async (req: Request, res: Response) => {
  const user = await db.user.findUnique({
    where: { id: req.userId },
  });

  if (!user) throw new APIError(ErrorCode.NOT_FOUND);

  return res.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });
});

export default router;
