module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    "Transaction",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      subscription_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tbl_subscribers",
          key: "subscription_id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      payment_status: {
        type: DataTypes.ENUM("completed", "pending", "failed"),
        defaultValue: "completed"
      }
    },
    {
      tableName: "tbl_transactions",
      timestamps: true,
      updatedAt: false,
      createdAt: "payment_date"
    }
  );

  return Transaction;
};
