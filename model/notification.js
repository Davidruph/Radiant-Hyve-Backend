module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define(
        'Notification',
        {
            notification_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            notification_to: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            notification_type: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            body: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            notification_status: {
                type: DataTypes.ENUM,
                values: ['Read', 'Unread'],
                defaultValue: 'Unread',
            },
            school_id: {
                type: DataTypes.INTEGER,
                allowNull: null,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
        },
        {
            tableName: "tbl_notification",
            timestamps: true
        }
    )
    return Notification;
};