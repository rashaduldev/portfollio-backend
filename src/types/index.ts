import type { Request, Response, NextFunction } from "express";
import type { Document, Types } from "mongoose";

// ─── Re-exports for convenience ───────────────────────────────────────────────
export type { Request, Response, NextFunction };
export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;
export type SyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

// ─── User ─────────────────────────────────────────────────────────────────────
export type UserRole = "user" | "admin";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  createPasswordResetToken(): string;
  changedPasswordAfter(jwtTimestamp: number): boolean;
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export interface ICloudinaryFile {
  url: string;
  publicId: string;
}

export interface ISocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  devto?: string;
  hashnode?: string;
}

export interface ISkill {
  name: string;
  category?: string;
  level?: number;
}

export interface IProfile extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  bio?: string;
  headline?: string;
  location?: string;
  website?: string;
  skills: ISkill[];
  avatar?: ICloudinaryFile;
  resume?: ICloudinaryFile;
  socialLinks?: ISocialLinks;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Resume: Experience & Education ───────────────────────────────────────────
export interface IExperience extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  role: string;
  company: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEducation extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  degree: string;
  institution: string;
  field?: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Site Settings (SEO singleton) ────────────────────────────────────────────
export interface ISettings extends Document {
  _id: Types.ObjectId;
  key: string;
  siteName?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];
  ogImage?: string;
  enableSitemap: boolean;
  googleAnalyticsId?: string;
  cookiePolicy?: {
    title?: string;
    bannerImage?: string;
    content?: string;
    updatedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ─── Project ──────────────────────────────────────────────────────────────────
export interface IProjectImage extends ICloudinaryFile {
  isPrimary: boolean;
}

export interface IProject extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  title: string;
  description: string;
  shortDescription?: string;
  techStack: string[];
  images: IProjectImage[];
  liveUrl?: string;
  githubUrl?: string;
  tags: string[];
  category?: string;
  isFeatured: boolean;
  isPublished: boolean;
  order: number;
  views: number;
  likes: number;
  comments: { name: string; content: string; createdAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Article ──────────────────────────────────────────────────────────────────
export type ArticleStatus = "draft" | "published" | "archived";
export type ContentType = "markdown" | "html" | "richtext";

export interface IArticle extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  contentType: ContentType;
  coverImage?: ICloudinaryFile;
  tags: string[];
  category?: string;
  status: ArticleStatus;
  publishedAt?: Date;
  readingTime?: number;
  views: number;
  likes?: number;
  comments?: { name: string; content: string; createdAt: Date }[];
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Message ──────────────────────────────────────────────────────────────────
export interface IMessage extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  message: string;
  isRead: boolean;
  isReplied: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Subscriber ───────────────────────────────────────────────────────────────
export interface ISubscriber extends Document {
  _id: Types.ObjectId;
  email: string;
  isActive: boolean;
  unsubscribeToken: string;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Extended Express Request ─────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// ─── JWT Payloads ─────────────────────────────────────────────────────────────
export interface AccessTokenPayload {
  id: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  id: string;
  iat?: number;
  exp?: number;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── Query Helpers ────────────────────────────────────────────────────────────
export interface BaseQuery {
  page?: string;
  limit?: string;
  sort?: string;
  search?: string;
  category?: string;
  tags?: string;
  isFeatured?: string;
  status?: ArticleStatus;
}

export interface ProjectQuery extends BaseQuery {
  techStack?: string;
  isPublished?: string;
}

export interface ArticleQuery extends BaseQuery {
  status?: ArticleStatus;
}

export interface UserQuery extends BaseQuery {
  role?: UserRole;
}

// ─── Service Return Types ─────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: IUser;
}

export interface DashboardStats {
  projects: { total: number; published: number; featured: number };
  articles: { total: number; published: number; drafts: number };
  messages: { total: number; unread: number };
  subscribers: { total: number; active: number };
  users: { total: number };
}

export interface SubscriberStats {
  total: number;
  active: number;
  inactive: number;
}

// ─── Email ────────────────────────────────────────────────────────────────────
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

export interface SendSuccessOptions<T = unknown> {
  data?: T;
  message?: string;
  statusCode?: number;
  meta?: PaginationMeta;
}
