const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const DriverLocation = sequelize.define(
    "DriverLocation",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      route_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: "routes",
          key: "id"
        },
        comment: "One live location record per active route"
      },
      driver_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id"
        }
      },
      school_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id"
        }
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false
      },
      last_updated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      timestamps: false,
      underscored: true,
      tableName: "tbl_driver_locations"
    }
  );

  return DriverLocation;
};
