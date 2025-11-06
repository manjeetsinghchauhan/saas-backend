import { Server } from '@hapi/hapi';
import Joi from 'joi';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { 
  assignUserToProject, 
  removeUserFromProject, 
  listProjectMembers, 
  listUserProjects 
} from '../controllers/userProjects.controller';

export const userProjectsRoutes = {
  name: 'userProjectsRoutes',
  register: (server: Server) => {
    server.route([
      {
        method: 'POST',
        path: '/api/v1/user-projects/assign',
        options: {
          pre: [{ method: requireAuth }, { method: requirePermission('project') }],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown(),
            payload: Joi.object({
              userId: Joi.string().uuid().required().description('User ID to assign'),
              projectId: Joi.number().integer().positive().required().description('Project ID to assign user to')
            })
          },
          tags: ['api', 'user-projects'],
          description: 'Assign a user to a project',
          notes: 'Assigns a user to a project within the organization. Requires project permission.',
          plugins: {
            'hapi-swagger': { security: [{ jwt: [] }] }
          },
          response: {
            schema: Joi.object({
              success: Joi.boolean(),
              message: Joi.string(),
              data: Joi.object({
                id: Joi.number(),
                user_id: Joi.string(),
                project_id: Joi.number(),
                tenant_id: Joi.string()
              })
            }),
            failAction: 'log'
          }
        },
        handler: assignUserToProject
      },
      {
        method: 'DELETE',
        path: '/api/v1/user-projects/remove',
        options: {
          pre: [{ method: requireAuth }, { method: requirePermission('project') }],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown(),
            payload: Joi.object({
              userId: Joi.string().uuid().required().description('User ID to remove'),
              projectId: Joi.number().integer().positive().required().description('Project ID to remove user from')
            })
          },
          tags: ['api', 'user-projects'],
          description: 'Remove a user from a project',
          notes: 'Removes a user from a project within the organization. Requires project permission.',
          plugins: {
            'hapi-swagger': { security: [{ jwt: [] }] }
          },
          response: {
            schema: Joi.object({
              success: Joi.boolean(),
              message: Joi.string()
            }),
            failAction: 'log'
          }
        },
        handler: removeUserFromProject
      },
      {
        method: 'GET',
        path: '/api/v1/projects/{projectId}/members',
        options: {
          pre: [{ method: requireAuth }, { method: requirePermission('project') }],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown(),
            params: Joi.object({
              projectId: Joi.number().integer().positive().required().description('Project ID')
            })
          },
          tags: ['api', 'user-projects'],
          description: 'List all members of a project',
          notes: 'Retrieves all users assigned to a specific project within the organization.',
          plugins: {
            'hapi-swagger': { security: [{ jwt: [] }] }
          },
          response: {
            schema: Joi.object({
              success: Joi.boolean(),
              message: Joi.string(),
              data: Joi.array().items(Joi.object({
                id: Joi.number(),
                user_id: Joi.string(),
                project_id: Joi.number(),
                user: Joi.object({
                  id: Joi.string(),
                  email: Joi.string(),
                  display_name: Joi.string().allow('', null),
                  role_id: Joi.number().allow(null)
                })
              }))
            }),
            failAction: 'log'
          }
        },
        handler: listProjectMembers
      },
      {
        method: 'GET',
        path: '/api/v1/users/{userId}/projects',
        options: {
          pre: [{ method: requireAuth }, { method: requirePermission('user') }],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown(),
            params: Joi.object({
              userId: Joi.string().uuid().required().description('User ID')
            })
          },
          tags: ['api', 'user-projects'],
          description: 'List all projects assigned to a user',
          notes: 'Retrieves all projects assigned to a specific user within the organization.',
          plugins: {
            'hapi-swagger': { security: [{ jwt: [] }] }
          },
          response: {
            schema: Joi.object({
              success: Joi.boolean(),
              message: Joi.string(),
              data: Joi.array().items(Joi.object({
                id: Joi.number(),
                user_id: Joi.string(),
                project_id: Joi.number(),
                project: Joi.object({
                  id: Joi.number(),
                  name: Joi.string(),
                  created_at: Joi.string()
                })
              }))
            }),
            failAction: 'log'
          }
        },
        handler: listUserProjects
      }
    ]);
  }
}; 