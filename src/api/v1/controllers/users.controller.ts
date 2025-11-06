import { Request, ResponseToolkit } from '@hapi/hapi';
import { User } from '../../../models/user.model';
import { PermissionMatrix } from '../../../models/permissionMatrix.model';
import { Role } from '../../../models/role.model';

export const listUsersInOrg = async (req: Request, h: ResponseToolkit) => {
  try {
    const authUser = (req as any).app?.authUser;
    if (!authUser || !authUser.tenant) {
      return h.response({ success: false, message: 'Invalid token' }).code(401);
    }
    const users = await User.findAll({ where: { tenant_id: authUser.tenant }, attributes: ['id', 'email', 'display_name', 'role_id', 'tenant_id'] } as any);
    return h.response({ success: true, data: users }).code(200);
  } catch (err: any) {
    return h.response({ success: false, message: err.message || 'Failed to list users' }).code(500);
  }
};

export const getUserById = async (req: Request, h: ResponseToolkit) => {
  try {
    const { id } = req.params as any;
    const authUser = (req as any).app?.authUser;
    
    if (!authUser || !authUser.tenant) {
      return h.response({ success: false, message: 'Invalid token' }).code(401);
    }

    const user = await User.findOne({ 
      where: { 
        id: id,
        tenant_id: authUser.tenant 
      },
      attributes: ['id', 'email', 'display_name', 'role_id', 'tenant_id', 'created_at']
    } as any);

    if (!user) {
      return h.response({ 
        success: false, 
        message: 'User not found or access denied' 
      }).code(404);
    }

    return h.response({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    }).code(200);
  } catch (err: any) {
    return h.response({
      success: false,
      message: 'Failed to retrieve user',
      error: err.message,
    }).code(500);
  }
}; 

export const getUserPermissions = async (req: Request, h: ResponseToolkit) => {
  try {
    const authUser = (req as any).app?.authUser;

    if (!authUser || !authUser.roleId) {
      return h.response({ success: false, message: 'Invalid token' }).code(401);
    }

    // Get the user details
    const user = await User.findOne({
      where: {
        id: authUser.id,
        tenant_id: authUser.tenant
      },
      attributes: ['id', 'email', 'display_name', 'role_id', 'tenant_id']
    } as any);

    if (!user) {
      return h.response({
        success: false,
        message: 'User not found or access denied'
      }).code(404);
    }

    // Get the user's role
    const role = await Role.findByPk(authUser.roleId);
    if (!role) {
      return h.response({
        success: false,
        message: 'Role not found'
      }).code(404);
    }

    // Get all permissions for the role
    const permissions = await PermissionMatrix.findAll({
      where: { role_id: authUser.roleId }
    });

    const userData = user.toJSON() as any;

    return h.response({
      success: true,
      message: 'User permissions retrieved successfully',
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          display_name: userData.display_name,
          role_id: userData.role_id,
          tenant_id: userData.tenant_id
        },
        role: {
          id: role.id,
          name: role.name
        },
        permissions: permissions.map(permission => permission.toJSON())
      }
    }).code(200);
  } catch (err: any) {
    console.error('Get user permissions error:', err);
    return h.response({
      success: false,
      message: 'Failed to retrieve user permissions',
      error: err.message,
    }).code(500);
  }
}; 

export const getAllRoles = async (req: Request, h: ResponseToolkit) => {
  try {
    const roles = await Role.findAll({
      attributes: ['id', 'name'],
      order: [['id', 'ASC']]
    });

    return h.response({
      success: true,
      message: 'Roles retrieved successfully',
      data: roles
    }).code(200);
  } catch (err: any) {
    console.error('Get all roles error:', err);
    return h.response({
      success: false,
      message: 'Failed to retrieve roles',
      error: err.message,
    }).code(500);
  }
}; 