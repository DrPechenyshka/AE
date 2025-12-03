// models/Upload.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/database';

interface UploadAttributes {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  user_id?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UploadCreationAttributes extends Optional<UploadAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Upload extends Model<UploadAttributes, UploadCreationAttributes> implements UploadAttributes {
  public id!: number;
  public filename!: string;
  public original_name!: string;
  public mime_type!: string;
  public size!: number;
  public path!: string;
  public user_id?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Upload.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'createdAt',
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updatedAt',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'uploads',
    sequelize,
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  }
);

export default Upload;