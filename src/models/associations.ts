// src/models/associations.ts
import User from './User';
import Ticket from './Ticket';
import TicketComment from './TicketComment';
import ChatMessage from './ChatMessage';
import Upload from './Upload';

export const setupAssociations = () => {
  // User associations
  User.hasMany(Ticket, { foreignKey: 'user_id', as: 'tickets' });
  User.hasMany(Ticket, { foreignKey: 'assigned_to', as: 'assignedTickets' });
  User.hasMany(TicketComment, { foreignKey: 'user_id', as: 'comments' });
  User.hasMany(ChatMessage, { foreignKey: 'user_id', as: 'messages' });
  User.hasMany(Upload, { foreignKey: 'user_id', as: 'uploads' });

  // Ticket associations
  Ticket.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Ticket.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
  Ticket.hasMany(TicketComment, { foreignKey: 'ticket_id', as: 'comments' });

  // TicketComment associations
  TicketComment.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });
  TicketComment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Добавьте ассоциации для ChatMessage и Upload, если необходимо
};