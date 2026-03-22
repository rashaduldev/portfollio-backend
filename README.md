# 🚀 Portfolio Backend API — TypeScript

A production-ready, fully-featured portfolio backend built with **Node.js**, **Express**, **MongoDB (Mongoose)**, **Cloudinary**, and **TypeScript**. Clean Architecture · Strict Types · JWT Auth · RBAC · Swagger Docs.

---

## ✨ Features

| Module | Capabilities |
|---|---|
| **Auth** | JWT access + refresh tokens, bcrypt passwords, forgot/reset password via email, RBAC |
| **Users & Profiles** | CRUD, avatar upload, resume (PDF) upload, social links, skills |
| **Projects** | CRUD, multiple image uploads, featured flag, full-text search, filter, pagination |
| **Articles / Blog** | CRUD, auto-slug, draft/publish/archive, tags, categories, reading time auto-calc |
| **Messages** | Public contact form, admin inbox, email notifications, bulk delete |
| **Newsletter** | Subscribe/unsubscribe (token-based), duplicate prevention, re-subscribe |
| **Dashboard** | Stats, recent activity, top views, 30-day growth charts |
| **Upload** | Cloudinary single/multi image, PDF resume, delete by publicId |
| **Security** | Helmet, CORS, rate limiting, Mongo sanitization, Joi input validation |
| **Logging** | Winston (rotating files + console), Morgan HTTP logs |
| **Docs** | Swagger UI at `/api-docs` |
| **TypeScript** | Strict mode, full interfaces, typed services/controllers/middleware |

---

## 📁 Folder Structure

```
portfolio-backend-ts/
├── src/
│   ├── types/
│   │   └── index.ts           # All interfaces: IUser, IProject, IArticle, etc.
│   ├── config/
│   │   ├── database.ts        # MongoDB connection
│   │   ├── cloudinary.ts      # Cloudinary + Multer typed setup
│   │   ├── email.ts           # Nodemailer + typed templates
│   │   ├── logger.ts          # Winston (auto-creates logs/ dir)
│   │   └── swagger.ts         # OpenAPI spec
│   ├── models/                # Mongoose schemas with TS generics
│   │   ├── user.model.ts
│   │   ├── profile.model.ts
│   │   ├── project.model.ts
│   │   ├── article.model.ts
│   │   ├── message.model.ts
│   │   └── subscriber.model.ts
│   ├── services/              # All business logic, fully typed
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── project.service.ts
│   │   ├── article.service.ts
│   │   ├── message.service.ts
│   │   ├── subscriber.service.ts
│   │   └── dashboard.service.ts
│   ├── controllers/           # Thin typed request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── project.controller.ts
│   │   ├── article.controller.ts
│   │   ├── message.controller.ts
│   │   ├── subscriber.controller.ts
│   │   └── dashboard.controller.ts
│   ├── routes/                # Express routers with Swagger JSDoc
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── project.routes.ts
│   │   ├── article.routes.ts
│   │   ├── message.routes.ts
│   │   ├── subscriber.routes.ts
│   │   ├── dashboard.routes.ts
│   │   └── upload.routes.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts        # protect, restrictTo, optionalAuth
│   │   ├── errorHandler.ts           # typed global error handler
│   │   ├── rateLimiter.middleware.ts # auth / global / contact / subscribe limiters
│   │   ├── upload.middleware.ts      # typed Multer wrappers
│   │   └── validate.middleware.ts    # typed Joi validation wrapper
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   └── index.validator.ts        # profile, project, article, message, subscriber
│   ├── utils/
│   │   ├── errors.ts                 # AppError + typed subclasses
│   │   ├── helpers.ts                # sendSuccess, catchAsync, pagination (all typed)
│   │   └── jwt.ts                    # typed token generation + cookie helpers
│   ├── app.ts                        # Express app (no circular exports)
│   ├── server.ts                     # Entry point with graceful shutdown
│   └── seed.ts                       # Typed database seeder
├── logs/                             # Auto-created at runtime
├── dist/                             # Compiled output (after npm run build)
├── tsconfig.json
├── .env.example
├── .gitignore
└── package.json
```

---

## ⚡ Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in your MONGODB_URI, JWT secrets, Cloudinary, and SMTP values
```

### 3. Seed the database (optional)

```bash
# Seed with demo data
npm run seed

# Wipe all data
npm run seed:destroy
```

Seed creates:
- **Admin:** `admin@portfolio.com` / `Admin1234`
- **User:** `jane@portfolio.com` / `User1234`

### 4. Start development server

```bash
npm run dev
# → http://localhost:5000
# → http://localhost:5000/api-docs   (Swagger)
# → http://localhost:5000/health     (Health check)
```

### 5. Build for production

```bash
npm run build   # compiles src/ → dist/
npm start       # runs dist/server.js
```

---

## 📖 API Reference

Full interactive docs at **`http://localhost:5000/api-docs`**

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, receive tokens |
| POST | `/api/auth/logout` | 🔐 User | Logout & clear cookie |
| POST | `/api/auth/refresh` | Public | Refresh access token via cookie |
| POST | `/api/auth/forgot-password` | Public | Send reset email |
| PATCH | `/api/auth/reset-password/:token` | Public | Reset password |
| PATCH | `/api/auth/change-password` | 🔐 User | Change password |
| GET | `/api/auth/me` | 🔐 User | Get current user |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me` | 🔐 User | Get my full profile |
| PATCH | `/api/users/me` | 🔐 User | Update name/email |
| PATCH | `/api/users/me/profile` | 🔐 User | Update bio, skills, social links |
| POST | `/api/users/me/avatar` | 🔐 User | Upload avatar (multipart) |
| POST | `/api/users/me/resume` | 🔐 User | Upload resume PDF (multipart) |
| GET | `/api/users` | 👑 Admin | List all users |
| GET | `/api/users/:id` | 👑 Admin | Get user by ID |
| PATCH | `/api/users/:id` | 👑 Admin | Update user |
| DELETE | `/api/users/:id` | 👑 Admin | Delete user + profile |

### Projects

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects` | Public | List with search/filter/pagination |
| POST | `/api/projects` | 🔐 User | Create + upload images |
| GET | `/api/projects/:id` | Public | Get by ID (increments views) |
| PATCH | `/api/projects/:id` | 🔐 Owner/Admin | Update |
| DELETE | `/api/projects/:id` | 🔐 Owner/Admin | Delete + remove Cloudinary images |
| DELETE | `/api/projects/:id/images/:publicId` | 🔐 Owner/Admin | Delete single image |

### Articles

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/articles` | Public | List with search/filter/pagination |
| POST | `/api/articles` | 🔐 User | Create (auto-generates slug) |
| GET | `/api/articles/taxonomy` | Public | All tags & categories |
| GET | `/api/articles/id/:id` | Public | Get by MongoDB ID |
| GET | `/api/articles/:slug` | Public | Get by slug (increments views) |
| PATCH | `/api/articles/:slug` | 🔐 Owner/Admin | Update |
| DELETE | `/api/articles/:slug` | 🔐 Owner/Admin | Delete |
| GET | `/api/articles/:slug/related` | Public | Related articles by tags/category |

### Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/messages` | Public | Contact form (5/hr rate limit) |
| GET | `/api/messages` | 👑 Admin | List all messages |
| GET | `/api/messages/unread-count` | 👑 Admin | Unread message count |
| DELETE | `/api/messages/bulk-delete` | 👑 Admin | Delete multiple by IDs |
| GET | `/api/messages/:id` | 👑 Admin | Get message (auto-marks read) |
| PATCH | `/api/messages/:id` | 👑 Admin | Mark read/replied |
| DELETE | `/api/messages/:id` | 👑 Admin | Delete |

### Subscribers

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/subscribers` | Public | Subscribe (10/hr rate limit) |
| GET | `/api/subscribers/unsubscribe/:token` | Public | Unsubscribe via email token |
| GET | `/api/subscribers` | 👑 Admin | List all subscribers |
| GET | `/api/subscribers/stats` | 👑 Admin | Total/active/inactive stats |
| DELETE | `/api/subscribers/:id` | 👑 Admin | Delete subscriber |

### Dashboard (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Totals for all modules |
| GET | `/api/dashboard/activity` | Recent 5 items per module |
| GET | `/api/dashboard/views` | Top 5 viewed projects & articles |
| GET | `/api/dashboard/growth` | 30-day subscriber & message growth |

### Upload

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload/image` | 🔐 User | Single image → Cloudinary |
| POST | `/api/upload/images` | 🔐 User | Up to 10 images → Cloudinary |
| DELETE | `/api/upload/delete` | 🔐 User | Delete by publicId |

---

## 🔐 Authentication Flow

```
POST /api/auth/login
→ returns { accessToken } in body
→ sets refreshToken in httpOnly cookie

All protected requests:
Authorization: Bearer <accessToken>

Access token expires in 15 min → POST /api/auth/refresh (uses cookie)
Refresh token expires in 7 days → user must login again
```

---

## 🔍 Query Parameters

### Pagination & Sorting
```
GET /api/projects?page=2&limit=5&sort=-createdAt
GET /api/articles?page=1&limit=10&sort=-publishedAt,title
```

### Search & Filter
```
# Projects
GET /api/projects?search=react&tags=fullstack,frontend&techStack=Node.js&isFeatured=true

# Articles
GET /api/articles?search=mongodb&tags=backend&category=Database&status=published

# Admin: users
GET /api/users?search=jane&role=user
```

---

## 🛡️ Security

| Layer | Implementation |
|---|---|
| Headers | `helmet` |
| CORS | Configurable `ALLOWED_ORIGINS` |
| Rate Limiting | Global 100/15min · Auth 20/15min · Contact 5/hr · Subscribe 10/hr |
| NoSQL Injection | `express-mongo-sanitize` |
| Input Validation | `joi` with `stripUnknown: true` |
| Password Hashing | `bcryptjs` cost factor 12 |
| Token Rotation | Refresh tokens rotate on every use |
| Password Guard | Tokens issued before password change are rejected |

---

## 🛠 Scripts

```bash
npm run dev        # ts-node-dev with hot reload
npm run build      # tsc → dist/
npm start          # node dist/server.js
npm run typecheck  # tsc --noEmit (no emit, just type-check)
npm run lint       # ESLint with @typescript-eslint
npm run seed       # Seed demo data
npm run seed:destroy # Wipe all collections
```

---

## 🚀 Production Checklist

- [ ] `NODE_ENV=production`
- [ ] Strong random `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (64-byte hex)
- [ ] `ALLOWED_ORIGINS` set to your frontend domain only
- [ ] MongoDB Atlas with IP allowlist + TLS
- [ ] Real SMTP credentials (SendGrid / Mailgun / SES)
- [ ] `npm run build` committed to CI pipeline
- [ ] Nginx reverse proxy with SSL (Let's Encrypt)
- [ ] PM2 process manager for zero-downtime restarts
- [ ] Log rotation on `logs/` directory
- [ ] Health check `/health` wired to load balancer

---

## 📄 License

MIT
