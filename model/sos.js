module.exports = (sequelize, DataTypes) => {
    const Sos = sequelize.define(
        'Sos',
        {
            sos_name: {
                type: DataTypes.STRING,
                allowNull: true,
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