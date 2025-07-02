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

        console.log("clock out successfully");

    } catch (error) {
        console.error('Error in badge assignment cron:', error);
    }
});

cron.schedule('0 0 * * *', async () => {
    try {
        console.log("Runs daily at midnight");
        const today = moment().startOf('day').toDate();
        await db.Leave.update(
            {
                leave_request_status: "rejected",
            },
            {
                where: {
                    date: { [Op.lt]: today } ,
                    leave_request_status: "pending"
                }
            }
        );

        console.log("Leave status updated for past dates");

    } catch (error) {
        console.error('Error in leave rejection cron:', error);
    }
});
