const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'usd',
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending',
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'payments',
    timestamps: true,
  })

  return Payment
}
