const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const Cart = sequelize.define('Cart', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  }, {
    tableName: 'carts',
    timestamps: true,
  })

  return Cart
}
