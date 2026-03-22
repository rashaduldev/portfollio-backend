import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/user.model.js';
import Profile from './models/profile.model.js';
import Project from './models/project.model.js';
import Article from './models/article.model.js';
import Message from './models/message.model.js';
import Subscriber from './models/subscriber.model.js';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/portfolio';

// ─── Seed data ────────────────────────────────────────────────────────────────
const usersData = [
  { name: 'Admin User',      email: 'admin@portfolio.com', password: 'Admin1234', role: 'admin' as const },
  { name: 'Jane Developer',  email: 'jane@portfolio.com',  password: 'User1234',  role: 'user'  as const },
];

const projectsData = (userId: mongoose.Types.ObjectId) => [
  {
    user: userId,
    title: 'E-Commerce Platform',
    description: 'A full-stack e-commerce solution with React, Node.js, and Stripe integration.',
    shortDescription: 'Full-stack e-commerce with Stripe payments.',
    techStack: ['React', 'Node.js', 'MongoDB', 'Stripe', 'Redux'],
    tags: ['fullstack', 'ecommerce', 'react'],
    category: 'Web App',
    liveUrl: 'https://ecommerce.example.com',
    githubUrl: 'https://github.com/example/ecommerce',
    isFeatured: true,
    isPublished: true,
    images: [],
    order: 1,
  },
  {
    user: userId,
    title: 'Portfolio API (TypeScript)',
    description: 'A production-ready REST API built with Node.js, Express, MongoDB, and TypeScript.',
    shortDescription: 'Production-grade REST API with TypeScript.',
    techStack: ['Node.js', 'TypeScript', 'Express', 'MongoDB', 'Cloudinary'],
    tags: ['backend', 'api', 'typescript'],
    category: 'Backend',
    githubUrl: 'https://github.com/example/portfolio-api',
    isFeatured: true,
    isPublished: true,
    images: [],
    order: 2,
  },
];

const articlesData = (userId: mongoose.Types.ObjectId) => [
  {
    user: userId,
    title: 'Building Production-Ready APIs with TypeScript and Node.js',
    excerpt: 'Learn best practices for type-safe, scalable REST APIs.',
    content: '# Building Production-Ready APIs\n\nTypeScript brings static typing to Node.js backends, catching bugs at compile time...',
    contentType: 'markdown' as const,
    tags: ['typescript', 'nodejs', 'api', 'backend'],
    category: 'Backend',
    status: 'published' as const,
    isFeatured: true,
  },
  {
    user: userId,
    title: 'MongoDB Schema Design Best Practices',
    excerpt: 'A guide to designing efficient Mongoose schemas.',
    content: '# MongoDB Schema Design\n\nDesigning a good MongoDB schema is crucial for performance...',
    contentType: 'markdown' as const,
    tags: ['mongodb', 'database', 'backend'],
    category: 'Database',
    status: 'published' as const,
  },
  {
    user: userId,
    title: 'Draft: React Performance Optimization',
    excerpt: 'Techniques for optimizing React apps.',
    content: '# React Performance\n\nWork in progress...',
    contentType: 'markdown' as const,
    tags: ['react', 'frontend', 'performance'],
    category: 'Frontend',
    status: 'draft' as const,
  },
];

const messagesData = [
  { name: 'Alice Smith',   email: 'alice@example.com', subject: 'Project Inquiry',  body: 'Hi, I saw your portfolio and would love to discuss a project.',        isRead: false },
  { name: 'Bob Johnson',   email: 'bob@example.com',   subject: 'Job Opportunity',  body: 'We have an exciting opportunity at our company. Please reach out!',    isRead: true  },
  { name: 'Carol Williams',email: 'carol@example.com', subject: 'Collaboration',    body: 'I would love to collaborate on an open-source project with you.',       isRead: false },
];

const subscribersData = [
  { email: 'subscriber1@example.com', isActive: true  },
  { email: 'subscriber2@example.com', isActive: true  },
  { email: 'unsubscribed@example.com', isActive: false },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
const seed = async (): Promise<void> => {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  if (process.argv.includes('--destroy')) {
    await Promise.all([
      User.deleteMany({}),
      Profile.deleteMany({}),
      Project.deleteMany({}),
      Article.deleteMany({}),
      Message.deleteMany({}),
      Subscriber.deleteMany({}),
    ]);
    console.log('🗑️  All collections wiped.');
    process.exit(0);
  }

  // Create users
  const createdUsers: mongoose.Document[] = [];
  for (const userData of usersData) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`⚠️  User ${userData.email} already exists — skipping.`);
      createdUsers.push(existing);
      continue;
    }
    const user = await User.create(userData);
    await Profile.create({
      user:     user._id,
      bio:      `Hi, I'm ${user.name}. I build things for the web.`,
      headline: 'Full-Stack Developer',
      skills:   ['TypeScript', 'Node.js', 'React', 'MongoDB'],
    });
    createdUsers.push(user);
    console.log(`✅ Created user: ${userData.email} (${userData.role})`);
  }

  const adminUser = (await User.findOne({ role: 'admin' }))!;

  // Projects
  for (const data of projectsData(adminUser._id as mongoose.Types.ObjectId)) {
    await Project.create(data);
  }
  console.log(`✅ Created ${projectsData(adminUser._id as mongoose.Types.ObjectId).length} projects`);

  // Articles
  for (const data of articlesData(adminUser._id as mongoose.Types.ObjectId)) {
    await Article.create(data);
  }
  console.log(`✅ Created ${articlesData(adminUser._id as mongoose.Types.ObjectId).length} articles`);

  // Messages
  await Message.insertMany(messagesData);
  console.log(`✅ Created ${messagesData.length} messages`);

  // Subscribers
  await Subscriber.insertMany(subscribersData);
  console.log(`✅ Created ${subscribersData.length} subscribers`);

  console.log('\n🎉 Seeding complete!');
  console.log('─────────────────────────────────────────');
  console.log('Admin → admin@portfolio.com / Admin1234');
  console.log('User  → jane@portfolio.com  / User1234');
  console.log('─────────────────────────────────────────\n');
  process.exit(0);
};

seed().catch((err: unknown) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
