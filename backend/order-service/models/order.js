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
