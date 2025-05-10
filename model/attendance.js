module.exports = (sequelize, DataTypes) => {
    const Attendance = sequelize.define(
        'Attendance',
        {
            date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            clock_in_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            clock_out_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            is_clock_in: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: true,
            },
            role: {
                type: DataTypes.ENUM('principal', 'teacher'),
                allowNull: true, 
            },
            user_id: {
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
        },
        {
            tableName: "tbl_attendance",
            timestamps: true
        }
    )
    return Attendance;
};

