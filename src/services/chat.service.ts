import { Server as SocketIOServer } from 'socket.io';
import { Server as HapiServer } from '@hapi/hapi';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';

interface AuthenticatedSocket {
  userId: string;
  tenantId: string;
  userEmail: string;
  userDisplayName: string;
}

export class ChatService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HapiServer) {
    this.io = new SocketIOServer(server.listener, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
        
        if (!decoded.id || !decoded.tenant) {
          return next(new Error('Invalid token'));
        }

        // Get user details
        const user = await User.findByPk(decoded.id);
        if (!user) {
          return next(new Error('User not found'));
        }

        const authSocket: AuthenticatedSocket = {
          userId: decoded.id,
          tenantId: decoded.tenant,
          userEmail: (user as any).email,
          userDisplayName: (user as any).display_name
        };

        socket.data.auth = authSocket;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

          this.io.on('connection', (socket) => {
        const auth = socket.data.auth as AuthenticatedSocket;
        
        if (!auth) {
          console.log(`❌ [SOCKET] Socket ${socket.id} - No authentication data, disconnecting`);
          socket.disconnect();
          return;
        }

      // Join organization room
      socket.join(`org_${auth.tenantId}`);
      
      // Join personal room for direct messaging
      socket.join(`user_${auth.userId}`);

      // Store user connection
      this.connectedUsers.set(socket.id, auth);
      this.userSockets.set(auth.userId, socket.id);
      
      console.log(`🟢 [SOCKET] User ${auth.userEmail} connected with socket ${socket.id}`);
      console.log(`📊 [SOCKET] Total connected users: ${this.connectedUsers.size}`);
      console.log(`🏢 [SOCKET] User joined organization room: org_${auth.tenantId}`);
      console.log(`👤 [SOCKET] User joined personal room: user_${auth.userId}`);
      console.log(`📊 [SOCKET] Updated userSockets map:`, Array.from(this.userSockets.entries()));
      console.log(`📊 [SOCKET] Updated connectedUsers map:`, Array.from(this.connectedUsers.entries()).map(([socketId, user]) => ({ socketId, userId: user.userId, email: user.userEmail })));

      // Debug current state after connection
      this.debugState();

      // Emit user online status to organization
      socket.to(`org_${auth.tenantId}`).emit('user_online', {
        userId: auth.userId,
        email: auth.userEmail,
        displayName: auth.userDisplayName
      });

      // Handle private messages
      socket.on('private_message', (data) => {
        console.log(`🔵 [SOCKET] Received private_message from ${auth.userEmail}:`, data);
        
        // Debug current state
        this.debugState();
        
        const { recipientId, body, projectId } = data;
        
        // Validate recipient is in same organization
        if (this.connectedUsers.has(socket.id)) {
          const sender = this.connectedUsers.get(socket.id)!;
          console.log(`🔍 [SOCKET] Looking for recipient ${recipientId} in userSockets map`);
          console.log(`🔍 [SOCKET] Current userSockets map:`, Array.from(this.userSockets.entries()));
          
          const recipientSocketId = this.userSockets.get(recipientId);
          console.log(`🔍 [SOCKET] Found recipient socket ID: ${recipientSocketId}`);
          
          if (recipientSocketId && this.io.sockets.sockets.has(recipientSocketId)) {
            const recipientSocket = this.io.sockets.sockets.get(recipientSocketId)!;
            const recipientAuth = recipientSocket.data.auth as AuthenticatedSocket;
            
            console.log(`🔍 [SOCKET] Recipient auth data:`, recipientAuth);
            
            if (recipientAuth.tenantId === sender.tenantId) {
              console.log(`✅ [SOCKET] Sending message to ${recipientAuth.userEmail} (${recipientId})`);
              
              // Send to recipient
              recipientSocket.emit('new_message', {
                from_user: {
                  id: sender.userId,
                  email: sender.userEmail,
                  display_name: sender.userDisplayName
                },
                body,
                project_id: projectId,
                created_at: new Date().toISOString()
              });
              
              // Send confirmation to sender
              socket.emit('message_sent', {
                recipientId,
                body,
                projectId,
                timestamp: new Date().toISOString()
              });
              
              console.log(`✅ [SOCKET] Message sent successfully to ${recipientAuth.userEmail}`);
            } else {
              console.log(`❌ [SOCKET] Tenant validation failed for message from ${sender.userEmail} to ${recipientId}`);
              console.log(`❌ [SOCKET] Sender tenant: ${sender.tenantId}, Recipient tenant: ${recipientAuth.tenantId}`);
            }
          } else {
            console.log(`❌ [SOCKET] Recipient ${recipientId} not found or offline`);
            console.log(`❌ [SOCKET] Socket exists: ${this.io.sockets.sockets.has(recipientSocketId || '')}`);
            console.log(`❌ [SOCKET] Available sockets:`, Array.from(this.io.sockets.sockets.keys()));
          }
        } else {
          console.log(`❌ [SOCKET] Sender not found in connectedUsers map`);
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        console.log(`⌨️ [SOCKET] Received typing_start from ${auth.userEmail}:`, data);
        
        const { recipientId } = data;
        const recipientSocketId = this.userSockets.get(recipientId);
        
        if (recipientSocketId && this.io.sockets.sockets.has(recipientSocketId)) {
          const recipientSocket = this.io.sockets.sockets.get(recipientSocketId)!;
          const recipientAuth = recipientSocket.data.auth as AuthenticatedSocket;
          
          if (recipientAuth.tenantId === auth.tenantId) {
            console.log(`✅ [SOCKET] Sending typing indicator to ${recipientAuth.userEmail}`);
            recipientSocket.emit('user_typing', {
              userId: auth.userId,
              displayName: auth.userDisplayName
            });
          } else {
            console.log(`❌ [SOCKET] Tenant validation failed for typing indicator`);
          }
        } else {
          console.log(`❌ [SOCKET] Recipient ${recipientId} not found for typing indicator`);
        }
      });

      socket.on('typing_stop', (data) => {
        console.log(`⏹️ [SOCKET] Received typing_stop from ${auth.userEmail}:`, data);
        
        const { recipientId } = data;
        const recipientSocketId = this.userSockets.get(recipientId);
        
        if (recipientSocketId && this.io.sockets.sockets.has(recipientSocketId)) {
          const recipientSocket = this.io.sockets.sockets.get(recipientSocketId)!;
          const recipientAuth = recipientSocket.data.auth as AuthenticatedSocket;
          
          if (recipientAuth.tenantId === auth.tenantId) {
            console.log(`✅ [SOCKET] Sending typing stop to ${recipientAuth.userEmail}`);
            recipientSocket.emit('user_stopped_typing', {
              userId: auth.userId
            });
          }
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (this.connectedUsers.has(socket.id)) {
          const user = this.connectedUsers.get(socket.id)!;
          console.log(`🔴 [SOCKET] User ${user.userEmail} disconnected from socket ${socket.id}`);
          
          this.connectedUsers.delete(socket.id);
          this.userSockets.delete(user.userId);
          
          socket.to(`org_${user.tenantId}`).emit('user_offline', {
            userId: user.userId
          });
          
          console.log(`📊 [SOCKET] Total connected users: ${this.connectedUsers.size}`);
          
          // Debug state after disconnection
          this.debugState();
        }
      });
    });
  }

  // Method to emit messages from HTTP API
  public emitToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId && this.io.sockets.sockets.has(socketId)) {
      const socket = this.io.sockets.sockets.get(socketId)!;
      socket.emit(event, data);
      return true;
    }
    return false;
  }

  // Method to emit to user's personal room
  public emitToPersonalRoom(userId: string, event: string, data: any) {
    this.io.to(`user_${userId}`).emit(event, data);
    return true;
  }

  // Method to emit to organization room
  public emitToOrganization(tenantId: string, event: string, data: any) {
    this.io.to(`org_${tenantId}`).emit(event, data);
    return true;
  }

  // Get list of online user IDs
  public getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  // Get online users count for an organization
  public getOnlineUsersCount(tenantId: string): number {
    let count = 0;
    for (const [_, user] of this.connectedUsers) {
      if (user.tenantId === tenantId) {
        count++;
      }
    }
    return count;
  }

  // Get users in a specific room
  public getUsersInRoom(roomName: string): string[] {
    const room = this.io.sockets.adapter.rooms.get(roomName);
    if (room) {
      return Array.from(room);
    }
    return [];
  }

  // Get user's current rooms
  public getUserRooms(userId: string): string[] {
    const socketId = this.userSockets.get(userId);
    if (socketId && this.io.sockets.sockets.has(socketId)) {
      const socket = this.io.sockets.sockets.get(socketId)!;
      return Array.from(socket.rooms);
    }
    return [];
  }

  // Broadcast message to all users in an organization
  public broadcastToOrganization(tenantId: string, event: string, data: any, excludeUserId?: string) {
    if (excludeUserId) {
      // Exclude specific user from broadcast
      this.io.to(`org_${tenantId}`).except(`user_${excludeUserId}`).emit(event, data);
    } else {
      // Broadcast to all users in organization
      this.io.to(`org_${tenantId}`).emit(event, data);
    }
    return true;
  }

  // Debug method to show current state
  public debugState() {
    console.log(`🔍 [DEBUG] Current Socket.IO State:`);
    console.log(`🔍 [DEBUG] Total connected users: ${this.connectedUsers.size}`);
    console.log(`🔍 [DEBUG] Total user sockets: ${this.userSockets.size}`);
    console.log(`🔍 [DEBUG] Connected users:`, Array.from(this.connectedUsers.entries()).map(([socketId, user]) => ({ socketId, userId: user.userId, email: user.userEmail, tenantId: user.tenantId })));
    console.log(`🔍 [DEBUG] User sockets:`, Array.from(this.userSockets.entries()));
    console.log(`🔍 [DEBUG] Available socket IDs:`, Array.from(this.io.sockets.sockets.keys()));
  }
}
