const cron = require('node-cron');
const { db } = require('../config/db'); // Adjust the path based on your folder structure
const { Op } = require('sequelize');
const moment = require('moment');
const { send_notification } = require('./notification');

// Runs daily at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        console.log("Runs daily at midnight")
    } catch (error) {
        console.error('Error in badge assignment cron:', error);
    }
});