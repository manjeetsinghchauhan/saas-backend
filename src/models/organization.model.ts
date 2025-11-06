import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Organization extends Model {
  public id!: string;
  public name!: string;
  public domain!: string;
  public region!: string;
  public timezone!: string;
  public owner_name!: string;
}

Organization.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, unique: true, allowNull: false },
    domain: { type: DataTypes.STRING, unique: true, allowNull: false },
    region: { type: DataTypes.STRING, allowNull: false, defaultValue: 'us-east-1' },
    timezone: { type: DataTypes.STRING, allowNull: false, defaultValue: 'UTC' },
    owner_name: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, tableName: "organizations", timestamps: true, createdAt: "created_at", updatedAt: false }
);
