import mongoose, { Document, Schema } from "mongoose";

export interface IParagraph extends Document {
  companyName: string;
  platform: "medium" | "paragraph" | "mirror";
  postData: {
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
    url: string;
    publishedAt: Date;
    tags?: string[];
    metrics: {
      claps?: number;
      views?: number;
      comments?: number;
      shares?: number;
    };
    featuredImage?: string;
    readingTime?: number;
  };
  processed: boolean;
  fetchedAt: Date;
  processedAt?: Date;
}

const ParagraphSchema: Schema = new Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    platform: {
      type: String,
      required: [true, "Platform is required"],
      enum: ["medium", "paragraph", "mirror"],
    },
    postData: {
      postId: {
        type: String,
        required: [true, "Post ID is required"],
        unique: true,
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
      url: {
        type: String,
        required: [true, "Post URL is required"],
        unique: true,
      },
      publishedAt: {
        type: Date,
        required: [true, "Published date is required"],
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
      featuredImage: {
        type: String,
      },
      readingTime: {
        type: Number,
        min: 0,
      },
    },
    processed: {
      type: Boolean,
      default: false,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
ParagraphSchema.index({ companyName: 1, platform: 1 });
ParagraphSchema.index({ "postData.publishedAt": -1 });
ParagraphSchema.index({ processed: 1 });
ParagraphSchema.index({ fetchedAt: -1 });
ParagraphSchema.index({ companyName: 1, processed: 1 });

export default mongoose.model<IParagraph>("Paragraph", ParagraphSchema);
