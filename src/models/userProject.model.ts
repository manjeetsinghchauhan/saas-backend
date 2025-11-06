import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

class UserProject extends Model {
  public id!: number;
  public user_id!: string;
  public project_id!: number;
  public tenant_id!: string;
}

UserProject.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { 
      type: DataTypes.UUID, 
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    project_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    tenant_id: { 
      type: DataTypes.UUID, 
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'id'
      }
    }
  },
  { 
    sequelize, 
    tableName: 'user_projects',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'project_id', 'tenant_id']
      }
    ]
  }
);

export default UserProject; 