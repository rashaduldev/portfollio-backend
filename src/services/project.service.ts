import Project from '../models/project.model.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';
import { NotFoundError, AuthorizationError } from '../utils/errors.js';
import { buildSort, parsePagination, buildPaginationMeta } from '../utils/helpers.js';
import type { IProject, PaginatedResult, ProjectQuery, UserRole } from '../types/index.js';

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
