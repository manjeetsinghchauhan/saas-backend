import { sequelize, Role, PermissionMatrix, Organization, User, Project, Message, UserProject } from '../models';
import bcrypt from 'bcrypt';

async function ensureDatabase() {
  const { Client } = require('pg');
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

async function upsertRole(name: string) {
  const [role] = await Role.findOrCreate({
    where: { name },
    defaults: { name }
  });
  return role;
}

async function upsertOrganization(name: string, domain: string, region: string, timezone: string, ownerName: string) {
  const [org] = await Organization.findOrCreate({
    where: { name },
    defaults: { name, domain, region, timezone, owner_name: ownerName }
  });
  return org;
}

async function upsertUser(email: string, displayName: string, passwordHash: string, tenantId: string, roleId: number) {
  const [user] = await User.findOrCreate({
    where: { email },
    defaults: { 
      email, 
      display_name: displayName, 
      password_hash: passwordHash, 
      tenant_id: tenantId, 
      role_id: roleId 
    }
  });
  return user;
}

async function createPermissionMatrix(roleId: number, module: string, view: boolean, add: boolean, edit: boolean, canDelete: boolean) {
  await PermissionMatrix.create({
    role_id: roleId,
    module,
    view,
    add,
    edit,
    delete: canDelete
  });
}

async function seed() {
  try {
    await ensureDatabase();

    // Sync database
    await sequelize.sync({ force: true });
    console.log('Dropped all tables, now syncing...');

    // Create 3 roles
    const orgAdminRole = await upsertRole('org_admin');
    const projectAdminRole = await upsertRole('project_admin');
    const memberRole = await upsertRole('member');
    
    console.log('Roles created: org_admin, project_admin, member');

    // Create permission matrix for org_admin role
    await createPermissionMatrix(orgAdminRole.id, 'organisation', true, false, false, false);
    await createPermissionMatrix(orgAdminRole.id, 'project', true, true, true, true);
    await createPermissionMatrix(orgAdminRole.id, 'user', true, true, true, true);
    console.log('Permission matrix created for org_admin role');

    // Create permission matrix for project_admin role
    await createPermissionMatrix(projectAdminRole.id, 'organisation', true, false, false, false);
    await createPermissionMatrix(projectAdminRole.id, 'project', true, false, false, false);
    await createPermissionMatrix(projectAdminRole.id, 'user', true, true, true, true);
    console.log('Permission matrix created for project_admin role');

    // Create permission matrix for member role
    await createPermissionMatrix(memberRole.id, 'organisation', true, false, false, false);
    await createPermissionMatrix(memberRole.id, 'project', true, false, false, false);
    await createPermissionMatrix(memberRole.id, 'user', true, false, false, false);
    console.log('Permission matrix created for member role');

    // Create 5 organizations
    const organizations = [
      { name: 'Acme Alpha', domain: 'acme-alpha.com', region: 'North America', timezone: 'America/New_York', ownerName: 'Alice Alpha Admin' },
      { name: 'Beta Builders', domain: 'beta-builders.com', region: 'Europe', timezone: 'Europe/London', ownerName: 'Bob Beta Builder' },
      { name: 'Gamma Group', domain: 'gamma-group.com', region: 'Asia Pacific', timezone: 'Asia/Tokyo', ownerName: 'Carol Gamma Group' },
      { name: 'Delta Dynamics', domain: 'delta-dynamics.com', region: 'Australia', timezone: 'Australia/Sydney', ownerName: 'David Delta Dynamics' },
      { name: 'Epsilon Enterprises', domain: 'epsilon-enterprises.com', region: 'South America', timezone: 'America/Sao_Paulo', ownerName: 'Eve Epsilon Enterprise' }
    ];

    const createdOrgs = [];
    for (const orgData of organizations) {
      const org = await upsertOrganization(orgData.name, orgData.domain, orgData.region, orgData.timezone, orgData.ownerName);
      createdOrgs.push(org);
      console.log(`Organization created: ${org.name} (ID: ${org.id})`);
    }

    // Create 5 org_admin users with default password "123456"
    const adminUsers = [
      { email: 'admin1@acme-alpha.com', displayName: 'Alice Alpha Admin', orgName: 'Acme Alpha' },
      { email: 'admin2@beta-builders.com', displayName: 'Bob Beta Builder', orgName: 'Beta Builders' },
      { email: 'admin3@gamma-group.com', displayName: 'Carol Gamma Group', orgName: 'Gamma Group' },
      { email: 'admin4@delta-dynamics.com', displayName: 'David Delta Dynamics', orgName: 'Delta Dynamics' },
      { email: 'admin5@epsilon-enterprises.com', displayName: 'Eve Epsilon Enterprise', orgName: 'Epsilon Enterprises' }
    ];

    const defaultPassword = '123456';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    for (const userData of adminUsers) {
      const org = createdOrgs.find(org => org.name === userData.orgName);
      if (org) {
        const user = await upsertUser(userData.email, userData.displayName, passwordHash, org.id, orgAdminRole.id);
        console.log(`Admin user created: ${user.email} for organization: ${org.name}`);
      }
    }

    console.log('Seed complete');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed(); 