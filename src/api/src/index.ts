import "express-async-errors"; // Must be imported before other imports
import express from "express";
import cors from "cors";
import { config } from "./config";

// Import routes
import authRoutes from "./routers/auth";
import agentsRoutes from "./routers/agents";
import usersRoutes from "./routers/users";
import { APIError, ErrorCode, errorStatus } from "./error";
import { authMiddleware } from "./middleware/auth";

// Create express app
const app = express();

// Configure Middlewares
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Add auth middleware to all routes
app.use(authMiddleware);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/agents", agentsRoutes);
app.use("/api/users", usersRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(errorStatus[ErrorCode.NOT_FOUND]).json({
    error: ErrorCode.NOT_FOUND,
  });
});

// Global Error handler should be after all routes
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof APIError) {
      res.status(err.statusCode).json({
        error: err.message,
      });
    } else {
      console.error(err);
      res.status(errorStatus[ErrorCode.INTERNAL_SERVER_ERROR]).json({
        error: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }
  }
);

// Start server
if (process.env.NODE_ENV !== "production") {
  app.listen(3001, () => {
    console.log(`Server is running on port 3001`);
  });
}

export default app;
