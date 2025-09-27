import mongoose, { Document, Schema } from "mongoose";

export interface ICompany extends Document {
  companyName: string;
  publicSpaceId?: string;
  mediumLink?: string;
  paragraphLink?: string;
  mirrorLink?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema: Schema = new Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      unique: true,
      trim: true,
    },
    publicSpaceId: {
      type: String,
      trim: true,
    },
    mediumLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow empty
          return /^https?:\/\/.*medium\.com/.test(v);
        },
        message: "Medium link must be a valid Medium URL",
      },
    },
    paragraphLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow empty
          return /^https?:\/\/.*paragraph\.xyz/.test(v);
        },
        message: "Paragraph link must be a valid Paragraph URL",
      },
    },
    mirrorLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow empty
          return /^https?:\/\/.*mirror\.xyz/.test(v);
        },
        message: "Mirror link must be a valid Mirror URL",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
CompanySchema.index({ companyName: 1 });
CompanySchema.index({ isActive: 1 });
CompanySchema.index({ createdAt: -1 });

export default mongoose.model<ICompany>("Company", CompanySchema);
