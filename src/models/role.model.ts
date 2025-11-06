import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Role extends Model {
  public id!: number;
  public name!: string;
}

Role.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, unique: true, allowNull: false },
  },
  { sequelize, tableName: "roles", timestamps: false }
);
