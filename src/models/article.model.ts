import mongoose, { Schema } from "mongoose";
import slugify from "slugify";
import type { IArticle } from "../types/index.js";

const articleSchema = new Schema<IArticle>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    slug: { type: String, unique: true, lowercase: true },
    excerpt: { type: String, maxlength: 500 },
    content: { type: String, required: [true, "Content is required"] },
    contentType: {
      type: String,
      enum: ["markdown", "html", "richtext"],
      default: "markdown",
    },
    coverImage: {
      url: String,
      publicId: String,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    category: { type: String, trim: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedAt: { type: Date },
    readingTime: { type: Number },
    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    metaTitle: { type: String, maxlength: 70 },
    metaDescription: { type: String, maxlength: 160 },
  },
  { timestamps: true },
);

// ─── Pre-save hooks ────────────────────────────────────────────────────────
articleSchema.pre<IArticle>("save", async function (next) {
  // Auto-generate unique slug
  if (this.isModified("title")) {
    const base = slugify(this.title, { lower: true, strict: true });
    let slug = base;
    let count = 1;
    while (
      await mongoose
        .model<IArticle>("Article")
        .findOne({ slug, _id: { $ne: this._id } })
    ) {
      slug = `${base}-${count++}`;
    }
    this.slug = slug;
  }

  // Auto-set publishedAt
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  // Estimate reading time (~200 wpm)
  if (this.isModified("content")) {
    this.readingTime = Math.ceil(this.content.split(/\s+/).length / 200);
  }

  next();
});
articleSchema.index({ user: 1, status: 1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ category: 1, status: 1 });
articleSchema.index({ title: "text", content: "text", tags: "text" });

articleSchema.set("toJSON", { virtuals: true, versionKey: false });

const Article = mongoose.model<IArticle>("Article", articleSchema);
export default Article;
