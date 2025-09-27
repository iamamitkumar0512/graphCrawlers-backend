import mongoose, { Document, Schema } from "mongoose";

export interface IWeb3Post extends Document {
  postId: string;
  title: string;
  content: string;
  excerpt?: string;
  author: {
    name: string;
    username?: string;
    profileUrl?: string;
    avatarUrl?: string;
  };
  platform: "medium" | "mirror" | "pyarzgraph";
  url: string;
  publishedAt: Date;
  tags?: string[];
  metrics: {
    claps?: number;
    views?: number;
    comments?: number;
    shares?: number;
  };
  company: {
    name: string;
    slug: string;
    website?: string;
    twitter?: string;
  };
  featuredImage?: string;
  readingTime?: number;
  fetchedAt: Date;
}

const Web3PostSchema: Schema = new Schema(
  {
    postId: {
      type: String,
      required: [true, "Post ID is required"],
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Post title is required"],
      maxlength: [500, "Post title cannot be more than 500 characters"],
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
    },
    excerpt: {
      type: String,
      maxlength: [1000, "Excerpt cannot be more than 1000 characters"],
    },
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
    platform: {
      type: String,
      required: [true, "Platform is required"],
      enum: ["medium", "mirror", "pyarzgraph"],
      index: true,
    },
    url: {
      type: String,
      required: [true, "Post URL is required"],
      unique: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      required: [true, "Published date is required"],
      index: true,
    },
    tags: [
      {
        type: String,
      },
    ],
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
    company: {
      name: {
        type: String,
        required: [true, "Company name is required"],
        index: true,
      },
      slug: {
        type: String,
        required: [true, "Company slug is required"],
        index: true,
      },
      website: {
        type: String,
      },
      twitter: {
        type: String,
      },
    },
    featuredImage: {
      type: String,
    },
    readingTime: {
      type: Number,
      min: 0,
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
Web3PostSchema.index({ "company.slug": 1, publishedAt: -1 });
Web3PostSchema.index({ platform: 1, publishedAt: -1 });
Web3PostSchema.index({ publishedAt: -1 });
Web3PostSchema.index({ tags: 1 });
Web3PostSchema.index({ "metrics.claps": -1 });
Web3PostSchema.index({ fetchedAt: -1 });

export default mongoose.model<IWeb3Post>("Web3Post", Web3PostSchema);
