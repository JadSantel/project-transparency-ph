import type {
  CreateProjectInput,
  ProjectQuery,
  ProjectUpdatesQuery,
  UpdateProjectInput,
} from '@transparency-ph/shared-types';
import { Request, Response } from 'express';
import * as projectService from '../services/project.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectService.listProjects(req.query as unknown as ProjectQuery);
  res.status(200).json(result);
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getProject(req.params.idOrSlug);
  res.status(200).json({ data: project });
});

export const getProjectUpdates = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectService.getProjectUpdates(req.params.idOrSlug, req.query as unknown as ProjectUpdatesQuery);
  res.status(200).json(result);
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.createProject(req.body as CreateProjectInput);
  res.status(201).json({ data: project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.updateProject(req.params.idOrSlug, req.body as UpdateProjectInput);
  res.status(200).json({ data: project });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  await projectService.deleteProject(req.params.idOrSlug);
  res.status(204).send();
});
