// src/models/TicketComment.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/database';

interface TicketCommentAttributes {
  id: number;
  ticket_id: number;
  user_id: number;
  content: string;
  attachments?: any[];
  created_at?: Date;
  updated_at?: Date;
}

interface TicketCommentCreationAttributes extends Optional<TicketCommentAttributes, 'id' | 'attachments' | 'created_at' | 'updated_at'> {}

class TicketComment extends Model<TicketCommentAttributes, TicketCommentCreationAttributes> implements TicketCommentAttributes {
  public id!: number;
  public ticket_id!: number;
  public user_id!: number;
  public content!: string;
  public attachments?: any[];
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

TicketComment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tickets',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'ticket_comments',
    sequelize,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['ticket_id'],
      },
      {
        fields: ['user_id'],
      },
    ],
  }
);

export default TicketComment;