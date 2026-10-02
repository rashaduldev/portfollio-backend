import Project from '../models/project.model.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';
import { NotFoundError, AuthorizationError, ConflictError, ValidationError } from '../utils/errors.js';
import { buildSort, parsePagination, buildPaginationMeta } from '../utils/helpers.js';
import type { IProject, PaginatedResult, ProjectQuery, UserRole } from '../types/index.js';
import mongoose from 'mongoose';
import { engagementService, hashVisitor, publicComments } from './engagement.service.js';

export const projectService = {
  async getProjects(
    query: ProjectQuery,
    userRole?: UserRole
  ): Promise<PaginatedResult<IProject>> {
    const { page, limit, skip } = parsePagination(query as Record<string, unknown>);
    const sort = buildSort(query.sort, { order: 1, createdAt: -1 });

    const filter: Record<string, unknown> = {};

    if (userRole !== 'admin') filter.isPublished = true;
    if (query.search)     filter.$text = { $search: query.search };
    if (query.category)   filter.category = { $regex: query.category, $options: 'i' };
    if (query.isFeatured !== undefined)
      filter.isFeatured = query.isFeatured === 'true';
    if (query.tags) {
      filter.tags = { $in: query.tags.split(',').map((t) => t.trim().toLowerCase()) };
    }
    if (query.techStack) {
      filter.techStack = { $in: query.techStack.split(',').map((t) => t.trim()) };
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name'),
      Project.countDocuments(filter),
    ]);

    return { data: projects, meta: buildPaginationMeta({ total, page, limit }) };
  },

  async getProjectById(id: string, userRole?: UserRole): Promise<IProject> {
    const project = await Project.findById(id).populate('user', 'name email');
    if (!project) throw new NotFoundError('Project');
    if (!project.isPublished && userRole !== 'admin') throw new NotFoundError('Project');

    await Project.findByIdAndUpdate(id, { $inc: { views: 1 } });
    return project;
  },

  async getComments(id: string, visitorId?: string) {
    if (!mongoose.isValidObjectId(id)) return (await engagementService.get('project', id, visitorId)).comments;
    const project = await Project.findById(id).select('comments +comments.visitorHash');
    if (!project) throw new NotFoundError('Project');
    return publicComments(project.comments || [], visitorId);
  },

  async getEngagement(id: string, visitorId?: string) {
    if (!mongoose.isValidObjectId(id)) return engagementService.get('project', id, visitorId);
    const project = await Project.findById(id).select('likes comments +comments.visitorHash +likedBy');
    if (!project) throw new NotFoundError('Project');
    const visitorHash = visitorId ? hashVisitor(visitorId) : undefined;
    return {
      likes: project.likes ?? 0,
      comments: publicComments(project.comments ?? [], visitorId),
      hasLiked: Boolean(visitorHash && project.likedBy?.includes(visitorHash)),
    };
  },

  async addComment(id: string, data: { name: string; content: string }, visitorId: string) {
    if (!mongoose.isValidObjectId(id)) return engagementService.addComment('project', id, data, visitorId);
    const visitorHash = hashVisitor(visitorId);
    const project = await Project.findOneAndUpdate(
      { _id: id, comments: { $not: { $elemMatch: { visitorHash } } } },
      { $push: { comments: { ...data, visitorHash, createdAt: new Date() } } },
      { new: true },
    ).select('comments +comments.visitorHash');
    if (!project) {
      if (!(await Project.exists({ _id: id }))) throw new NotFoundError('Project');
      throw new ConflictError('You already commented on this project. You can edit or delete your existing comment.');
    }
    return publicComments(project.comments, visitorId);
  },

  async likeProject(id: string, visitorId: string) {
    if (!mongoose.isValidObjectId(id)) return engagementService.like('project', id, visitorId);
    const visitorHash = hashVisitor(visitorId);
    const project = await Project.findOneAndUpdate(
      { _id: id, likedBy: { $ne: visitorHash } },
      { $inc: { likes: 1 }, $addToSet: { likedBy: visitorHash } },
      { new: true },
    ).select('likes');
    if (!project) {
      if (!(await Project.exists({ _id: id }))) throw new NotFoundError('Project');
      throw new ConflictError('You already liked this project from this device.');
    }
    return project.likes;
  },

  async updateOwnComment(id: string, commentId: string, content: string, visitorId: string) {
    if (!mongoose.isValidObjectId(id)) return engagementService.updateOwnComment('project', id, commentId, content, visitorId);
    if (!mongoose.isValidObjectId(commentId)) throw new ValidationError('Invalid comment ID');
    const visitorHash = hashVisitor(visitorId);
    const project = await Project.findOneAndUpdate(
      { _id: id, comments: { $elemMatch: { _id: commentId, visitorHash } } },
      { $set: { 'comments.$.content': content } },
      { new: true },
    ).select('comments +comments.visitorHash');
    if (!project) throw new AuthorizationError('You can only edit your own comment.');
    return publicComments(project.comments, visitorId);
  },

  async deleteOwnComment(id: string, commentId: string, visitorId: string) {
    if (!mongoose.isValidObjectId(id)) return engagementService.deleteOwnComment('project', id, commentId, visitorId);
    if (!mongoose.isValidObjectId(commentId)) throw new ValidationError('Invalid comment ID');
    const visitorHash = hashVisitor(visitorId);
    const project = await Project.findOneAndUpdate(
      { _id: id, comments: { $elemMatch: { _id: commentId, visitorHash } } },
      { $pull: { comments: { _id: commentId, visitorHash } } },
      { new: true },
    ).select('comments +comments.visitorHash');
    if (!project) throw new AuthorizationError('You can only delete your own comment.');
    return publicComments(project.comments, visitorId);
  },

  async createProject(
    userId: string,
    data: Partial<IProject>,
    files: Express.Multer.File[] = []
  ): Promise<IProject> {
    const images = files.map((f, i) => ({
      url:       f.path,
      publicId:  f.filename,
      isPrimary: i === 0,
    }));

    return Project.create({ ...data, user: userId, images });
  },

  async updateProject(
    id: string,
    userId: string,
    role: UserRole,
    data: Partial<IProject>,
    files: Express.Multer.File[] = []
  ): Promise<IProject> {
    const project = await Project.findById(id);
    if (!project) throw new NotFoundError('Project');
    if (role !== 'admin' && String(project.user) !== userId) {
      throw new AuthorizationError();
    }

    const updateData: Partial<IProject> = { ...data };

    if (files.length > 0) {
      const newImages = files.map((f, i) => ({
        url:       f.path,
        publicId:  f.filename,
        isPrimary: project.images.length === 0 && i === 0,
      }));
      updateData.images = [...project.images, ...newImages];
    }

    const updated = await Project.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updated) throw new NotFoundError('Project');
    return updated;
  },

  async deleteProject(id: string, userId: string, role: UserRole): Promise<void> {
    const project = await Project.findById(id);
    if (!project) throw new NotFoundError('Project');
    if (role !== 'admin' && String(project.user) !== userId) {
      throw new AuthorizationError();
    }

    await Promise.all(project.images.map((img) => deleteCloudinaryFile(img.publicId)));
    await project.deleteOne();
  },

  async deleteProjectImage(
    projectId: string,
    publicId: string,
    userId: string,
    role: UserRole
  ): Promise<IProject> {
    const project = await Project.findById(projectId);
    if (!project) throw new NotFoundError('Project');
    if (role !== 'admin' && String(project.user) !== userId) {
      throw new AuthorizationError();
    }

    await deleteCloudinaryFile(publicId);
    project.images = project.images.filter((img) => img.publicId !== publicId);

    if (project.images.length > 0 && !project.images.some((i) => i.isPrimary)) {
      project.images[0].isPrimary = true;
    }
    await project.save();
    return project;
  },
};
