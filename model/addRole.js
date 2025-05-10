module.exports = (sequelize, DataTypes) => {
    const AddRole = sequelize.define(
        'AddRole',
        {
            add_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            add_to: {
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
            add_role: {
                type: DataTypes.ENUM('super_admin', 'school', 'teacher', 'student', 'parent', 'principal'),
                allowNull: true, 
            },
        },
        {
            tableName: "tbl_add_role",
            timestamps: true
        }
    )
    return AddRole;
};

