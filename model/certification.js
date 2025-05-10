module.exports = (sequelize, DataTypes) => {
    const Certification = sequelize.define(
        'Certification',
        {
            institution_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            hire_checklist: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            staff_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
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
            tableName: "tbl_certification",
            timestamps: true
        }
    )
    return Certification;
};

