const { Sequelize, DataTypes, Model } = require('sequelize')
const sequelize = require('./connection');

const db = {}
db.Sequelize = Sequelize
db.sequelize = sequelize

db.User = require('../model/user')(sequelize, Sequelize, Model)
db.Token = require('../model/token')(sequelize, Sequelize, Model)
db.Student = require('../model/student')(sequelize, Sequelize, Model)
db.Shift = require('../model/shift')(sequelize, Sequelize, Model)
db.Menu = require('../model/menu')(sequelize, Sequelize, Model)

db.StudentMenu = require('../model/studentMenu')(sequelize, Sequelize, Model)
db.StudentAttendance = require('../model/studentAttendance')(sequelize, Sequelize, Model)
db.SleepLoag = require('../model/sleepLoag')(sequelize, Sequelize, Model)
db.Chat = require('../model/chat')(sequelize, Sequelize, Model)
db.Event = require('../model/event')(sequelize, Sequelize, Model)
db.Leave = require('../model/leave')(sequelize, Sequelize, Model)
db.Message = require('../model/messsage')(sequelize, Sequelize, Model)
db.MessageStatus = require('../model/messageStatus')(sequelize, Sequelize, Model)
db.MenuDay = require('../model/menuDay')(sequelize, Sequelize, Model)
db.MedicationInfo = require('../model/medicationInfo')(sequelize, Sequelize, Model)
db.Certification = require('../model/certification')(sequelize, Sequelize, Model)
db.Attendance = require('../model/attendance')(sequelize, Sequelize, Model)
db.AddRole = require('../model/addRole')(sequelize, Sequelize, Model)

db.User.hasMany(db.AddRole, {foreignKey: 'school_id',as: 'School'})
db.AddRole.belongsTo(db.User, {foreignKey: 'school_id', as: 'addSchool'})

db.User.hasMany(db.Student, {foreignKey: 'parent_id',as: 'Students'})
db.Student.belongsTo(db.User, {foreignKey: 'parent_id', as: 'StudentParent'})

db.Shift.hasMany(db.Student, {foreignKey: 'shift_id',as: 'studentShift'})
db.Student.belongsTo(db.Shift, {foreignKey: 'shift_id', as: 'Shift'})

db.User.hasMany(db.Student, {foreignKey: 'teacher_id',as: 'Student'})
db.Student.belongsTo(db.User, {foreignKey: 'teacher_id', as: 'Teacher'})


db.User.hasMany(db.AddRole, {foreignKey: 'add_to',as: 'AddToRole'})
db.AddRole.belongsTo(db.User, {foreignKey: 'add_to', as: 'AddRole'})

db.User.hasMany(db.AddRole, {foreignKey: 'add_by',as: 'AddByRole'})
db.AddRole.belongsTo(db.User, {foreignKey: 'add_by', as: 'AddedRole'})

db.User.hasMany(db.MessageStatus, {foreignKey: "message_by",as: "MessageStatuse"})
db.MessageStatus.belongsTo(db.User, { foreignKey: "message_by", as: "Users"})

db.User.hasMany(db.MessageStatus, {foreignKey: "message_to", as: "MessageStatus"})
db.MessageStatus.belongsTo(db.User, {  foreignKey: "message_to", as: "User"})

db.Chat.hasMany(db.MessageStatus, { foreignKey: "chat_id",as: "ChatMessageStatus"})
db.MessageStatus.belongsTo(db.Chat, { foreignKey: "chat_id", as: "Chat"})

db.Message.hasMany(db.MessageStatus, { foreignKey: "message_id",as: "MessageStatus"})
db.MessageStatus.belongsTo(db.Message, { foreignKey: "message_id", as: "Message"})


db.User.hasMany(db.Attendance, {foreignKey: 'user_id',as: 'userAttend'})
db.Attendance.belongsTo(db.User, {foreignKey: 'user_id', as: 'userAttendance'})

db.User.hasMany(db.Attendance, {foreignKey: 'school_id',as: 'schoolAttendance'})
db.Attendance.belongsTo(db.User, {foreignKey: 'school_id', as: 'schoolAttendance'})


db.User.hasMany(db.Certification, {foreignKey: 'admin_id',as: 'certificationAdmin'})
db.Certification.belongsTo(db.User, {foreignKey: 'admin_id', as: 'staffCertificats'})

db.User.hasMany(db.Certification, {foreignKey: 'school_id',as: 'schoolCertification'})
db.Certification.belongsTo(db.User, {foreignKey: 'school_id', as: 'schoolCertificats'})

db.User.hasMany(db.Certification, {foreignKey: 'staff_id',as: 'staffCertification'})
db.Certification.belongsTo(db.User, {foreignKey: 'staff_id', as: 'certificats'})



db.User.hasMany(db.Chat, { foreignKey: "chat_by",as: "ChatsByUser",});
db.Chat.belongsTo(db.User, {foreignKey: "chat_by",as: "Sender",});

db.User.hasMany(db.Chat, {foreignKey: "chat_to",as: "ChatsToUser",});
db.Chat.belongsTo(db.User, {foreignKey: "chat_to",as: "Receiver",}); 

db.User.hasMany(db.Chat, {foreignKey: 'school_id',as: 'schoolChat'})
db.Chat.belongsTo(db.User, {foreignKey: 'school_id', as: 'ChatSchool'})

db.Chat.hasMany(db.Message, {foreignKey: "chat_id",as: "Messages"})
db.Message.belongsTo(db.Chat, {foreignKey: "chat_id", as: "ChatMessages"})

db.User.hasMany(db.Message, {foreignKey: "message_by",as: "sentMessages"});
db.Message.belongsTo(db.User, {foreignKey: "message_by",as: "sendermessage"});

db.User.hasMany(db.Message, {foreignKey: "message_to",as: "receivedMessages"});
db.Message.belongsTo(db.User, {foreignKey: "message_to",as: "receivermessage"});

db.User.hasMany(db.Event, {foreignKey: "admin_id",as: "EventAdmin",});
db.Event.belongsTo(db.User, {foreignKey: "admin_id",as: "AdminEvents",}); 

db.User.hasMany(db.Event, {foreignKey: 'school_id',as: 'schoolEvent'})
db.Event.belongsTo(db.User, {foreignKey: 'school_id', as: 'Events'})


db.User.hasMany(db.Leave, {foreignKey: 'teacher_id',as: 'teachersLeave'})
db.Leave.belongsTo(db.User, {foreignKey: 'teacher_id', as: 'LeaveTeacher'})


db.User.hasMany(db.MedicationInfo, {foreignKey: "admin_id",as: "adminMedicalInfo",});
db.MedicationInfo.belongsTo(db.User, {foreignKey: "admin_id",as: "adminMedicationInfo",}); 

db.User.hasMany(db.MedicationInfo, {foreignKey: 'school_id',as: 'schoolMedicationInfo'})
db.MedicationInfo.belongsTo(db.User, {foreignKey: 'school_id', as: 'Medication'})

db.Student.hasMany(db.MedicationInfo, {foreignKey: 'student_id',as: 'studentMedicalInfo'})
db.MedicationInfo.belongsTo(db.Student, {foreignKey: 'student_id', as: 'MedicationInfoStudent'})



db.User.hasMany(db.Menu, {foreignKey: "admin_id",as: "adminMenu",});
db.Menu.belongsTo(db.User, {foreignKey: "admin_id",as: "studentMenu",}); 

db.User.hasMany(db.Menu, {foreignKey: 'school_id',as: 'schoolMenu'})
db.Menu.belongsTo(db.User, {foreignKey: 'school_id', as: 'Menu'})

db.Menu.hasMany(db.MenuDay, {foreignKey: 'menu_id',as: 'MenuDay'})
db.MenuDay.belongsTo(db.Menu, {foreignKey: 'menu_id', as: 'dayMenu'})

db.Student.hasMany(db.Menu, {foreignKey: 'student_id',as: 'StudentsMenu'})
db.Menu.belongsTo(db.Student, {foreignKey: 'student_id', as: 'student'})

db.User.hasMany(db.Shift, {foreignKey: "admin_id",as: "adminShift",});
db.Shift.belongsTo(db.User, {foreignKey: "admin_id",as: "Shiftadmin",}); 


db.Student.hasOne(db.SleepLoag, {foreignKey: "student_id",as: "SleepLoag",});
db.SleepLoag.belongsTo(db.Student, {foreignKey: "student_id",as: "studentSleepLoag",}); 

// db.User.hasMany(db.SleepLoag, {foreignKey: 'parent_id',as: 'studentSleepLoag'})
// db.SleepLoag.belongsTo(db.User, {foreignKey: 'parent_id', as: 'SleepLoag'})


db.Student.hasMany(db.StudentAttendance, {foreignKey: "student_id",as: "Attendance",});
db.StudentAttendance.belongsTo(db.Student, {foreignKey: "student_id",as: "studentAttendance",}); 

db.User.hasMany(db.StudentAttendance, {foreignKey: 'teacher_id',as: 'studentAttendance'})
db.StudentAttendance.belongsTo(db.User, {foreignKey: 'teacher_id', as: 'Attendance'})


db.Student.hasMany(db.StudentMenu, {foreignKey: "student_id",as: "StudentMenu",});
db.StudentMenu.belongsTo(db.Student, {foreignKey: "student_id",as: "Menu",}); 

db.Menu.hasMany(db.StudentMenu, {foreignKey: 'menu_id',as: 'StudentMenu'})
db.StudentMenu.belongsTo(db.Menu, {foreignKey: 'menu_id', as: 'studentMenu'})


db.User.hasMany(db.User, {foreignKey: 'school_id',as: 'schoolUser'})
db.User.belongsTo(db.User, {foreignKey: 'school_id', as: 'User'})


module.exports = db;
