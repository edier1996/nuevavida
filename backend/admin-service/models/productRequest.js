const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductRequest = sequelize.define('ProductRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productTitle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productCity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    requesterId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    requesterName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    requesterEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    requesterPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    requesterCity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    householdSize: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    needLevel: {
      type: DataTypes.ENUM('alta', 'media', 'baja'),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    intendedUse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pickupWindow: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    extraNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    evidence: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_review', 'selected', 'rejected', 'delivered'),
      defaultValue: 'pending',
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    scoreBreakdown: {
      type: DataTypes.JSON,
      defaultValue: {
        firstTime: 0,
        need: 0,
        repeatPenalty: 0,
        proximity: 0,
        household: 0,
      },
      allowNull: false,
    },
  }, {
    tableName: 'product_requests',
    timestamps: true,
  });

  return ProductRequest;
};
