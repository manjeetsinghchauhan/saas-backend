import { Request, ResponseToolkit } from '@hapi/hapi';
import UserProject from '../../../models/userProject.model';
import { User } from '../../../models/user.model';
import Project from '../../../models/project.model';
import { Organization } from '../../../models/organization.model';

export const assignUserToProject = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId, projectId } = req.payload as any;
    const authUser = (req as any).app?.authUser;
    
    if (!authUser || !authUser.tenant) {
      return h.response({ success: false, message: 'Invalid token' }).code(401);
    }

    // Validate that both user and project exist and belong to the same organization
    const user = await User.findOne({ 
      where: { 
        id: userId,
        tenant_id: authUser.tenant 
      } 
    } as any);

    if (!user) {
      return h.response({ 
        success: false, 
        message: 'User not found or access denied' 
      }).code(404);
    }

    const project = await Project.findOne({ 
      where: { 
        id: projectId,
        tenant_id: authUser.tenant 
      } 
    } as any);

    if (!project) {
      return h.response({ 
        success: false, 
        message: 'Project not found or access denied' 
      }).code(404);
    }

    // Check if assignment already exists
    const existingAssignment = await UserProject.findOne({
      where: {
        user_id: userId,
        project_id: projectId,
        tenant_id: authUser.tenant
      }
    });

    if (existingAssignment) {
      return h.response({ 
        success: false, 
        message: 'User is already assigned to this project' 
      }).code(409);
    }

    // Create the assignment
    const assignment = await UserProject.create({
      user_id: userId,
      project_id: projectId,
      tenant_id: authUser.tenant
    });

    return h.response({
      success: true,
      message: 'User assigned to project successfully',
      data: assignment,
    }).code(201);
  } catch (err: any) {
    console.error('Assignment error:', err);
    return h.response({
      success: false,
      message: 'Failed to assign user to project',
      error: err.message,
    }).code(500);
  }
};

export const removeUserFromProject = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId, projectId } = req.payload as any;
    const authUser = (req as any).app?.authUser;
    
    if (!authUser || !authUser.tenant) {
      return h.response({ success: false, message: 'Invalid token' }).code(401);
    }

    // Find and delete the assignment
    const assignment = await UserProject.findOne({
      where: {
        user_id: userId,
        project_id: projectId,
        tenant_id: authUser.tenant
      }
    });

    if (!assignment) {
      return h.response({ 
        success: false, 
        message: 'User is not assigned to this project' 
      }).code(404);
    }

    await assignment.destroy();

    return h.response({
      success: true,
      message: 'User removed from project successfully',
    }).code(200);
  } catch (err: any) {
    console.error('Removal error:', err);
    return h.response({
      success: false,
      message: 'Failed to remove user from project',
      error: err.message,
    }).code(500);
  }
};

export const listProjectMembers = async (req: Request, h: ResponseToolkit) => {
  try {
    const { projectId } = req.params as any;
    const authUser = (req as any).app?.authUser;
    
    if (!authUser || !authUser.tenant) {
      return h.response({ success: false, message: 'Invalid token' }).code(401);
    }

    // Validate that the project belongs to the user's organization
    const project = await Project.findOne({ 
      where: { 
        id: projectId,
        tenant_id: authUser.tenant 
      } 
    } as any);

    if (!project) {
      return h.response({ 
        success: false, 
        message: 'Project not found or access denied' 
      }).code(404);
    }

    // Get all users assigned to this project
    const assignments = await UserProject.findAll({
      where: {
        project_id: projectId,
        tenant_id: authUser.tenant
      }
    });

    // Get user details for each assignment
    const members = [];
    for (const assignment of assignments) {
      const user = await User.findOne({
        where: { id: assignment.user_id },
        attributes: ['id', 'email', 'display_name', 'role_id']
      } as any);
      
      if (user) {
        members.push({
          id: assignment.id,
          user_id: assignment.user_id,
          project_id: assignment.project_id,
          user: user.toJSON()
        });
      }
    }

    return h.response({
      success: true,
      message: 'Project members retrieved successfully',
      data: members
    }).code(200);
  } catch (err: any) {
    console.error('List members error:', err);
    return h.response({
      success: false,
      message: 'Failed to retrieve project members',
      error: err.message,
    }).code(500);
  }
};

export const listUserProjects = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.params as any;
    const authUser = (req as any).app?.authUser;
    
    if (!authUser || !authUser.tenant) {
      return h.response({ success: false, message: 'Invalid token' }).code(401);
    }

    // Validate that the requested user belongs to the same organization
    const user = await User.findOne({ 
      where: { 
        id: userId,
        tenant_id: authUser.tenant 
      } 
    } as any);

    if (!user) {
      return h.response({ 
        success: false, 
        message: 'User not found or access denied' 
      }).code(404);
    }

    // Get all projects assigned to this user
    const assignments = await UserProject.findAll({
      where: {
        user_id: userId,
        tenant_id: authUser.tenant
      }
    });

    // Get project details for each assignment
    const projects = [];
    for (const assignment of assignments) {
      const project = await Project.findOne({
        where: { id: assignment.project_id },
        attributes: ['id', 'name', 'created_at']
      } as any);
      
      if (project) {
        projects.push({
          id: assignment.id,
          user_id: assignment.user_id,
          project_id: assignment.project_id,
          project: project.toJSON()
        });
      }
    }

    return h.response({
      success: true,
      message: 'User projects retrieved successfully',
      data: projects
    }).code(200);
  } catch (err: any) {
    console.error('List user projects error:', err);
    return h.response({
      success: false,
      message: 'Failed to retrieve user projects',
      error: err.message,
    }).code(500);
  }
}; 