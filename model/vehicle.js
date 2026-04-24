const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Vehicle = sequelize.define(
    "Vehicle",
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
      vehicle_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      registration_plate: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      vehicle_type: {
        type: DataTypes.ENUM("bus", "van", "car"),
        defaultValue: "bus"
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Maximum number of students"
      },
      driver_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id"
        },
        comment: "Currently assigned driver"
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true
      },
      year_of_manufacture: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      insurance_expiry: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM("active", "inactive", "maintenance"),
        defaultValue: "active"
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      timestamps: true,
      underscored: true,
      tableName: "tbl_vehicles"
    }
  );

  return Vehicle;
};
