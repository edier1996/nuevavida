const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'system',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    actionUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    externalKey: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    tableName: 'notifications',
    timestamps: true,
    updatedAt: false,
  });

  return Notification;
};