module.exports = (sequelize, DataTypes) => {
    const MedicationInfo = sequelize.define(
        'MedicationInfo',
        {
            type_disease: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            medication_details: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            doctor_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            iso_code: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            country_code: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            mobile_no: {
                type: DataTypes.BIGINT,
                allowNull: true,
            },
            admin_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            school_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            student_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_student',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
        },
        {
            tableName: "tbl_medication_info",
            timestamps: true
        }
    )
    return MedicationInfo;
};

