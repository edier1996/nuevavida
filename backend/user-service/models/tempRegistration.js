const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('TempRegistration', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    verificationCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    verificationCodeExpiry: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'temp_registrations',
    timestamps: true,
  });
};
