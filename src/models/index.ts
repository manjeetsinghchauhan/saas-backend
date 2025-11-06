import { sequelize } from "../config/database";
import { Organization } from "./organization.model";
import { Role } from "./role.model";
import { User } from "./user.model";
import Project from "./project.model";
import { Message } from "./message.model";
import { PermissionMatrix } from "./permissionMatrix.model";
import UserProject from "./userProject.model";

// Associations
// OrganizationMember removed

User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id' });

User.belongsTo(Organization, { foreignKey: 'tenant_id', as: 'organization' });
Organization.hasMany(User, { foreignKey: 'tenant_id' });

Project.belongsTo(Organization, { foreignKey: "tenant_id" });
Project.belongsTo(User, { foreignKey: "created_by" });

// User-Project many-to-many relationship through UserProject
User.belongsToMany(Project, { 
  through: UserProject, 
  foreignKey: 'user_id',
  otherKey: 'project_id',
  as: 'projects'
});

Project.belongsToMany(User, { 
  through: UserProject, 
  foreignKey: 'project_id',
  otherKey: 'user_id',
  as: 'members'
});

// UserProject associations
UserProject.belongsTo(User, { foreignKey: 'user_id' });
UserProject.belongsTo(Project, { foreignKey: 'project_id' });
UserProject.belongsTo(Organization, { foreignKey: 'tenant_id' });

Message.belongsTo(Organization, { foreignKey: "tenant_id" });
Message.belongsTo(Project, { foreignKey: "project_id", targetKey: 'id' });
Message.belongsTo(User, { foreignKey: "from_user", as: 'sender' });
Message.belongsTo(User, { foreignKey: "recipient_id", as: 'recipient' });
User.hasMany(Message, { foreignKey: "from_user", as: 'sentMessages' });
User.hasMany(Message, { foreignKey: "recipient_id", as: 'receivedMessages' });

PermissionMatrix.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasOne(PermissionMatrix, { foreignKey: 'role_id', as: 'permissionMatrix' });

export {
  sequelize,
  Organization,
  Role,
  User,
  Project,
  Message,
  PermissionMatrix,
  UserProject,
};
