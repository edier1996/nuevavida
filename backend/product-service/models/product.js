const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    isGift: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    condition: {
      type: DataTypes.ENUM('nuevo', 'bueno', 'regular'),
      allowNull: false,
      defaultValue: 'bueno',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    images: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    sellerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sellerEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sellerName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Usuario',
    },
    sellerAvatar: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'sold', 'archived'),
      allowNull: false,
      defaultValue: 'active',
    },
    donationStatus: {
      type: DataTypes.ENUM('disponible', 'en_proceso', 'entregado'),
      allowNull: false,
      defaultValue: 'disponible',
    },
    sold: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    commission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: 'products',
    timestamps: true,
  })

  return Product
}
