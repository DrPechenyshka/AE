// models/ChatMessage.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/lib/database';

interface ChatMessageAttributes {
  id: number;
  user_id?: number;
  content: string;
  role: 'user' | 'assistant';
  attachments?: any[];
  created_at?: Date;
  updated_at?: Date;
}

interface ChatMessageCreationAttributes extends Optional<ChatMessageAttributes, 'id' | 'attachments' | 'created_at' | 'updated_at'> {}

class ChatMessage extends Model<ChatMessageAttributes, ChatMessageCreationAttributes> implements ChatMessageAttributes {
  public id!: number;
  public user_id?: number;
  public content!: string;
  public role!: 'user' | 'assistant';
  public attachments?: any[];
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'assistant'),
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
    tableName: 'chat_messages',
    sequelize,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ChatMessage;