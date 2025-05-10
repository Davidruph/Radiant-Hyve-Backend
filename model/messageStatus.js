module.exports = (sequelize, DataTypes) => {
    const MessageStatus = sequelize.define(
        'MessageStatus',
        {
            message_by: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            message_to: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            chat_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_chat',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            message_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'tbl_message',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            school_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            message_status: {
                type: DataTypes.ENUM('read', 'unread'),
                defaultValue: 'unread',
                allowNull: false,
            },
            read_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                allowNull: true,
            },
        }, {
        tableName: 'tbl_message_status',
        timestamps: true
    });
    return MessageStatus;
};