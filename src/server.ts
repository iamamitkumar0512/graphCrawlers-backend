/**
 * Main Server Module
 *
 * This is the entry point of the application that sets up the Express server,
 * configures middleware, routes, and handles application lifecycle events.
 * It integrates with MongoDB, Swagger documentation, and various services.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import config from "./config/env";
import { connectDB } from "./config/database";
import { swaggerSpec, swaggerUi } from "./config/swagger";
import companyRoutes from "./routes/companyRoutes";
import graphProtocolRoutes from "./routes/graphProtocolRoutes";
import cronService from "./services/cronService";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

// Create Express application instance
const app = express();

// Get port from environment configuration
const PORT = config.PORT;

// ==================== RATE LIMITING ====================
// Configure rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

// ==================== MIDDLEWARE SETUP ====================

// Security middleware
app.use(helmet()); // Set security headers

// CORS configuration
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

// Performance middleware
app.use(compression()); // Enable gzip compression
app.use(morgan("combined")); // HTTP request logging

// Rate limiting
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ==================== API DOCUMENTATION ====================
// Swagger UI for API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== ROUTES ====================
// Company management routes
app.use("/api/companies", companyRoutes);

// Graph Protocol integration routes
app.use("/api/graph", graphProtocolRoutes);

// ==================== HEALTH & INFO ENDPOINTS ====================

/**
 * Health check endpoint
 * Provides server status and uptime information
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Root endpoint
 * Provides basic API information and navigation links
 */
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Hackthon Backend API",
    documentation: "/api-docs",
    health: "/health",
  });
});

// ==================== ERROR HANDLING MIDDLEWARE ====================
// 404 handler (must be before error handler)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// ==================== SERVER STARTUP ====================

/**
 * Start Server Function
 *
 * Initializes the server by connecting to the database and starting
 * the HTTP server on the configured port.
 */
const startServer = async () => {
  try {
    // Connect to MongoDB database
    await connectDB();

    // Initialize cron service for automated tasks (currently disabled)
    // await cronService.initialize();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🏢 Company API: http://localhost:${PORT}/api/companies`);
      console.log(`📊 Graph Protocol API: http://localhost:${PORT}/api/graph`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

// ==================== GRACEFUL SHUTDOWN ====================

/**
 * Handle SIGTERM signal for graceful shutdown
 */
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await cronService.shutdown();
  process.exit(0);
});

/**
 * Handle SIGINT signal (Ctrl+C) for graceful shutdown
 */
process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await cronService.shutdown();
  process.exit(0);
});

// Export the Express app for testing purposes
export default app;
