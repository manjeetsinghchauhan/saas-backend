import { Request, ResponseToolkit } from "@hapi/hapi";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../../../models/user.model";
import { Organization } from "../../../models/organization.model";
import { Role } from "../../../models/role.model";
import { t } from "../../../config/i18n";
import { registerSchema, loginSchema } from "../validators/schemas/auth.schemas";

export const register = async (req: Request, h: ResponseToolkit) => {
  const lang = (req.headers["accept-language"] as string) || "en";
  
  try {
    const { error } = registerSchema.validate(req.payload);
    if (error) {
      return h.response({ message: error.details[0].message }).code(400);
    }

    // Extract Bearer token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return h.response({ message: 'Bearer token required', error: 'MISSING_TOKEN' }).code(401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // Verify and decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
      
      if (!decoded.tenant) {
        return h.response({ message: 'Invalid token - no organization found', error: 'INVALID_TOKEN' }).code(401);
      }

      const { email, password, name, roleId } = req.payload as any;

      // Check if user exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return h.response({ message: t("auth.user_already_exists", lang), error: "USER_ALREADY_EXISTS" }).code(409);
      }

      // Validate organization from JWT tenant
      const org = await Organization.findByPk(decoded.tenant);
      if (!org) {
        return h.response({ message: 'Organization not found', error: 'ORG_NOT_FOUND' }).code(400);
      }

      // Validate role
      const role = await Role.findByPk(roleId);
      if (!role) {
        return h.response({ message: 'Role not found', error: 'ROLE_NOT_FOUND' }).code(400);
      }

      const hashed = await bcrypt.hash(password, 10);

      await User.create({
        email,
        password_hash: hashed,
        display_name: name,
        tenant_id: decoded.tenant,
        role_id: roleId,
      } as any);

      return h.response({ message: t("auth.register_success", lang) }).code(201);
    } catch (jwtError) {
      return h.response({ message: 'Invalid or expired token', error: 'INVALID_TOKEN' }).code(401);
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    return h.response({ message: t("auth.registration_failed", lang), error: "INTERNAL_ERROR" }).code(500);
  }
};

export const login = async (req: Request, h: ResponseToolkit) => {
  const lang = (req.headers["accept-language"] as string) || "en";
  
  try {
    const { error } = loginSchema.validate(req.payload);
    if (error) {
      return h.response({ message: error.details[0].message }).code(400);
    }

    const { email, password } = req.payload as any;
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return h.response({ message: t("auth.invalid_credentials", lang) }).code(401);
    }

    const match = await bcrypt.compare(password, (user as any).password_hash);
    if (!match) {
      return h.response({ message: t("auth.invalid_credentials", lang) }).code(401);
    }

    const token = jwt.sign({ 
      id: (user as any).id, 
      email, 
      tenant: (user as any).tenant_id, 
      roleId: (user as any).role_id 
    }, process.env.JWT_SECRET || "secret", { expiresIn: "1h" });

    // Get role and organization data separately to avoid association issues
    const role = await Role.findByPk((user as any).role_id);
    const organization = await Organization.findByPk((user as any).tenant_id);

    // Extract user data for response
    const userData = {
      id: (user as any).id,
      email: (user as any).email,
      display_name: (user as any).display_name,
      role_id: (user as any).role_id,
      tenant_id: (user as any).tenant_id,
      created_at: (user as any).created_at,
      role: role ? {
        id: role.id,
        name: role.name
      } : null,
      organization: organization ? {
        id: organization.id,
        name: organization.name,
        domain: organization.domain,
        region: organization.region,
        timezone: organization.timezone
      } : null
    };

    return h.response({
      message: t("auth.login_success", lang),
      token,
      user: userData
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return h.response({ 
      message: t("auth.login_failed", lang),
      error: "INTERNAL_ERROR"
    }).code(500);
  }
};
