module.exports = (sequelize, DataTypes) => {
    const Event = sequelize.define(
        'Event',
        {
            event_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            event_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            start_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            end_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            about_event: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            color_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            is_all: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            is_parent: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            is_teacher: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            is_principal: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
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
        },
        {
            tableName: "tbl_event",
            timestamps: true
        }
    )
    return Event;
};

