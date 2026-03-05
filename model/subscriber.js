module.exports = (sequelize, DataTypes) => {
  const Subscriber = sequelize.define(
    "Subscriber",
    {
      subscription_id: {
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
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tbl_user",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM("active", "expired", "cancelled"),
        defaultValue: "active"
      }
    },
    {
      tableName: "tbl_subscribers",
      timestamps: true,
      updatedAt: false
    }
  );

  return Subscriber;
};
