import { Server } from '@hapi/hapi';
import Joi from 'joi';
import { requireAuth } from '../middleware/auth';
import { sendMessage, getChatHistory, getOnlineUsers } from '../controllers/chat.controller';

export const chatRoutes = {
  name: 'chat-routes',
  register: async (server: Server) => {
    server.route([
      {
        method: 'POST',
        path: '/api/v1/chat/send',
        options: {
          pre: [{ method: requireAuth }],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown(),
            payload: Joi.object({
              recipientId: Joi.string().uuid().required().description('Recipient user ID'),
              body: Joi.string().min(1).max(1000).required().description('Message content'),
              projectId: Joi.number().integer().optional().description('Project ID (optional)')
            })
          },
          tags: ['api', 'chat'],
          description: 'Send a message to another user',
          notes: 'Sends a message to a user within the same organization. Supports project-specific chats.',
          response: {
            schema: {
              success: Joi.boolean().description('Operation success status'),
              message: Joi.string().description('Response message'),
              data: Joi.object({
                id: Joi.string().description('Message ID'),
                body: Joi.string().description('Message content'),
                project_id: Joi.number().allow(null).description('Project ID'),
                from_user: Joi.object({
                  id: Joi.string().description('Sender user ID'),
                  email: Joi.string().description('Sender email'),
                  display_name: Joi.string().allow('', null).description('Sender display name')
                }).description('Sender information'),
                recipient_id: Joi.string().description('Recipient user ID'),
                created_at: Joi.string().description('Message creation timestamp')
              }).description('Message data')
            },
            failAction: 'log'
          }
        },
        handler: sendMessage
      },
      {
        method: 'GET',
        path: '/api/v1/chat/history',
        options: {
          pre: [{ method: requireAuth }],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown(),
            query: Joi.object({
              recipientId: Joi.string().uuid().required().description('Recipient user ID'),
              projectId: Joi.number().integer().optional().description('Project ID (optional)'),
              limit: Joi.number().integer().min(1).max(100).default(50).description('Number of messages to retrieve'),
              offset: Joi.number().integer().min(0).default(0).description('Number of messages to skip')
            })
          },
          tags: ['api', 'chat'],
          description: 'Get chat history with a user',
          notes: 'Retrieves chat history between the authenticated user and another user within the same organization.',
          response: {
            schema: {
              success: Joi.boolean().description('Operation success status'),
              message: Joi.string().description('Response message'),
              data: Joi.array().items(Joi.object({
                id: Joi.string().description('Message ID'),
                body: Joi.string().description('Message content'),
                project_id: Joi.number().allow(null).description('Project ID'),
                from_user: Joi.object({
                  id: Joi.string().description('Sender user ID'),
                  email: Joi.string().description('Sender email'),
                  display_name: Joi.string().allow('', null).description('Sender display name')
                }).description('Sender information'),
                recipient_id: Joi.string().description('Recipient user ID'),
                created_at: Joi.string().description('Message creation timestamp')
              })).description('Array of messages')
            },
            failAction: 'log'
          }
        },
        handler: getChatHistory
      },
      {
        method: 'GET',
        path: '/api/v1/chat/online-users',
        options: {
          pre: [{ method: requireAuth }],
          validate: {
            headers: Joi.object({
              authorization: Joi.string().required().description('Bearer <token>')
            }).unknown()
          },
          tags: ['api', 'chat'],
          description: 'Get online users in organization',
          notes: 'Retrieves a list of all users in the organization with their online status.',
          response: {
            schema: {
              success: Joi.boolean().description('Operation success status'),
              message: Joi.string().description('Response message'),
              data: Joi.array().items(Joi.object({
                id: Joi.string().description('User ID'),
                email: Joi.string().description('User email'),
                display_name: Joi.string().allow('', null).description('User display name'),
                online: Joi.boolean().description('User online status')
              })).description('Array of users with online status')
            },
            failAction: 'log'
          }
        },
        handler: getOnlineUsers
      }
    ]);
  }
}; 