// src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import interviewRoutes from "./routes/interview.routes.js";
import userRoutes from "./routes/user.routes.js";
import { initFirebase } from "./config/firebase.js";
import { requireAuth } from "./middleware/auth.middleware.js";

dotenv.config();
initFirebase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/user", userRoutes);
app.use("/api/interview", requireAuth, interviewRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong",
    details: err.message
  });
});

export default app; // 👈 THIS IS CRITICAL
