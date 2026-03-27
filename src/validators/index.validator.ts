import Joi from "joi";

// ─── Profile ──────────────────────────────────────────────────────────────────
export const updateProfileSchema = Joi.object({
  bio: Joi.string().max(1000).allow("", null),
  headline: Joi.string().max(200).allow("", null),
  location: Joi.string().max(100).allow("", null),
  website: Joi.string().uri().allow("", null),
  skills: Joi.array().items(Joi.string().trim()).max(50),
  socialLinks: Joi.object({
    github: Joi.string().uri().allow("", null),
    linkedin: Joi.string().uri().allow("", null),
    twitter: Joi.string().uri().allow("", null),
    instagram: Joi.string().uri().allow("", null),
    youtube: Joi.string().uri().allow("", null),
    devto: Joi.string().uri().allow("", null),
    hashnode: Joi.string().uri().allow("", null),
  }),
  isPublic: Joi.boolean(),
});

// ─── User (admin update) ──────────────────────────────────────────────────────
export const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().email().lowercase(),
  role: Joi.string().valid("user", "admin"),
  isActive: Joi.boolean(),
});

export const updateMeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().email().lowercase(),
});

// ─── Project ──────────────────────────────────────────────────────────────────
export const createProjectSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  description: Joi.string().max(5000).required(),
  shortDescription: Joi.string().max(300).allow("", null),
  techStack: Joi.array().items(Joi.string().trim()).max(30),
  liveUrl: Joi.string().uri().allow("", null),
  githubUrl: Joi.string().uri().allow("", null),
  tags: Joi.array().items(Joi.string().trim().lowercase()).max(20),
  category: Joi.string().trim().allow("", null),
  isFeatured: Joi.boolean().default(false),
  isPublished: Joi.boolean().default(true),
  order: Joi.number().integer().min(0),
});

export const updateProjectSchema = createProjectSchema.fork(
  ["title", "description"],
  (s) => s.optional(),
);

// ─── Article ──────────────────────────────────────────────────────────────────
export const createArticleSchema = Joi.object({
  title: Joi.string().trim().max(300).required(),
  excerpt: Joi.string().max(500).allow("", null),
  content: Joi.string().required(),
  contentType: Joi.string()
    .valid("markdown", "html", "richtext")
    .default("markdown"),
  tags: Joi.array().items(Joi.string().trim().lowercase()).max(20),
  category: Joi.string().trim().allow("", null),
  status: Joi.string().valid("draft", "published", "archived").default("draft"),
  isFeatured: Joi.boolean().default(false),
  metaTitle: Joi.string().max(70).allow("", null),
  metaDescription: Joi.string().max(160).allow("", null),
});

export const updateArticleSchema = createArticleSchema.fork(
  ["title", "content"],
  (s) => s.optional(),
);

// ─── Message ──────────────────────────────────────────────────────────────────
export const createMessageSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  message: Joi.string().required(),
});

// ─── Subscriber ───────────────────────────────────────────────────────────────
export const subscribeSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  source: Joi.string().max(50).default("website"),
});

// ─── Pagination / Filter (shared) ────────────────────────────────────────────
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().max(100),
  search: Joi.string().max(200).allow("", null),
  category: Joi.string().max(100).allow("", null),
  tags: Joi.string().max(200).allow("", null),
  techStack: Joi.string().max(200).allow("", null),
  status: Joi.string().valid("draft", "published", "archived").allow(null),
  isFeatured: Joi.boolean().allow(null),
  isActive: Joi.boolean().allow(null),
  isRead: Joi.boolean().allow(null),
  role: Joi.string().valid("user", "admin").allow(null),
});
