import { Server } from '@hapi/hapi';
import { createProject, listProjects, getProjectById } from '../controllers/projects.controller';
import { requireAuth } from '../middleware/auth';
import { createProjectSchema } from '../validators/schemas/project.schemas';
import { createValidation } from '../middleware/validation';
import Joi from 'joi';
import { requirePermission } from '../middleware/rbac';

export const projectRoutes = {
  name: 'projectRoutes',
  register: (server: Server) => {
    server.route([
      {
        method: 'POST',
        path: '/api/v1/projects',
        options: {
          pre: [{ method: requireAuth }, { method: requirePermission('project') }],
          // Show header in Swagger and validate payload
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown(),
            payload: createProjectSchema
          },
          tags: ['api', 'projects'],
          description: 'Create a new project',
          notes: 'Creates a new project for the authenticated user in their tenant',
          plugins: {
            'hapi-swagger': {
              security: [{ jwt: [] }]
            }
          },
          response: {
            schema: {
              success: "boolean",
              message: "string",
              data: {
                id: "number",
                name: "string",
                tenant_id: "string",
                created_by: "string",
                createdAt: "string",
                updatedAt: "string"
              }
            },
            failAction: 'log'
          }
        },
        handler: createProject,
      },
      {
        method: 'GET',
        path: '/api/v1/projects',
        options: {
          pre: [{ method: requireAuth }, { method: requirePermission('project') }],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown()
          },
          tags: ['api', 'projects'],
          description: 'List all projects',
          notes: 'Retrieves all projects for the authenticated user in their tenant',
          plugins: {
            'hapi-swagger': {
              security: [{ jwt: [] }]
            }
          },
          response: {
            schema: {
              success: "boolean",
              message: "string",
              data: [{
                id: "number",
                name: "string",
                tenant_id: "string",
                created_by: "string",
                createdAt: "string",
                updatedAt: "string"
              }]
            },
            failAction: 'log'
          }
        },
        handler: listProjects,
      },
      {
        method: 'GET',
        path: '/api/v1/projects/{id}',
        options: {
          pre: [{ method: requireAuth }, { method: requirePermission('project') }],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown(),
            params: Joi.object({
              id: Joi.number().integer().positive().required().description('Project ID')
            })
          },
          tags: ['api', 'projects'],
          description: 'Get project by ID',
          notes: 'Retrieves a specific project by ID, scoped to the user\'s organization',
          plugins: {
            'hapi-swagger': {
              security: [{ jwt: [] }]
            }
          },
          response: {
            schema: {
              success: "boolean",
              message: "string",
              data: {
                id: "number",
                name: "string",
                tenant_id: "string",
                created_by: "string",
                createdAt: "string",
                updatedAt: "string"
              }
            },
            failAction: 'log'
          }
        },
        handler: getProjectById,
      },
    ]);
  },
};
