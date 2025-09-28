/**
 * Paragraph Model
 *
 * This model represents content posts scraped from various platforms (Medium,
 * Paragraph, Mirror) for companies being monitored. It stores the full post
 * data including content, metadata, and processing status.
 */

import mongoose, { Document, Schema } from "mongoose";

/**
 * Paragraph Interface
 *
 * Defines the structure of a paragraph document containing scraped post data
 * from various content platforms. Extends MongoDB Document interface.
 */
export interface IParagraph extends Document {
  /** Name of the company this post belongs to */
  companyName: string;
  /** Platform where the post was scraped from */
  platform: "medium" | "paragraph" | "mirror";
  /** Complete post data structure */
  postData: {
    /** Unique identifier for the post */
    postId: string;
    /** Post title */
    title: string;
    /** Full post content */
    content: string;
    /** Short excerpt of the post */
    excerpt?: string;
    /** Author information */
    author: {
      name: string;
      username?: string;
      profileUrl?: string;
      avatarUrl?: string;
    };
    /** Original post URL */
    url: string;
    /** When the post was originally published */
    publishedAt: Date;
    /** Tags associated with the post */
    tags?: string[];
    /** Engagement metrics */
    metrics: {
      claps?: number;
      views?: number;
      comments?: number;
      shares?: number;
    };
    /** Featured image URL */
    featuredImage?: string;
    /** Estimated reading time in minutes */
    readingTime?: number;
  };
  /** Whether the post has been processed */
  processed: boolean;
  /** When the post was fetched */
  fetchedAt: Date;
  /** When the post was processed (if applicable) */
  processedAt?: Date;
}

/**
 * Paragraph Schema Definition
 *
 * Defines the MongoDB schema for Paragraph documents with comprehensive
 * validation rules, field constraints, and nested object structures.
 */
const ParagraphSchema: Schema = new Schema(
  {
    // Company name this post belongs to
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    // Platform where the post was scraped from
    platform: {
      type: String,
      required: [true, "Platform is required"],
      enum: ["medium", "paragraph", "mirror"],
    },
    // Nested post data structure
    postData: {
      // Unique post identifier
      postId: {
        type: String,
        required: [true, "Post ID is required"],
        unique: true,
      },
      // Post title with character limit
      title: {
        type: String,
        required: [true, "Post title is required"],
        maxlength: [500, "Post title cannot be more than 500 characters"],
      },
      // Full post content
      content: {
        type: String,
        required: [true, "Post content is required"],
      },
      // Post excerpt with character limit
      excerpt: {
        type: String,
        maxlength: [1000, "Excerpt cannot be more than 1000 characters"],
      },
      // Author information nested object
      author: {
        name: {
          type: String,
          required: [true, "Author name is required"],
        },
        username: {
          type: String,
        },
        profileUrl: {
          type: String,
        },
        avatarUrl: {
          type: String,
        },
      },
      // Original post URL - must be unique
      url: {
        type: String,
        required: [true, "Post URL is required"],
        unique: true,
      },
      // Publication date
      publishedAt: {
        type: Date,
        required: [true, "Published date is required"],
      },
      // Tags array
      tags: [
        {
          type: String,
        },
      ],
      // Engagement metrics nested object
      metrics: {
        claps: {
          type: Number,
          default: 0,
          min: 0,
        },
        views: {
          type: Number,
          default: 0,
          min: 0,
        },
        comments: {
          type: Number,
          default: 0,
          min: 0,
        },
        shares: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      // Featured image URL
      featuredImage: {
        type: String,
      },
      // Reading time in minutes
      readingTime: {
        type: Number,
        min: 0,
      },
    },
    // Processing status flag
    processed: {
      type: Boolean,
      default: false,
    },
    // When the post was fetched
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
    // When the post was processed (optional)
    processedAt: {
      type: Date,
    },
  },
  {
    // Enable automatic timestamp fields (createdAt, updatedAt)
    timestamps: true,
  }
);

// Create database indexes for optimized query performance
// Compound index for company and platform queries
ParagraphSchema.index({ companyName: 1, platform: 1 });
// Index on publication date for chronological sorting
ParagraphSchema.index({ "postData.publishedAt": -1 });
// Index on processing status for filtering processed/unprocessed posts
ParagraphSchema.index({ processed: 1 });
// Index on fetch date for recent post queries
ParagraphSchema.index({ fetchedAt: -1 });
// Compound index for company and processing status
ParagraphSchema.index({ companyName: 1, processed: 1 });

// Export the Paragraph model for use in other modules
export default mongoose.model<IParagraph>("Paragraph", ParagraphSchema);
