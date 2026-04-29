const { Sequelize } = require('sequelize')
const dotenv = require('dotenv')

dotenv.config()

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
})

const User = require('./models/user')(sequelize)

module.exports = { sequelize, User }