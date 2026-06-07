import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/user.model.js';
import Profile from './models/profile.model.js';
import Project from './models/project.model.js';
import Article from './models/article.model.js';
import Message from './models/message.model.js';
import Subscriber from './models/subscriber.model.js';
import Experience from './models/experience.model.js';
import Education from './models/education.model.js';
import Settings from './models/settings.model.js';

const MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://localhost:27017/portfolio';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin1234';
const ADMIN_PHONE = process.env.ADMIN_PHONE ?? '+0000000000';

// ─── Seed data (all owned by the real admin) ──────────────────────────────────
const profileData = {
  bio: 'Full-stack developer specializing in TypeScript, React/Next.js and Node.js. I build production-ready web apps end to end.',
  headline: 'Full-Stack Developer',
  location: 'Dhaka, Bangladesh',
  website: 'https://rashaduldev.vercel.app',
  isPublic: true,
  skills: [
    { name: 'React / Next.js', category: 'Frontend', level: 92 },
    { name: 'TypeScript', category: 'Frontend', level: 90 },
    { name: 'Tailwind CSS', category: 'Frontend', level: 88 },
    { name: 'Node.js / Express', category: 'Backend', level: 90 },
    { name: 'MongoDB / Mongoose', category: 'Backend', level: 85 },
    { name: 'PostgreSQL', category: 'Backend', level: 75 },
    { name: 'Docker', category: 'Tools', level: 70 },
    { name: 'Git / GitHub', category: 'Tools', level: 90 },
    { name: 'Figma', category: 'Design', level: 65 },
  ],
  socialLinks: {
    github: 'https://github.com/rashaduldev',
    linkedin: 'https://linkedin.com/in/rashaduldev',
    twitter: 'https://twitter.com/rashaduldev',
  },
};

const projectsData = (userId: mongoose.Types.ObjectId) => [
  {
    user: userId,
    title: 'E-Commerce Platform',
    description:
      'A full-stack e-commerce solution with React, Node.js, and Stripe integration, including cart, checkout, and an admin dashboard.',
    shortDescription: 'Full-stack e-commerce with Stripe payments.',
    techStack: ['Next.js', 'Node.js', 'MongoDB', 'Stripe', 'Redux'],
    tags: ['fullstack', 'ecommerce', 'nextjs'],
    category: 'Web App',
    liveUrl: 'https://ecommerce.example.com',
    githubUrl: 'https://github.com/rashaduldev/ecommerce',
    isFeatured: true,
    isPublished: true,
    images: [],
    order: 1,
    views: 320,
  },
  {
    user: userId,
    title: 'Portfolio API (TypeScript)',
    description:
      'A production-ready REST API built with Node.js, Express, MongoDB, and TypeScript. JWT auth, RBAC, Cloudinary uploads and Swagger docs.',
    shortDescription: 'Production-grade REST API with TypeScript.',
    techStack: ['Node.js', 'TypeScript', 'Express', 'MongoDB', 'Cloudinary'],
    tags: ['backend', 'api', 'typescript'],
    category: 'Backend',
    githubUrl: 'https://github.com/rashaduldev/portfolio-api',
    isFeatured: true,
    isPublished: true,
    images: [],
    order: 2,
    views: 210,
  },
  {
    user: userId,
    title: 'Admin Dashboard',
    description:
      'A dynamic, fully-functional admin dashboard built with Next.js App Router, React Query and a typed Express backend.',
    shortDescription: 'Dynamic admin dashboard (Next.js + Express).',
    techStack: ['Next.js', 'React Query', 'Tailwind CSS', 'Express'],
    tags: ['fullstack', 'dashboard', 'nextjs'],
    category: 'Web App',
    liveUrl: 'https://rashaduldev.vercel.app/dashboard',
    githubUrl: 'https://github.com/rashaduldev/portfolio',
    isFeatured: false,
    isPublished: true,
    images: [],
    order: 3,
    views: 95,
  },
];

const articlesData = (userId: mongoose.Types.ObjectId) => [
  {
    user: userId,
    title: 'Building Production-Ready APIs with TypeScript and Node.js',
    excerpt: 'Best practices for type-safe, scalable REST APIs.',
    content:
      '# Building Production-Ready APIs\n\nTypeScript brings static typing to Node.js backends, catching bugs at compile time and making refactors safe...',
    contentType: 'markdown' as const,
    tags: ['typescript', 'nodejs', 'api', 'backend'],
    category: 'Backend',
    status: 'published' as const,
    isFeatured: true,
    views: 540,
  },
  {
    user: userId,
    title: 'MongoDB Schema Design Best Practices',
    excerpt: 'A guide to designing efficient Mongoose schemas.',
    content:
      '# MongoDB Schema Design\n\nDesigning a good MongoDB schema is crucial for performance. Model your data around access patterns...',
    contentType: 'markdown' as const,
    tags: ['mongodb', 'database', 'backend'],
    category: 'Database',
    status: 'published' as const,
    views: 300,
  },
  {
    user: userId,
    title: 'React Performance Optimization (Draft)',
    excerpt: 'Techniques for optimizing React apps.',
    content: '# React Performance\n\nWork in progress...',
    contentType: 'markdown' as const,
    tags: ['react', 'frontend', 'performance'],
    category: 'Frontend',
    status: 'draft' as const,
    views: 0,
  },
];

const experienceData = (userId: mongoose.Types.ObjectId) => [
  {
    user: userId,
    role: 'Senior Full-Stack Developer',
    company: 'Tech Corp',
    location: 'Remote',
    startDate: new Date('2022-01-01'),
    current: true,
    description:
      'Lead development of web platforms using Next.js and Node.js; mentor junior developers and own architecture decisions.',
    order: 1,
  },
  {
    user: userId,
    role: 'Full-Stack Developer',
    company: 'Startup Inc',
    location: 'Dhaka, Bangladesh',
    startDate: new Date('2020-03-01'),
    endDate: new Date('2021-12-31'),
    current: false,
    description:
      'Built and shipped multiple MERN-stack products from scratch, integrating payments, auth and third-party APIs.',
    order: 2,
  },
];

const educationData = (userId: mongoose.Types.ObjectId) => [
  {
    user: userId,
    degree: 'B.Sc. in Computer Science & Engineering',
    institution: 'North South University',
    field: 'Computer Science',
    startDate: new Date('2016-01-01'),
    endDate: new Date('2020-01-01'),
    current: false,
    description: 'Focus on software engineering, algorithms and web technologies.',
    order: 1,
  },
];

const settingsData = {
  key: 'global',
  siteName: 'Rashadul Dev',
  metaTitle: 'Rashadul | Full-Stack Developer Portfolio',
  metaDescription:
    'Portfolio of Rashadul — full-stack developer specializing in Next.js, Node.js and TypeScript.',
  keywords: ['full-stack developer', 'nextjs', 'nodejs', 'typescript', 'portfolio'],
  enableSitemap: true,
};

const messagesData = [
  {
    name: 'Alice Smith',
    email: 'alice@example.com',
    phone: '+1234567890',
    message: 'Hi, I saw your portfolio and would love to discuss a project.',
    isRead: false,
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '+1987654321',
    message: 'We have an exciting opportunity at our company. Please reach out!',
    isRead: true,
  },
  {
    name: 'Carol Williams',
    email: 'carol@example.com',
    phone: '+1444555666',
    message: 'I would love to collaborate on an open-source project with you.',
    isRead: false,
  },
];

const subscribersData = [
  { email: 'subscriber1@example.com', isActive: true },
  { email: 'subscriber2@example.com', isActive: true },
  { email: 'unsubscribed@example.com', isActive: false },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
const seed = async (): Promise<void> => {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Always clear CONTENT collections so re-running doesn't duplicate.
  // Users are preserved (the admin account is managed separately).
  await Promise.all([
    Project.deleteMany({}),
    Article.deleteMany({}),
    Message.deleteMany({}),
    Subscriber.deleteMany({}),
    Experience.deleteMany({}),
    Education.deleteMany({}),
    Settings.deleteMany({}),
  ]);
  console.log('🗑️  Content collections cleared.');

  if (process.argv.includes('--destroy')) {
    await Profile.deleteMany({});
    console.log('🗑️  Profiles cleared. Destroy complete.');
    process.exit(0);
  }

  // Find or create the real admin (matches ADMIN_EMAIL in .env).
  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      phone: ADMIN_PHONE,
    });
    console.log(`✅ Created admin: ${ADMIN_EMAIL}`);
  } else {
    console.log(`ℹ️  Using existing admin: ${ADMIN_EMAIL}`);
  }
  const adminId = admin._id as mongoose.Types.ObjectId;

  // Profile (upsert with rich data + object skills)
  await Profile.findOneAndUpdate(
    { user: adminId },
    { $set: { user: adminId, ...profileData } },
    { upsert: true, new: true, runValidators: true },
  );
  console.log(`✅ Profile set (${profileData.skills.length} skills)`);

  // Projects
  await Project.create(projectsData(adminId));
  console.log(`✅ Created ${projectsData(adminId).length} projects`);

  // Articles
  await Article.create(articlesData(adminId));
  console.log(`✅ Created ${articlesData(adminId).length} articles`);

  // Experience
  await Experience.create(experienceData(adminId));
  console.log(`✅ Created ${experienceData(adminId).length} experience entries`);

  // Education
  await Education.create(educationData(adminId));
  console.log(`✅ Created ${educationData(adminId).length} education entries`);

  // Settings (singleton)
  await Settings.create(settingsData);
  console.log('✅ Created site settings');

  // Messages
  await Message.create(messagesData);
  console.log(`✅ Created ${messagesData.length} messages`);

  // Subscribers (use create() so the unsubscribeToken pre-save hook runs)
  for (const sub of subscribersData) {
    await Subscriber.create(sub);
  }
  console.log(`✅ Created ${subscribersData.length} subscribers`);

  console.log('\n🎉 Seeding complete!');
  console.log('─────────────────────────────────────────');
  console.log(`Admin → ${ADMIN_EMAIL}`);
  console.log('─────────────────────────────────────────\n');
  process.exit(0);
};

seed().catch((err: unknown) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
