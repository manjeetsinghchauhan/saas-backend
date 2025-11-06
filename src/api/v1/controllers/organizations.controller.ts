import { Request, ResponseToolkit } from '@hapi/hapi';
import { Organization } from '../../../models/organization.model';
import { User } from '../../../models/user.model';
import { Role } from '../../../models/role.model';
import { sequelize } from '../../../config/database';

export const createOrganization = async (req: Request, h: ResponseToolkit) => {
  try {
    const { name, ownerName, domain, region, timezone } = req.payload as any;
    const normalizedName = (name as string).trim();
    const normalizedDomain = (domain as string).trim().toLowerCase();

    // Check duplicates (case-insensitive) for name
    const existingByName = await Organization.findOne({
      where: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), normalizedName.toLowerCase()),
    });
    if (existingByName) {
      return h.response({ success: false, message: 'Organization name already exists' }).code(409);
    }

    // Check duplicates for domain
    const existingByDomain = await Organization.findOne({
      where: sequelize.where(sequelize.fn('LOWER', sequelize.col('domain')), normalizedDomain),
    });
    if (existingByDomain) {
      return h.response({ success: false, message: 'Organization domain already exists' }).code(409);
    }

    const tx = await sequelize.transaction();
    try {
      const org = (await Organization.create({ name: normalizedName, domain: normalizedDomain, region, timezone, owner_name: ownerName } as any, { transaction: tx } as any)) as any;

      await tx.commit();
      return h.response({ success: true, message: 'Organization created', data: { id: org.id, name: org.name, domain: org.domain, region: org.region, timezone: org.timezone, ownerName: org.owner_name } }).code(201);
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (err: any) {
    return h.response({ success: false, message: err.message || 'Failed to create organization' }).code(500);
  }
};

export const getOrganization = async (req: Request, h: ResponseToolkit) => {
  try {
    const authUser = (req as any).app?.authUser;
    if (!authUser || !authUser.tenant) {
      return h.response({ success: false, message: 'Invalid token' }).code(401);
    }

    const id = authUser.tenant as string;

    const org = (await Organization.findByPk(id)) as any;
    if (!org) return h.response({ success: false, message: 'Organization not found' }).code(404);

    return h.response({ success: true, data: { id: org.id, name: org.name, domain: org.domain, region: org.region, timezone: org.timezone, ownerName: org.owner_name } }).code(200);
  } catch (err: any) {
    return h.response({ success: false, message: err.message || 'Failed to fetch organization' }).code(500);
  }
}; 