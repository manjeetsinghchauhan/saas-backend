import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class Project extends Model {
  public id!: number;
  public name!: string;
  public tenant_id!: string;
  public created_by!: string;
}

Project.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    created_by: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, tableName: 'projects' }
);

export default Project; 