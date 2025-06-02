module.exports = (sequelize, DataTypes) => {
    const MenuDay = sequelize.define(
        'MenuDay',
        {
            menu_day: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            menu_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_menu',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
        },
        {
            tableName: "tbl_menu_day",
            timestamps: true
        }
    )
    return MenuDay;
};

