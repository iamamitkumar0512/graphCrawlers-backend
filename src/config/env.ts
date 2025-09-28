/**
 * Environment Configuration Module
 * 
 * This module handles environment variable configuration and validation.
 * It provides type-safe access to environment variables with default values
 * and validates critical configuration on application startup.
 */

import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Environment Configuration Interface
 * 
 * Defines the structure of environment variables used throughout the application.
 * Each property corresponds to an environment variable with appropriate typing.
 */
export interface EnvironmentConfig {
  // Server Configuration
  PORT: number;
  NODE_ENV: string;

  // Database Configuration
  MONGODB_URI: string;

  // JWT Configuration
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // CORS Configuration
  CORS_ORIGIN: string;

  // Twitter Configuration
  TWITTER_ENABLED: boolean;

  // Cron Configuration
  CRON_ENABLED: boolean;
  CRON_SCHEDULE: string;
}

/**
 * Environment Configuration Object
 * 
 * Creates a configuration object with environment variables and their default values.
 * All environment variables are parsed with appropriate type conversions.
 */
const config: EnvironmentConfig = {
  // Server Configuration
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database Configuration
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/hackthon_db",

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret_here",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Twitter Configuration
  TWITTER_ENABLED: process.env.TWITTER_ENABLED === "true",

  // Cron Configuration
  CRON_ENABLED: process.env.CRON_ENABLED !== "false",
  CRON_SCHEDULE: process.env.CRON_SCHEDULE || "0 */6 * * *", // Every 6 hours
};

/**
 * Validates the configuration object
 * 
 * Performs validation checks on critical configuration values:
 * - Checks for required environment variables
 * - Validates MongoDB URI format
 * - Ensures JWT secret is set in production
 * 
 * @throws Error if validation fails
 */
export const validateConfig = (): void => {
  const requiredVars = ["MONGODB_URI"];

  // Check for required environment variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.warn(`⚠️  Warning: ${varName} is not set, using default value`);
    }
  }

  // Validate MongoDB URI format
  if (
    !config.MONGODB_URI.startsWith("mongodb://") &&
    !config.MONGODB_URI.startsWith("mongodb+srv://")
  ) {
    throw new Error("Invalid MongoDB URI format");
  }

  // Validate JWT secret in production environment
  if (
    config.NODE_ENV === "production" &&
    config.JWT_SECRET === "your_jwt_secret_here"
  ) {
    throw new Error("JWT_SECRET must be set in production environment");
  }
};

// Validate configuration on module import
validateConfig();

// Export the validated configuration object
export default config;
