import { PermissionMatrix } from "../../../models/permissionMatrix.model";
import { Role } from "../../../models/role.model";

/**
 * RBAC middleware
 * Usage in routes: { pre: [ { method: requirePermission('project') } ] }
 * Maps HTTP method → permission: GET→view, POST→add, PUT/PATCH→edit, DELETE→delete
 */
export function requirePermission(moduleName: 'organisation' | 'project' | 'user') {
  return async function (request: any, h: any) {
    const authUser = request.app?.authUser;
    if (!authUser || !authUser.role) {
      return h.response({ error: 'not authenticated' }).code(401).takeover();
    }

    const method = String(request.method || '').toUpperCase();
    let permissionKey: 'view' | 'add' | 'edit' | 'delete';
    switch (method) {
      case 'GET':
        permissionKey = 'view';
        break;
      case 'POST':
        permissionKey = 'add';
        break;
      case 'PUT':
      case 'PATCH':
        permissionKey = 'edit';
        break;
      case 'DELETE':
        permissionKey = 'delete';
        break;
      default:
        permissionKey = 'view';
    }

    const role = await Role.findOne({ where: { name: authUser.role } });
    if (!role) {
      return h.response({ error: 'access forbidden' }).code(403).takeover();
    }

    const row = await PermissionMatrix.findOne({ where: { role_id: (role as any).id, module: moduleName } });
    if (!row) {
      return h.response({ error: 'access forbidden' }).code(403).takeover();
    }

    const allowed = Boolean((row as any)[permissionKey]);
    if (!allowed) {
      return h.response({ error: 'access forbidden' }).code(403).takeover();
    }

    return h.continue;
  };
}
