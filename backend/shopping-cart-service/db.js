const { Sequelize } = require('sequelize')
const dotenv = require('dotenv')

dotenv.config()

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
})

const Cart = require('./models/cart')(sequelize)
const CartItem = require('./models/cartItem')(sequelize)

// Define associations
Cart.hasMany(CartItem, { foreignKey: 'cartId', onDelete: 'CASCADE' })
CartItem.belongsTo(Cart, { foreignKey: 'cartId' })

module.exports = { sequelize, Cart, CartItem }