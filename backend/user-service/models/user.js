const { DataTypes } = require('sequelize');
const argon2 = require('argon2');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await argon2.hash(user.password);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await argon2.hash(user.password);
        }
      },
    },
  });

  return User;
};
