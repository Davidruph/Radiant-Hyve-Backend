const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const DropOffRecipient = sequelize.define(
    "DropOffRecipient",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      student_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "students",
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
      recipient_type: {
        type: DataTypes.ENUM("parent", "authorized_person"),
        allowNull: false,
        comment: "Type of authorized recipient"
      },
      recipient_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      recipient_phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      relationship_to_student: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "e.g., Mother, Father, Guardian, Grandparent"
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Primary recipient for this student"
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      timestamps: true,
      underscored: true,
      tableName: "tbl_drop_off_recipients"
    }
  );

  return DropOffRecipient;
};
