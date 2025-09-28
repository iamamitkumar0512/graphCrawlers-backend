/**
 * Company Model
 * 
 * This model represents companies that are being monitored for content across
 * various platforms (Medium, Paragraph, Mirror). It stores company information
 * and their associated platform links for content scraping.
 */

import mongoose, { Document, Schema } from "mongoose";

/**
 * Company Interface
 * 
 * Defines the structure of a company document in the database.
 * Extends MongoDB Document interface for additional functionality.
 */
export interface ICompany extends Document {
  /** Name of the company */
  companyName: string;
  /** Public space ID for Graph Protocol integration */
  publicSpaceId?: string;
  /** Medium publication link for content scraping */
  mediumLink?: string;
  /** Paragraph.xyz link for content scraping */
  paragraphLink?: string;
  /** Mirror.xyz link for content scraping */
  mirrorLink?: string;
  /** Whether the company is currently being monitored */
  isActive: boolean;
  /** Document creation timestamp */
  createdAt: Date;
  /** Document last update timestamp */
  updatedAt: Date;
}

/**
 * Company Schema Definition
 * 
 * Defines the MongoDB schema for Company documents with validation rules,
 * field constraints, and data types for each property.
 */
const CompanySchema: Schema = new Schema(
  {
    // Company name - required and unique identifier
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      unique: true,
      trim: true,
    },
    // Graph Protocol public space ID for blockchain integration
    publicSpaceId: {
      type: String,
      trim: true,
    },
    // Medium publication URL with validation
    mediumLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow empty values
          return /^https?:\/\/.*medium\.com/.test(v);
        },
        message: "Medium link must be a valid Medium URL",
      },
    },
    // Paragraph.xyz URL with validation
    paragraphLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow empty values
          return /^https?:\/\/.*paragraph\.xyz/.test(v);
        },
        message: "Paragraph link must be a valid Paragraph URL",
      },
    },
    // Mirror.xyz URL with validation
    mirrorLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow empty values
          return /^https?:\/\/.*mirror\.xyz/.test(v);
        },
        message: "Mirror link must be a valid Mirror URL",
      },
    },
    // Active status for monitoring control
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Enable automatic timestamp fields (createdAt, updatedAt)
    timestamps: true,
  }
);

// Create indexes for better query performance
CompanySchema.index({ companyName: 1 });
CompanySchema.index({ isActive: 1 });
CompanySchema.index({ createdAt: -1 });

export default mongoose.model<ICompany>("Company", CompanySchema);
