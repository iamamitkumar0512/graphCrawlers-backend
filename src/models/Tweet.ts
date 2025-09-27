import mongoose, { Document, Schema } from "mongoose";

export interface ITweet extends Document {
  tweetId: string;
  text: string;
  author: {
    username: string;
    displayName: string;
    profileImageUrl?: string;
  };
  createdAt: Date;
  metrics: {
    retweetCount: number;
    likeCount: number;
    replyCount: number;
    quoteCount: number;
  };
  urls?: string[];
  hashtags?: string[];
  mentions?: string[];
  media?: {
    type: string;
    url: string;
  }[];
  isRetweet: boolean;
  originalTweetId?: string;
  fetchedAt: Date;
}

const TweetSchema: Schema = new Schema(
  {
    tweetId: {
      type: String,
      required: [true, "Tweet ID is required"],
      unique: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, "Tweet text is required"],
      maxlength: [1000, "Tweet text cannot be more than 1000 characters"],
    },
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
    createdAt: {
      type: Date,
      required: [true, "Tweet creation date is required"],
      index: true,
    },
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
    urls: [
      {
        type: String,
      },
    ],
    hashtags: [
      {
        type: String,
      },
    ],
    mentions: [
      {
        type: String,
      },
    ],
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
    isRetweet: {
      type: Boolean,
      default: false,
    },
    originalTweetId: {
      type: String,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
TweetSchema.index({ "author.username": 1, createdAt: -1 });
TweetSchema.index({ createdAt: -1 });
TweetSchema.index({ "metrics.likeCount": -1 });
TweetSchema.index({ hashtags: 1 });
TweetSchema.index({ fetchedAt: -1 });

export default mongoose.model<ITweet>("Tweet", TweetSchema);
