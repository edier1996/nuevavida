const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Stored as JSON array of two strings: [requesterId, donorId]
    // Accepts any string format (UUID, "admin-1", "worker-1", timestamps, etc.)
    participantIds: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'conversations',
    timestamps: true,
  })

  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    senderId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    senderName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: 'messages',
    timestamps: true,
    updatedAt: false,
  })

  // Associations
  Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' })
  Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' })

  return { Conversation, Message }
}
