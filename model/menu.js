module.exports = (sequelize, DataTypes) => {
    const Menu = sequelize.define(
        'Menu',
        {
            menu_type: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            menu_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            menu_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            about_meal: {
                type: DataTypes.TEXT('long'),
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
            is_all:{
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
            tableName: "tbl_menu",
            timestamps: true
        }
    )
    return Menu;
};

