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
db.Levave = require('../model/leave')(sequelize, Sequelize, Model)
db.Message = require('../model/messsage')(sequelize, Sequelize, Model)
db.MessageStatus = require('../model/messageStatus')(sequelize, Sequelize, Model)
db.MenuDay = require('../model/menuDay')(sequelize, Sequelize, Model)
db.MedicationInfo = require('../model/medicationInfo')(sequelize, Sequelize, Model)
db.Certification = require('../model/certification')(sequelize, Sequelize, Model)
db.Attendance = require('../model/attendance')(sequelize, Sequelize, Model)
db.AddRole = require('../model/addRole')(sequelize, Sequelize, Model)


module.exports = db;
