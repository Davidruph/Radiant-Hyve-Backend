module.exports = (sequelize, DataTypes) => {
    const Attendance = sequelize.define(
        'Attendance',
        {
            date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            clock_in_time: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            clock_out_time: {
                type: DataTypes.DATE,
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
            clock_in_address: {
                type: DataTypes.STRING,
                allowNull: true
            },
            clock_in_latitude: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            clock_in_longitude: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            clock_out_address: {
                type: DataTypes.STRING,
                allowNull: true
            },
            clock_out_latitude: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            clock_out_longitude: {
                type: DataTypes.STRING,
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

