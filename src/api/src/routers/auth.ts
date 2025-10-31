import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import db from "../services/database";
import { generateToken } from "../utils/jwt";
import { APIError } from "../error";
import { ErrorCode } from "../error";

// Router for authentication
const router = Router();

// Check if user exists and has password
router.post("/check-user", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) throw new APIError(ErrorCode.INVALID_REQUEST);

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) throw new APIError(ErrorCode.NOT_FOUND);

  return res.json({ hasPassword: !!user?.password });
});

// Create password for an existing user
router.post("/create-password", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) throw new APIError(ErrorCode.INVALID_REQUEST);

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) throw new APIError(ErrorCode.NOT_FOUND);

  if (user.password || password.length < 8)
    throw new APIError(ErrorCode.INVALID_REQUEST);

  const hashedPassword = await bcrypt.hash(password, 10);

  const updatedUser = await db.user.update({
    data: {
      password: hashedPassword,
    },
    where: { id: user.id },
  });

  const token = generateToken({ userId: updatedUser.id });

  return res.json({ token });
});

// Validate password for an existing user
router.post("/validate-password", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) throw new APIError(ErrorCode.INVALID_REQUEST);

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.password) throw new APIError(ErrorCode.NOT_FOUND);

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) throw new APIError(ErrorCode.INVALID_REQUEST);

  const token = generateToken({ userId: user.id });

  return res.json({ token });
});

export default router;
