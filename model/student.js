module.exports = (sequelize, DataTypes) => {
    const Student = sequelize.define(
        'Student',
        {
            parent_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            iso_code: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            country_code: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            mobile_no: {
                type: DataTypes.BIGINT,
                allowNull: true,
            },
            full_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            parent_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            profile_pic: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            gender: {
                type: DataTypes.ENUM('male', 'female', 'other'), 
            },
            dob: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            relation_to_child: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            madical_insuarance_no: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            }, 
            address: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            request_status: {
                type: DataTypes.ENUM( 'pending','accepted', 'rejected', 'waiting', 'inActive', 'feesPending'),
                defaultValue: 'pending',
                allowNull: false,
            },
            rejected_reason: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            shift_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tbl_shift',
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
            tableName: "tbl_student",
            timestamps: true
        }
    )
    return Student;
};

