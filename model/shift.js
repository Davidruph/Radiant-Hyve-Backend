module.exports = (sequelize, DataTypes) => {
    const Shift = sequelize.define(
        'Shift',
        {
            shift_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            shift_fee: {
                type: DataTypes.FLOAT(10, 2),
                allowNull: true,
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
            penalty:{
                type: DataTypes.FLOAT(10, 2),
                allowNull: true,
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            tableName: "tbl_shift",
            timestamps: true
        }
    )
    return Shift;
};

