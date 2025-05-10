module.exports = (sequelize, DataTypes) => {
    const StudentAttendance = sequelize.define(
        'StudentAttendance',
        {
            date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            present_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            out_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            is_out: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            attendance_status: {
                type: DataTypes.ENUM('present', 'absent'),
                defaultValue: 'present ',
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
            teacher_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            parent_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
        },
        {
            tableName: "tbl_student_attendance",
            timestamps: true
        }
    )
    return StudentAttendance;
};

