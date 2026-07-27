import {
  createProjectSchema,
  projectQuerySchema,
  projectUpdatesQuerySchema,
  updateProjectSchema,
} from '@transparency-ph/shared-types';
import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { validate } from '../middlewares/validate.js';
import { citizenReportRouter } from './citizen-report.routes.js';

export const projectRouter = Router();

projectRouter.get('/', validate(projectQuerySchema, 'query'), projectController.listProjects);
projectRouter.get('/:idOrSlug', projectController.getProject);
projectRouter.get(
  '/:idOrSlug/updates',
  validate(projectUpdatesQuerySchema, 'query'),
  projectController.getProjectUpdates,
);
projectRouter.use('/:idOrSlug/reports', citizenReportRouter);
projectRouter.post('/', validate(createProjectSchema, 'body'), projectController.createProject);
projectRouter.patch('/:idOrSlug', validate(updateProjectSchema, 'body'), projectController.updateProject);
projectRouter.delete('/:idOrSlug', projectController.deleteProject);
