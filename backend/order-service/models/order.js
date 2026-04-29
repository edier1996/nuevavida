const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    products: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'pending',
    },
    shippingAddress: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    trackingNumber: {
      type: DataTypes.STRING,
    },
    estimatedDelivery: {
      type: DataTypes.DATE,
    },
    shippingCost: {
      type: DataTypes.DECIMAL(10, 2),
    },
  }, {
    tableName: 'orders',
    timestamps: true,
  })

  return Order
}
