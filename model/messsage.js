module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define(
        'Message',
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
                allowNull: true,
                defaultValue: null,
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
                defaultValue: null,
                references: {
                    model: 'tbl_chat',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            school_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: null,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            message_type:{
                type:DataTypes.ENUM('Text','Image','Video','Document','Audio','Video/Text','Image/Text'),
                defaultValue:'Text',
            },
            message_status:{
                type:DataTypes.ENUM("Read", "Unread"),
                defaultValue:'Unread',
            },
            file_name:{
                type:DataTypes.TEXT,
                defaultValue: null,
            },
            message_text: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            read_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                allowNull: true,
            },
            thumbnail:{
                type: DataTypes.STRING,
                allowNull: true,
            },
            media_text:{
                type:DataTypes.TEXT('long'),
                defaultValue: null,
            },

        }, {
        tableName: 'tbl_message',
        timestamps: true
    });
    return Message;
};