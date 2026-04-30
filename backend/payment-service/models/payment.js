const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const Commission = sequelize.define('Commission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
  }, {
    tableName: 'commissions',
    timestamps: true,
    updatedAt: false,
  })

  const Sponsorship = sequelize.define('Sponsorship', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sponsorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    sponsorName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('featured_listing', 'banner', 'category_sponsor'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Duration in days',
    },
    targetAudience: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'paused'),
      allowNull: false,
      defaultValue: 'active',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    conversionRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      defaultValue: 0,
    },
  }, {
    tableName: 'sponsorships',
    timestamps: true,
  })

  return { Commission, Sponsorship }
}
