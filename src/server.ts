import Hapi from "@hapi/hapi";
import Inert from "@hapi/inert";
import Vision from "@hapi/vision";
import HapiSwagger from "hapi-swagger";
import Joi from "joi";
import { authRoutes } from './api/v1/routes/auth.routes';
import { projectRoutes } from './api/v1/routes/projects.routes';
import { organizationRoutes } from './api/v1/routes/organizations.routes';
import { usersRoutes } from './api/v1/routes/users.routes';
import { userProjectsRoutes } from './api/v1/routes/userProjects.routes';
import { chatRoutes } from './api/v1/routes/chat.routes';
import { sequelize } from './config/database';
import { Client } from 'pg';
import { QueryTypes } from 'sequelize';
import { ChatService } from './services/chat.service';

async function ensureDatabase() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: 'postgres'
  });

  try {
    await client.connect();
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = 'saas_poc'");
    
    if (result.rows.length === 0) {
      await client.query('CREATE DATABASE saas_poc');
      console.log('Database saas_poc created successfully');
    } else {
      console.log('Database saas_poc already exists');
    }
  } catch (error) {
    console.error('Error ensuring database:', error);
  } finally {
    await client.end();
  }
}

export async function init() {
  try {
    // Ensure database exists
    await ensureDatabase();
    
              // Check if tables exist, if not then sync
          try {
            await sequelize.authenticate();
            const tableExists = await sequelize.query(
              "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')",
              { type: QueryTypes.SELECT }
            );
            
            if (tableExists[0] && (tableExists[0] as any).exists) {
              console.log('Tables already exist, skipping sync');
            } else {
              console.log('Tables do not exist, syncing database...');
              await sequelize.sync();
              console.log('Database synchronized successfully');
            }
          } catch (error) {
            console.log('Database sync error, creating tables...');
            await sequelize.sync();
            console.log('Database synchronized successfully');
          }

    const server = Hapi.server({
      port: parseInt(process.env.PORT || '4000', 10),
      host: process.env.HOST || "localhost",
      routes: {
        cors: {
          origin: ["*"],
          credentials: true,
          additionalHeaders: ['X-Requested-With', 'Content-Type', 'Authorization', 'Accept', 'Origin'],
          additionalExposedHeaders: ['X-Requested-With', 'Content-Type', 'Authorization', 'Accept', 'Origin']
        },
        files: {
          relativeTo: __dirname + '/../public'
        }
      },
    });

    // Register Joi as the server validator
    server.validator(Joi);

    // Add CORS extension to handle CORS headers on all responses
    server.ext('onPreResponse', (request, h) => {
      const response = request.response;
      if ((response as any).isBoom) {
        // Handle error responses
        (response as any).output.headers['Access-Control-Allow-Origin'] = '*';
        (response as any).output.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
        (response as any).output.headers['Access-Control-Allow-Headers'] = 'X-Requested-With, Content-Type, Authorization, Accept, Origin';
        (response as any).output.headers['Access-Control-Allow-Credentials'] = 'true';
      } else {
        // Handle successful responses
        (response as any).header('Access-Control-Allow-Origin', '*');
        (response as any).header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        (response as any).header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, Accept, Origin');
        (response as any).header('Access-Control-Allow-Credentials', 'true');
      }
      return h.continue;
    });

    // Register plugins
    await server.register([
      Inert,
      Vision,
      {
        plugin: HapiSwagger,
        options: {
          info: {
            title: "SaaS POC API",
            version: "1.0.0",
            description: "Multi-tenant SaaS application API with role-based access control and real-time chat",
            contact: {
              name: "Manjeet Chauhan",
              email: "manjeet.perfect@gmail.com"
            }
          },
          schemes: ["http", "https"],
          host: `${process.env.HOST || 'localhost'}:${process.env.PORT || '4000'}`,
          basePath: "/api/v1",
          pathPrefixSize: 3,
          documentationPath: "/docs",
          swaggerUIPath: "/docs",
          jsonPath: "/swagger.json",
          sortTags: "alpha",
          tags: [
            { name: "api", description: "API endpoints" },
            { name: "auth", description: "Authentication endpoints" },
            { name: "organizations", description: "Organization management" },
            { name: "projects", description: "Project management" },
            { name: "users", description: "User management" },
            { name: "user-projects", description: "User-Project assignments" },
            { name: "chat", description: "Real-time chat functionality" }
          ]
        }
      }
    ]);

    // Register routes
    await server.register([authRoutes, projectRoutes, organizationRoutes, usersRoutes, userProjectsRoutes, chatRoutes]);

    // Add global CORS handler for OPTIONS requests
    server.route({
      method: 'OPTIONS',
      path: '/{p*}',
      handler: (request, h) => {
        const response = h.response().code(200);
        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        response.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, Accept, Origin');
        response.header('Access-Control-Allow-Credentials', 'true');
        response.header('Access-Control-Max-Age', '86400');
        return response;
      },
      options: {
        cors: {
          origin: ['*'],
          credentials: true,
          additionalHeaders: ['X-Requested-With', 'Content-Type', 'Authorization', 'Accept', 'Origin'],
          additionalExposedHeaders: ['X-Requested-With', 'Content-Type', 'Authorization', 'Accept', 'Origin']
        }
      }
    });

    // Serve static files
    server.route({
      method: 'GET',
      path: '/chat-test',
      handler: {
        file: 'chat-test.html'
      }
    });

    server.route({
      method: 'GET',
      path: '/chat-debug',
      handler: {
        file: 'chat-debug.html'
      }
    });

    // Initialize chat service with Socket.IO
    const chatService = new ChatService(server);
    (server as any).chatService = chatService;
    console.log('Chat service initialized with Socket.IO');

    return server;
  } catch (error) {
    console.error('Failed to initialize server:', error);
    throw error;
  }
}
