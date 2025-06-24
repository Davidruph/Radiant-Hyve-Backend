module.exports = (sequelize, DataTypes) => {
    const Leave = sequelize.define(
        'Leave',
        {
            leave_type: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            reason: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            leave_request_status: {
                type: DataTypes.ENUM( 'pending','accepted', 'rejected'),
                defaultValue: 'pending',
                allowNull: false,
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
            tableName: "tbl_leave",
            timestamps: true
        }
    )
    return Leave;
};

