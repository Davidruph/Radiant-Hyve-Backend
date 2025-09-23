module.exports = (sequelize, DataTypes) => {
    const Diaper = sequelize.define(
        'Diaper',
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
            tableName: "tbl_diaper",
            timestamps: true
        }
    )
    return Diaper;
};

