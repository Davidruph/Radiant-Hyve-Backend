const cron = require('node-cron');
const db = require('../config/db'); // Adjust the path based on your folder structure
const { Op, where } = require('sequelize');
const moment = require('moment');
const { send_notification } = require('./notification');

// Runs daily at midnight
// cron.schedule('* * * * *', async () => {
cron.schedule('0 0 * * *', async () => {

    try {
        console.log("Runs daily at midnight")

        await db.Attendance.update(
            {
                is_clock_in: false,
                clock_out_time: moment().toDate(),
            },
            {
                where: { is_clock_in: true }
            }
        )

        const today = moment().startOf('day').toDate();
        await db.Leave.update(
            {
                leave_request_status: "rejected",
            },
            {
                where: {
                    date: { [Op.lt]: today },
                    leave_request_status: "pending"
                }
            }
        );

        console.log("clock out successfully");

    } catch (error) {
        console.error('Error in badge assignment cron:', error);
    }
});

cron.schedule('* * * * *', async () => {
    try {
        const asttedabce = await db.Attendance.findAll({
            where: {
                is_clock_in: true,
                clock_out_time: null,
                clock_in_time: moment().subtract(8, 'hours').toDate()
                
            }
        })

        if (asttedabce.length > 0) {
            asttedabce.map(async (item) => {
                const userIds = item.user_id
                const school_id = item.school_id

                const notiType = `clock_out_reminder`;
                const message = {
                    title: "Clock out reminder",
                    body: "You've been clocked in for over 8 hours. Please remember to clock out."
                };

                const Data = {
                    notification_by: userIds,
                    notification_to: userIds,
                    notification_type: notiType,
                    body: message.body,
                    title: message.title,
                    school_id: school_id,
                };

                await send_notification(userIds, message, notiType, Data);
                await db.Notification.create(Data);
            })
        }
        console.log("clock out reminder successfully===========================================", asttedabce);

    } catch (error) {
        console.error('Error in leave rejection cron:', error);
    }
});
