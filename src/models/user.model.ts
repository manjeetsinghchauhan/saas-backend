import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class User extends Model {
  public id!: string;
  public email!: string;
  public display_name?: string;
  public password_hash?: string;
  public tenant_id?: string;
  public role_id?: number;
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    display_name: { type: DataTypes.STRING },
    password_hash: { type: DataTypes.STRING },
    tenant_id: { type: DataTypes.UUID, allowNull: true },
    role_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, tableName: "users", timestamps: true, createdAt: "created_at", updatedAt: false }
);
