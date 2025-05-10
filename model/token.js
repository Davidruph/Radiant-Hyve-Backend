module.exports = (sequelize, DataTypes) => {
    const Token = sequelize.define(
        'Token',
        {
            device_id: {
                type: DataTypes.STRING, 
                allowNull: true,
            },
            device_token: {
                type: DataTypes.STRING, 
                allowNull: true,
            },
            device_type: {
                type: DataTypes.ENUM('android', 'ios', 'web'), 
                allowNull: true,
            },
            refresh_token: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            token_expire_at: {
                type: DataTypes.DATE, 
                allowNull: true,
            },
            user_id: {
                type: DataTypes.INTEGER, 
                allowNull: true,
                references: {
                    model: 'tbl_user', 
                    key: 'id', 
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE', 
            },
    
        },
        {
            tableName: "tbl_token",
            timestamps: true
        }
    
    )
    return Token;
};                                                                  