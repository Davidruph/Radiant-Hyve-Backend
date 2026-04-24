const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Route = sequelize.define(
    "Route",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      school_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id"
        }
      },
      vehicle_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "vehicles",
          key: "id"
        }
      },
      driver_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id"
        },
        comment: "Driver assigned to this route"
      },
      route_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      route_type: {
        type: DataTypes.ENUM("pickup", "dropoff", "round_trip"),
        defaultValue: "round_trip"
      },
      status: {
        type: DataTypes.ENUM("scheduled", "active", "completed", "cancelled"),
        defaultValue: "scheduled",
        comment: "Route lifecycle status"
      },
      scheduled_start_time: {
        type: DataTypes.DATE,
        allowNull: false
      },
      actual_start_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "When driver actually started the route"
      },
      scheduled_end_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      actual_end_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "When route was completed"
      },
      final_vehicle_check_confirmed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment:
          "Driver confirmed vehicle physically checked and no students remain"
      },
      final_check_timestamp: {
        type: DataTypes.DATE,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
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
      tableName: "tbl_routes"
    }
  );

  return Route;
};
