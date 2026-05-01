const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const ProductRequest = sequelize.define('ProductRequest', {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
    },
    productId: {
      type: DataTypes.STRING(64),
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
      type: DataTypes.STRING(64),
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
      allowNull: false,
      defaultValue: 'pending',
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    scoreBreakdown: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    tableName: 'product_requests',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  })

  return ProductRequest
}
