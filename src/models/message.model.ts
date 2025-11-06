import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Message extends Model {
  public id!: string;
  public tenant_id!: string;
  public project_id?: number;
  public from_user!: string;
  public recipient_id!: string;
  public body!: string;
  public created_at!: Date;
}

Message.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    project_id: { type: DataTypes.INTEGER, allowNull: true },
    from_user: { type: DataTypes.UUID, allowNull: false },
    recipient_id: { type: DataTypes.UUID, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, tableName: "messages", timestamps: true, createdAt: "created_at", updatedAt: false }
);
