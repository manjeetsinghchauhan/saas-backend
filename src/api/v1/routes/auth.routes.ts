import { Server } from "@hapi/hapi";
import * as AuthController from "../controllers/auth.controller";
import { registerSchema, loginSchema } from "../validators/schemas/auth.schemas";
import { createValidation } from "../middleware/validation";
import Joi from "joi";

export const authRoutes = {
  name: "auth-routes",
  register: async (server: Server) => {
    server.route([
      {
        method: "POST",
        path: "/api/v1/register/users",
        handler: AuthController.register,
        options: { 
          tags: ["api", "Users"],
          description: "Register a new user in an organization",
          notes: "Creates a new user account with email, password, name, and role. Requires Bearer token with organization context.",
          validate: { 
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown(),
            payload: registerSchema 
          },
          response: {
            schema: {
              message: "string"
            },
            failAction: 'log'
          }
        },
      },
      {
        method: "POST",
        path: "/api/v1/auth/login",
        handler: AuthController.login,
        options: { 
          tags: ["api", "Auth"],
          description: "Authenticate user and get JWT token with user data",
          notes: "Logs in a user with email and password, returns JWT token and user information including role and organization details",
          validate: { payload: loginSchema },
          response: {
            schema: {
              message: "string",
              token: "string",
              user: Joi.object({
                id: Joi.string().description('User ID'),
                email: Joi.string().description('User email'),
                display_name: Joi.string().allow('', null).description('User display name'),
                role_id: Joi.number().description('User role ID'),
                tenant_id: Joi.string().description('User organization ID'),
                created_at: Joi.string().description('User creation timestamp'),
                role: Joi.object({
                  id: Joi.number().description('Role ID'),
                  name: Joi.string().description('Role name')
                }).description('User role information'),
                organization: Joi.object({
                  id: Joi.string().description('Organization ID'),
                  name: Joi.string().description('Organization name'),
                  domain: Joi.string().description('Organization domain'),
                  region: Joi.string().description('Organization region'),
                  timezone: Joi.string().description('Organization timezone')
                }).description('User organization information')
              }).description('User information')
            },
            failAction: 'log'
          }
        },
      },
    ]);
  },
};
