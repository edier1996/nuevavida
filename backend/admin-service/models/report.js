const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reportedUserId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reporterUserId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'resolved'),
      allowNull: false,
      defaultValue: 'pending',
    },
    action: {
      type: DataTypes.ENUM('none', 'warning', 'suspend', 'ban'),
      allowNull: false,
      defaultValue: 'none',
    },
  }, {
    tableName: 'reports',
    timestamps: true,
  })

  return Report
}
