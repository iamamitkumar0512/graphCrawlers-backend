/**
 * Tweet Model
 *
 * This model represents Twitter posts/tweets that have been fetched and stored
 * in the database. It includes comprehensive tweet metadata, engagement metrics,
 * and content analysis data.
 */

import mongoose, { Document, Schema } from "mongoose";

/**
 * Tweet Interface
 *
 * Defines the structure of a tweet document containing all relevant tweet data
 * including content, author information, metrics, and metadata.
 */
export interface ITweet extends Document {
  /** Unique Twitter tweet ID */
  tweetId: string;
  /** Tweet text content */
  text: string;
  /** Author information */
  author: {
    username: string;
    displayName: string;
    profileImageUrl?: string;
  };
  /** When the tweet was originally created */
  createdAt: Date;
  /** Engagement metrics */
  metrics: {
    retweetCount: number;
    likeCount: number;
    replyCount: number;
    quoteCount: number;
  };
  /** URLs mentioned in the tweet */
  urls?: string[];
  /** Hashtags used in the tweet */
  hashtags?: string[];
  /** User mentions in the tweet */
  mentions?: string[];
  /** Media attachments */
  media?: {
    type: string;
    url: string;
  }[];
  /** Whether this is a retweet */
  isRetweet: boolean;
  /** Original tweet ID if this is a retweet */
  originalTweetId?: string;
  /** When this tweet was fetched from Twitter */
  fetchedAt: Date;
}

/**
 * Tweet Schema Definition
 *
 * Defines the MongoDB schema for Tweet documents with validation rules,
 * field constraints, and indexes for optimal query performance.
 */
const TweetSchema: Schema = new Schema(
  {
    // Unique Twitter tweet ID
    tweetId: {
      type: String,
      required: [true, "Tweet ID is required"],
      unique: true,
      index: true,
    },
    // Tweet content with character limit
    text: {
      type: String,
      required: [true, "Tweet text is required"],
      maxlength: [1000, "Tweet text cannot be more than 1000 characters"],
    },
    // Author information nested object
    author: {
      username: {
        type: String,
        required: [true, "Author username is required"],
        index: true,
      },
      displayName: {
        type: String,
        required: [true, "Author display name is required"],
      },
      profileImageUrl: {
        type: String,
      },
    },
    // Tweet creation date
    createdAt: {
      type: Date,
      required: [true, "Tweet creation date is required"],
      index: true,
    },
    // Engagement metrics nested object
    metrics: {
      retweetCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      likeCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      replyCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      quoteCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    // URLs mentioned in the tweet
    urls: [
      {
        type: String,
      },
    ],
    // Hashtags extracted from the tweet
    hashtags: [
      {
        type: String,
      },
    ],
    // User mentions in the tweet
    mentions: [
      {
        type: String,
      },
    ],
    // Media attachments with type and URL
    media: [
      {
        type: {
          type: String,
          enum: ["photo", "video", "gif"],
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    // Whether this is a retweet
    isRetweet: {
      type: Boolean,
      default: false,
    },
    // Original tweet ID if this is a retweet
    originalTweetId: {
      type: String,
    },
    // When the tweet was fetched from Twitter API
    fetchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // Enable automatic timestamp fields (createdAt, updatedAt)
    timestamps: true,
  }
);

// Create database indexes for optimized query performance
// Compound index for author and creation date queries
TweetSchema.index({ "author.username": 1, createdAt: -1 });
// Index on creation date for chronological sorting
TweetSchema.index({ createdAt: -1 });
// Index on like count for popular tweets queries
TweetSchema.index({ "metrics.likeCount": -1 });
// Index on hashtags for hashtag-based searches
TweetSchema.index({ hashtags: 1 });
// Index on fetch date for recent fetch queries
TweetSchema.index({ fetchedAt: -1 });

// Export the Tweet model for use in other modules
export default mongoose.model<ITweet>("Tweet", TweetSchema);
