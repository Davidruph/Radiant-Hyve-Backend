const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const StudentTransport = sequelize.define(
    "StudentTransport",
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
        allowNull: false,
        references: {
          model: "students",
          key: "id"
        }
      },
      route_stop_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "route_stops",
          key: "id"
        },
        comment: "The stop where student should be picked up"
      },
      pickup_status: {
        type: DataTypes.ENUM(
          "pending_pickup",
          "picked_up",
          "absent",
          "skipped"
        ),
        defaultValue: "pending_pickup",
        comment: "Current pickup status in the sequence"
      },
      pickup_timestamp: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "When student was actually picked up"
      },
      pickup_latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
      },
      pickup_longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
      },
      skip_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Reason if student was skipped"
      },
      current_status: {
        type: DataTypes.ENUM(
          "pending",
          "in_vehicle",
          "dropped_off",
          "exception"
        ),
        defaultValue: "pending",
        comment: "Current location/status in transport journey"
      },
      dropoff_status: {
        type: DataTypes.ENUM("pending", "completed", "exception"),
        defaultValue: "pending",
        comment: "Status of drop-off process"
      },
      dropoff_timestamp: {
        type: DataTypes.DATE,
        allowNull: true
      },
      dropoff_latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
      },
      dropoff_longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
      },
      sequence_position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Position in pickup/dropoff sequence for this route"
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      timestamps: true,
      underscored: true,
      tableName: "tbl_student_transports"
    }
  );

  return StudentTransport;
};
