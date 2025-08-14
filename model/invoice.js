module.exports = (sequelize, DataTypes) => {
    const Invoice = sequelize.define(
        'Invoice',
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
            parent_id: {
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
                defaultValue: null,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            total_fees:{
                type: DataTypes.FLOAT(11, 2),
                allowNull: true, 
            },
            month:{
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            year:{
                type: DataTypes.INTEGER,
                allowNull: true,
            }
        }, {
        tableName: 'tbl_invoice',
        timestamps: true
    });
    return Invoice;
};