module.exports = (sequelize, DataTypes) => {
  const SubscriptionPlan = sequelize.define(
    "SubscriptionPlan",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      package_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      service_type: {
        type: DataTypes.ENUM("Monthly", "Yearly"),
        allowNull: false
      },
      service_fee: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: "tbl_subscription_plans",
      timestamps: true
    }
  );

  SubscriptionPlan.associate = (models) => {
    SubscriptionPlan.hasMany(models.Feature, {
      foreignKey: "plan_id",
      as: "Features"
    });
  };

  return SubscriptionPlan;
};
