import { Server } from '@hapi/hapi';
import Joi from 'joi';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { listUsersInOrg, getUserById, getUserPermissions, getAllRoles } from '../controllers/users.controller';

export const usersRoutes = {
  name: 'usersRoutes',
  register: (server: Server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/v1/users',
        options: {
          pre: [{ method: requireAuth }, { method: requirePermission('user') }],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown()
          },
          tags: ['api', 'users'],
          description: 'List all users in the organization',
          notes: 'Retrieves a list of all users within the caller\'s organization',
          plugins: {
            'hapi-swagger': { security: [{ jwt: [] }] }
          },
          response: {
            schema: Joi.object({
              success: Joi.boolean(),
              message: Joi.string(),
              data: Joi.array().items(Joi.object({
                id: Joi.string(),
                email: Joi.string(),
                display_name: Joi.string().allow('', null),
                role_id: Joi.number().allow(null),
                tenant_id: Joi.string().allow('', null),
                created_at: Joi.string().allow(null),
              }))
            }),
            failAction: 'log'
          }
        },
        handler: listUsersInOrg
      },
      {
        method: 'GET',
        path: '/api/v1/users/{id}',
        options: {
          pre: [{ method: requireAuth }, { method: requirePermission('user') }],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown(),
            params: Joi.object({
              id: Joi.string().uuid().required().description('User ID')
            })
          },
          tags: ['api', 'users'],
          description: 'Get user by ID',
          notes: 'Retrieves a specific user by ID, scoped to the caller\'s organization',
          plugins: {
            'hapi-swagger': { security: [{ jwt: [] }] }
          },
          response: {
            schema: Joi.object({
              success: Joi.boolean(),
              message: Joi.string(),
              data: Joi.object({
                id: Joi.string(),
                email: Joi.string(),
                display_name: Joi.string().allow('', null),
                role_id: Joi.number().allow(null),
                tenant_id: Joi.string().allow('', null),
                created_at: Joi.string().allow(null),
              })
            }),
            failAction: 'log'
          }
        },
        handler: getUserById
      },
      {
        method: 'GET',
        path: '/api/v1/users/me/permissions',
        options: {
          pre: [{ method: requireAuth }],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown()
          },
          tags: ['api', 'users'],
          description: 'Get current user permissions',
          notes: 'Retrieves the permission matrix for the currently authenticated user based on their role',
          plugins: {
            'hapi-swagger': { security: [{ jwt: [] }] }
          },
          response: {
            schema: Joi.object({
              success: Joi.boolean(),
              message: Joi.string(),
              data: Joi.object({
                user: Joi.object({
                  id: Joi.string(),
                  email: Joi.string(),
                  display_name: Joi.string().allow('', null),
                  role_id: Joi.number().allow(null),
                  tenant_id: Joi.string().allow('', null)
                }),
                role: Joi.object({
                  id: Joi.number(),
                  name: Joi.string()
                }),
                permissions: Joi.array().items(Joi.object({
                  id: Joi.string(),
                  role_id: Joi.number(),
                  module: Joi.string(),
                  view: Joi.boolean(),
                  add: Joi.boolean(),
                  edit: Joi.boolean(),
                  delete: Joi.boolean()
                }))
              })
            }),
            failAction: 'log'
          }
        },
        handler: getUserPermissions
      },
      {
        method: 'GET',
        path: '/api/v1/roles',
        options: {
          pre: [{ method: requireAuth }],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown()
          },
          tags: ['api', 'users'],
          description: 'Get all available roles',
          notes: 'Retrieves a list of all available roles in the system',
          plugins: {
            'hapi-swagger': { security: [{ jwt: [] }] }
          },
          response: {
            schema: Joi.object({
              success: Joi.boolean(),
              message: Joi.string(),
              data: Joi.array().items(Joi.object({
                id: Joi.number(),
                name: Joi.string()
              }))
            }),
            failAction: 'log'
          }
        },
        handler: getAllRoles
      }
    ]);
  }
}; 