import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class PermissionMatrix extends Model {}

PermissionMatrix.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    module: { type: DataTypes.STRING, allowNull: false },
    view: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    add: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    edit: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    delete: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, tableName: "permission_matrix", timestamps: false }
);

export default PermissionMatrix; 