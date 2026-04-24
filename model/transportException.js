const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TransportException = sequelize.define(
    "TransportException",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      route_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "routes",
          key: "id"
        }
      },
      student_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "students",
          key: "id"
        }
      },
      exception_type: {
        type: DataTypes.ENUM(
          "student_absent",
          "student_skipped",
          "no_authorized_recipient",
          "route_delayed",
          "driver_replaced",
          "connectivity_loss",
          "student_not_accounted_for",
          "other"
        ),
        allowNull: false
      },
      severity: {
        type: DataTypes.ENUM("low", "medium", "high", "critical"),
        defaultValue: "medium"
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM("open", "acknowledged", "resolved"),
        defaultValue: "open"
      },
      resolved_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id"
        },
        comment: "Admin who resolved the exception"
      },
      resolution_notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      timestamps: true,
      underscored: true,
      tableName: "tbl_transport_exceptions"
    }
  );

  return TransportException;
};
