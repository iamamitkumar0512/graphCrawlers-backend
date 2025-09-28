/**
 * Database Configuration Module
 *
 * This module handles MongoDB database connection using Mongoose ODM.
 * It provides connection management, error handling, and graceful shutdown functionality.
 */

import mongoose from "mongoose";
import config from "./env";

// Get MongoDB URI from environment configuration
const MONGODB_URI = config.MONGODB_URI;

/**
 * Establishes connection to MongoDB database
 *
 * This function handles:
 * - Initial database connection
 * - Connection event listeners for error handling
 * - Graceful shutdown on application termination
 *
 * @returns Promise<void> - Resolves when connection is established
 * @throws Error if connection fails
 */
export const connectDB = async (): Promise<void> => {
  try {
    // Establish connection to MongoDB using the URI from environment config
    const conn = await mongoose.connect(MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Set up event listeners for connection management
    // Handle connection errors
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    // Handle disconnection events
    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    // Handle graceful shutdown on SIGINT (Ctrl+C)
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    // Exit process if database connection fails
    process.exit(1);
  }
};
