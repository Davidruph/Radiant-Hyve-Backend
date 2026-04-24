const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const RouteStop = sequelize.define(
    "RouteStop",
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
      stop_sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Order of stop in the route (1, 2, 3...)"
      },
      stop_name: {
        type: DataTypes.STRING,
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
      address: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      stop_type: {
        type: DataTypes.ENUM("pickup", "dropoff"),
        allowNull: false
      },
      scheduled_arrival_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      actual_arrival_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM("pending", "in_progress", "completed", "skipped"),
        defaultValue: "pending"
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      timestamps: true,
      underscored: true,
      tableName: "tbl_route_stops"
    }
  );

  return RouteStop;
};
