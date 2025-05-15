module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define(
        'User',
        {
            email: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
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
            password: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            is_email_verify: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            login_type: {
                type: DataTypes.ENUM('normal', 'apple', 'google'),
                defaultValue: 'normal',
                allowNull: true,
            },
            otp: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            otp_created_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            full_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            role: {
                type: DataTypes.ENUM('super_admin', 'school', 'teacher', 'parent', 'principal'),
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
            qualification: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            designation: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            experience: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            joining_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            address: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            about_staff: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
            },
            school_name: {
                type: DataTypes.STRING,
                allowNull: true,
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
            is_blocked: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            subscription_plan: {
                type: DataTypes.ENUM('monthly', 'yearly', 'regular'),
                allowNull: true,
                defaultValue: 'regular',
            },
            is_deleted:{
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            }
        },
        {
            tableName: "tbl_user",
            timestamps: true
        }
    )
    return User;
};

