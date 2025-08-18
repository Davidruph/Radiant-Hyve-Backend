module.exports = (sequelize, DataTypes) => {
    const SosType = sequelize.define(
        'SosType',
        {
            sos_name: {
                type: DataTypes.STRING,
                allowNull: true,
            }
        }, {
        tableName: 'tbl_sos_type',
        timestamps: true
    });
    return SosType;
};