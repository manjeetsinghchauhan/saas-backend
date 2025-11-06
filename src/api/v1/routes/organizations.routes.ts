import { Server } from '@hapi/hapi';
import Joi from 'joi';
import { createOrganization, getOrganization } from '../controllers/organizations.controller';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { createOrganizationSchema } from '../validators/schemas/organization.schemas';

const orgResponseSchema = Joi.object({
  success: Joi.boolean(),
  message: Joi.string().optional(),
  data: Joi.object({
    id: Joi.string(),
    name: Joi.string(),
    domain: Joi.string(),
    region: Joi.string(),
    timezone: Joi.string(),
    ownerName: Joi.string().allow('', null),
  }).optional(),
});

const orgGetResponseSchema = Joi.object({
  success: Joi.boolean(),
  data: Joi.object({
    id: Joi.string(),
    name: Joi.string(),
    domain: Joi.string(),
    region: Joi.string(),
    timezone: Joi.string(),
    ownerName: Joi.string().allow('', null),
  }),
});

export const organizationRoutes = {
  name: 'organizationRoutes',
  register: (server: Server) => {
    server.route([
      {
        method: 'POST',
        path: '/api/v1/organizations',
        options: {
          pre: [
            { method: requireAuth },
            { method: requirePermission('organisation') },
          ],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown(),
            payload: createOrganizationSchema,
            failAction: 'log',
          },
          tags: ['api', 'organizations'],
          description: 'Create a new organization',
          notes: 'Creates an organization',
          plugins: {
            'hapi-swagger': {
              security: [{ jwt: [] }]
            }
          },
          response: {
            schema: orgResponseSchema,
            failAction: 'log',
          }
        },
        handler: createOrganization
      },
      {
        method: 'GET',
        path: '/api/v1/organizations',
        options: {
          pre: [{ method: requireAuth }],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown(),
            failAction: 'log',
          },
          tags: ['api', 'organizations'],
          description: 'Get organization for current token tenant',
          plugins: {
            'hapi-swagger': {
              security: [{ jwt: [] }]
            }
          },
          response: {
            schema: orgGetResponseSchema,
            failAction: 'log',
          }
        },
        handler: getOrganization
      }
    ]);
  }
}; 