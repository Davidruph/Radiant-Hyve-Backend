module.exports = (sequelize, DataTypes) => {
  const Feature = sequelize.define(
    "Feature",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tbl_subscription_plans",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      feature_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      }
    },
    {
      tableName: "tbl_features",
      timestamps: true,
      updatedAt: false
    }
  );

  Feature.associate = (models) => {
    Feature.belongsTo(models.SubscriptionPlan, {
      foreignKey: "plan_id",
      as: "Plan"
    });
  };

  return Feature;
};
