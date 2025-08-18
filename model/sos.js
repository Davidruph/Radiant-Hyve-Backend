module.exports = (sequelize, DataTypes) => {
    const Sos = sequelize.define(
        'Sos',
        {
            sos_type_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: null,
                references: {
                    model: 'tbl_sos_type',
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
        }, {
        tableName: 'tbl_sos',
        timestamps: true
    });
    return Sos;
};