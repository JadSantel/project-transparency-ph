import { createProjectSchema, projectQuerySchema, updateProjectSchema } from '@transparency-ph/shared-types';
import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { validate } from '../middlewares/validate.js';

export const projectRouter = Router();

projectRouter.get('/', validate(projectQuerySchema, 'query'), projectController.listProjects);
projectRouter.get('/:idOrSlug', projectController.getProject);
projectRouter.post('/', validate(createProjectSchema, 'body'), projectController.createProject);
projectRouter.patch('/:idOrSlug', validate(updateProjectSchema, 'body'), projectController.updateProject);
projectRouter.delete('/:idOrSlug', projectController.deleteProject);
