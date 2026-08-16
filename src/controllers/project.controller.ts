import type { Request, Response } from "express";
import { projectService } from "../services/project.service.js";
import { catchAsync, sendSuccess } from "../utils/helpers.js";
import type { IProject, ProjectQuery } from "../types/index.js";

// ─── Get all projects ─────────────────────────────────────────────────────────
export const getProjects = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await projectService.getProjects(
    req.query as ProjectQuery,
    req.user?.role,
  );
  sendSuccess(res, { data, meta });
});

// ─── Get project by ID ───────────────────────────────────────────────────────
export const getProjectById = catchAsync(
  async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const project = await projectService.getProjectById(id, req.user?.role);
    sendSuccess(res, { data: project });
  },
);

export const getComments = catchAsync(async (req: Request, res: Response) => {
  const comments = await projectService.getComments(String(req.params.id));
  sendSuccess(res, { data: comments });
});

export const addComment = catchAsync(async (req: Request, res: Response) => {
  const comments = await projectService.addComment(String(req.params.id), req.body);
  sendSuccess(res, { statusCode: 201, message: 'Comment added.', data: comments });
});

export const likeProject = catchAsync(async (req: Request, res: Response) => {
  const likes = await projectService.likeProject(String(req.params.id));
  sendSuccess(res, { data: { likes } });
});

// ─── Create a new project ────────────────────────────────────────────────────
export const createProject = catchAsync(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const project = await projectService.createProject(
    String(req.user!._id),
    req.body as Partial<IProject>,
    files,
  );
  sendSuccess(res, {
    statusCode: 201,
    message: "Project created.",
    data: project,
  });
});

// ─── Update an existing project ─────────────────────────────────────────────
export const updateProject = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const files = (req.files as Express.Multer.File[]) ?? [];
  const project = await projectService.updateProject(
    id,
    String(req.user!._id),
    req.user!.role,
    req.body as Partial<IProject>,
    files,
  );
  sendSuccess(res, { message: "Project updated.", data: project });
});

// ─── Delete a project ───────────────────────────────────────────────────────
export const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  await projectService.deleteProject(id, String(req.user!._id), req.user!.role);
  sendSuccess(res, { statusCode: 204, message: "Project deleted." });
});

// ─── Delete a project image ─────────────────────────────────────────────────
export const deleteProjectImage = catchAsync(
  async (req: Request, res: Response) => {
    const projectId = String(req.params.id);
    const publicId = String(req.params.publicId);
    const project = await projectService.deleteProjectImage(
      projectId,
      publicId,
      String(req.user!._id),
      req.user!.role,
    );
    sendSuccess(res, { message: "Image deleted.", data: project });
  },
);
