module.exports = (sequelize, DataTypes) => {
    const Bath = sequelize.define(
        'Bath',
        {
            student_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_student',
                    key: 'id',
                },
                onDelete: 'CASCADE',
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
            parent_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            reason: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
        },
        {
            tableName: "tbl_bath",
            timestamps: true
        }
    )
    return Bath;
};

