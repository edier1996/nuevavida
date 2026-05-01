const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const DonationRequest = sequelize.define('DonationRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    requesterId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    requesterEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    requesterName: {
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
    productTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    productCity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    householdSize: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    needLevel: {
      type: DataTypes.ENUM('alta', 'media', 'baja'),
      allowNull: true,
      defaultValue: 'media',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    intendedUse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pickupWindow: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    extraNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    evidence: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    scoreBreakdown: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    donorId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'completed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'donation_requests',
    timestamps: true,
  })

  return DonationRequest
}
