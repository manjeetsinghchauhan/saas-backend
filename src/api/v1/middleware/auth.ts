import jwt from "jsonwebtoken";
import { Role } from "../../../models/role.model";
import { Organization } from "../../../models/organization.model";

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

/**
 * Hapi preHandler to verify JWT and attach user & membership info to request.app.authUser
 */
export async function requireAuth(request: any, h: any) {
  const authHeader = request.headers.authorization || request.headers.Authorization;
  if (!authHeader) {
    return h.response({ error: "missing authorization header" }).code(401).takeover();
  }

  const parts = (authHeader as string).split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return h.response({ error: "invalid authorization header" }).code(401).takeover();
  }

  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;

    if (!payload.roleId) {
      return h.response({ error: "Invalid token" }).code(401).takeover();
    }

    const role = await Role.findByPk(payload.roleId as number);
    if (!role) {
      return h.response({ error: "Invalid token" }).code(401).takeover();
    }

    if (!payload.tenant) {
      return h.response({ error: "Invalid token" }).code(401).takeover();
    }

    const org = await Organization.findByPk(payload.tenant as string);
    if (!org) {
      return h.response({ error: "Invalid token" }).code(401).takeover();
    }

    request.app.authUser = {
      id: payload.id,
      email: payload.email,
      tenant: payload.tenant,
      role: (role as any).name,
      roleId: payload.roleId,
    };

    return h.continue;
  } catch (err) {
    console.error("JWT verify err:", err);
    return h.response({ error: "invalid token" }).code(401).takeover();
  }
}
