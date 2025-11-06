import { Request, ResponseToolkit } from "@hapi/hapi";
import { Message } from "../../../models/message.model";
import { User } from "../../../models/user.model";
import { Organization } from "../../../models/organization.model";
import { sequelize } from "../../../config/database";
import { Op } from "sequelize";

export const sendMessage = async (req: Request, h: ResponseToolkit) => {
  try {
    const { recipientId, body, projectId } = req.payload as any;
    const authUser = (req as any).app?.authUser;
    
    if (!authUser || !authUser.tenant) {
      return h.response({ success: false, message: 'Invalid token' }).code(401);
    }

    // Validate recipient exists and belongs to the same organization
    const recipient = await User.findOne({ 
      where: { 
        id: recipientId,
        tenant_id: authUser.tenant 
      } 
    } as any);

    if (!recipient) {
      return h.response({ 
        success: false, 
        message: 'Recipient not found or access denied' 
      }).code(404);
    }

    // Create the message
    const message = await Message.create({
      tenant_id: authUser.tenant,
      project_id: projectId || null,
      from_user: authUser.id,
      body,
      recipient_id: recipientId
    } as any);

    // Get sender details
    const sender = await User.findByPk(authUser.id);

    const messageData = {
      id: message.id,
      body: message.body,
      project_id: message.project_id,
      from_user: {
        id: sender?.id,
        email: sender?.email,
        display_name: (sender as any)?.display_name
      },
      recipient_id: recipientId,
      created_at: message.created_at
    };

    // Emit to Socket.IO (this will be handled by the chat service)
    const chatService = (req.server as any).chatService;
    if (chatService) {
      chatService.emitToUser(recipientId, 'new_message', messageData);
    }

    return h.response({
      success: true,
      message: 'Message sent successfully',
      data: messageData
    }).code(201);
  } catch (err: any) {
    console.error('Send message error:', err);
    return h.response({
      success: false,
      message: 'Failed to send message',
      error: err.message,
    }).code(500);
  }
};

export const getChatHistory = async (req: Request, h: ResponseToolkit) => {
  try {
    const { recipientId, projectId, limit = 50, offset = 0 } = req.query as any;
    const authUser = (req as any).app?.authUser;
    
    if (!authUser || !authUser.tenant) {
      return h.response({ success: false, message: 'Invalid token' }).code(401);
    }

    // Validate recipient exists and belongs to the same organization
    const recipient = await User.findOne({ 
      where: { 
        id: recipientId,
        tenant_id: authUser.tenant 
      } 
    } as any);

    if (!recipient) {
      return h.response({ 
        success: false, 
        message: 'Recipient not found or access denied' 
      }).code(404);
    }

    // Get chat history between the two users
    const messages = await Message.findAll({
      where: {
        tenant_id: authUser.tenant,
        project_id: projectId || null,
        [Op.or]: [
          {
            from_user: authUser.id,
            recipient_id: recipientId
          },
          {
            from_user: recipientId,
            recipient_id: authUser.id
          }
        ]
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    } as any);

    // Get sender details for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await User.findByPk(message.from_user);
        return {
          id: message.id,
          body: message.body,
          project_id: message.project_id,
          from_user: {
            id: sender?.id,
            email: sender?.email,
            display_name: (sender as any)?.display_name
          },
          recipient_id: message.recipient_id,
          created_at: message.created_at
        };
      })
    );

    return h.response({
      success: true,
      message: 'Chat history retrieved successfully',
      data: messagesWithSenders.reverse() // Return in chronological order
    }).code(200);
  } catch (err: any) {
    console.error('Get chat history error:', err);
    return h.response({
      success: false,
      message: 'Failed to retrieve chat history',
      error: err.message,
    }).code(500);
  }
};

export const getOnlineUsers = async (req: Request, h: ResponseToolkit) => {
  try {
    const authUser = (req as any).app?.authUser;
    
    if (!authUser || !authUser.tenant) {
      return h.response({ success: false, message: 'Invalid token' }).code(401);
    }

    // Get all users in the same organization
    const users = await User.findAll({
      where: { tenant_id: authUser.tenant },
      attributes: ['id', 'email', 'display_name'],
      order: [['display_name', 'ASC']]
    } as any);

    // Get online status from chat service
    const chatService = (req.server as any).chatService;
    const onlineUsers = chatService ? chatService.getOnlineUsers() : [];

    const usersWithStatus = users.map(user => ({
      id: user.id,
      email: user.email,
      display_name: (user as any).display_name,
      online: onlineUsers.includes(user.id)
    }));

    return h.response({
      success: true,
      message: 'Online users retrieved successfully',
      data: usersWithStatus
    }).code(200);
  } catch (err: any) {
    console.error('Get online users error:', err);
    return h.response({
      success: false,
      message: 'Failed to retrieve online users',
      error: err.message,
    }).code(500);
  }
}; 