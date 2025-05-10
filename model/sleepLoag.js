module.exports = (sequelize, DataTypes) => {
    const SleepLoag = sequelize.define(
        'SleepLoag',
        {
            start_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            end_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            student_name: {
                type: DataTypes.STRING,
                allowNull: true,
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
            admin_id: {
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
            tableName: "tbl_sleep_log",
            timestamps: true
        }
    )
    return SleepLoag;
};

