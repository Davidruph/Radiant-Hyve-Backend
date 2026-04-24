const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TransportLog = sequelize.define(
    "TransportLog",
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
        },
        comment: "Student involved in this log entry"
      },
      driver_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id"
        }
      },
      event_type: {
        type: DataTypes.ENUM(
          "route_started",
          "pickup_pending",
          "pickup_completed",
          "pickup_absent",
          "pickup_skipped",
          "dropoff_completed",
          "dropoff_exception",
          "final_check",
          "route_ended"
        ),
        allowNull: false,
        comment: "Type of event logged"
      },
      event_description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
      },
      additional_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Additional context like recipient name, reason for skip, etc."
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      timestamps: false,
      underscored: true,
      createdAt: "created_at",
      updatedAt: false,
      tableName: "tbl_transport_logs"
    }
  );

  return TransportLog;
};
