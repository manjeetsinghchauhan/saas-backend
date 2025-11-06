import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Tenant extends Model {}

Tenant.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, unique: true, allowNull: false },
    domain: { type: DataTypes.STRING, unique: true, allowNull: false },
  },
  { sequelize, tableName: "tenants", timestamps: true, createdAt: "created_at", updatedAt: false }
);

export default Tenant;
