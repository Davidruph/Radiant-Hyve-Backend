const cron = require('node-cron');
const db = require('../config/db'); // Adjust the path based on your folder structure
const { Op, where } = require('sequelize');
const moment = require('moment');
const { send_notification } = require('./notification');
const { emitToSockets } = require('../config/socketConfig');

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

// ============================================================
// TRANSPORT MONITORING — runs every 2 minutes
// Detects: GPS loss, inactive drivers, stalled routes
// ============================================================
cron.schedule('*/2 * * * *', async () => {
    try {
        const now = moment();

        // 1. GPS LOSS — active routes whose last location update is > 10 minutes old
        const staleLocationCutoff = moment().subtract(10, 'minutes').toDate();
        const activeRoutes = await db.Route.findAll({
            where: { status: 'active', is_deleted: false },
            include: [
                { model: db.DriverLocation, as: 'liveLocation', required: false }
            ]
        });

        for (const route of activeRoutes) {
            const location = route.liveLocation;

            // GPS considered lost if: no location record at all, OR last_updated > 10 min ago
            const gpsLost =
                !location ||
                moment(location.last_updated).isBefore(staleLocationCutoff);

            if (gpsLost) {
                // Only create one open connectivity_loss exception per route (avoid spam)
                const existing = await db.TransportException.findOne({
                    where: {
                        route_id: route.id,
                        exception_type: 'connectivity_loss',
                        status: 'open',
                        is_deleted: false
                    }
                });

                if (!existing) {
                    const exception = await db.TransportException.create({
                        route_id: route.id,
                        exception_type: 'connectivity_loss',
                        severity: 'high',
                        description: `No GPS signal received from driver for over 10 minutes on route "${route.route_name}".`,
                        status: 'open'
                    });

                    // Alert admin via socket
                    emitToSockets(route.school_id, 'transport:exception', {
                        exception_id: exception.id,
                        route_id: route.id,
                        route_name: route.route_name,
                        exception_type: 'connectivity_loss',
                        severity: 'high',
                        description: exception.description
                    }).catch(() => {});

                    // Push notification to school admin
                    await send_notification(
                        route.school_id,
                        {
                            title: 'GPS Signal Lost',
                            body: `No GPS signal from driver on route "${route.route_name}" for over 10 minutes.`
                        },
                        'transport_gps_lost',
                        { route_id: route.id, route_name: route.route_name }
                    );
                }
            } else if (location) {
                // GPS recovered — resolve any open connectivity_loss exception
                await db.TransportException.update(
                    { status: 'resolved', resolved_at: new Date(), resolution_notes: 'GPS signal restored automatically.' },
                    {
                        where: {
                            route_id: route.id,
                            exception_type: 'connectivity_loss',
                            status: 'open'
                        }
                    }
                );
            }
        }

        // 2. STALLED ROUTE — active routes running > 4 hours with no end
        const stalledCutoff = moment().subtract(4, 'hours').toDate();
        const stalledRoutes = await db.Route.findAll({
            where: {
                status: 'active',
                is_deleted: false,
                actual_start_time: { [Op.lt]: stalledCutoff }
            }
        });

        for (const route of stalledRoutes) {
            const existing = await db.TransportException.findOne({
                where: {
                    route_id: route.id,
                    exception_type: 'route_delayed',
                    status: 'open',
                    is_deleted: false
                }
            });

            if (!existing) {
                const exception = await db.TransportException.create({
                    route_id: route.id,
                    exception_type: 'route_delayed',
                    severity: 'medium',
                    description: `Route "${route.route_name}" has been active for over 4 hours without completion.`,
                    status: 'open'
                });

                emitToSockets(route.school_id, 'transport:exception', {
                    exception_id: exception.id,
                    route_id: route.id,
                    route_name: route.route_name,
                    exception_type: 'route_delayed',
                    severity: 'medium',
                    description: exception.description
                }).catch(() => {});

                await send_notification(
                    route.school_id,
                    {
                        title: 'Route Delayed',
                        body: `Route "${route.route_name}" has been running for over 4 hours. Please check in with the driver.`
                    },
                    'transport_route_delayed',
                    { route_id: route.id, route_name: route.route_name }
                );
            }
        }

    } catch (error) {
        console.error('Transport monitoring cron error:', error);
    }
});

// ============================================================
// VEHICLE INSURANCE EXPIRY — runs daily at 8 AM
// Alerts school admin 30 days and 7 days before expiry
// ============================================================
cron.schedule('0 8 * * *', async () => {
    try {
        const today = moment().startOf('day');
        const in30Days = moment().add(30, 'days').endOf('day').toDate();
        const in7Days = moment().add(7, 'days').endOf('day').toDate();
        const todayDate = today.toDate();

        // Fetch vehicles with insurance expiring within the next 30 days
        const expiringVehicles = await db.Vehicle.findAll({
            where: {
                insurance_expiry: {
                    [Op.between]: [todayDate, in30Days]
                },
                status: 'active',
                is_deleted: false
            },
            attributes: ['id', 'vehicle_name', 'registration_plate', 'insurance_expiry', 'school_id']
        });

        for (const vehicle of expiringVehicles) {
            const expiryDate = moment(vehicle.insurance_expiry);
            const daysLeft = expiryDate.diff(today, 'days');
            const isUrgent = expiryDate.isBefore(moment(in7Days));

            // Only send alerts at the 30-day mark and 7-day mark (avoid daily spam)
            if (daysLeft !== 30 && daysLeft !== 7 && daysLeft !== 1) continue;

            const message = {
                title: isUrgent
                    ? `⚠ Insurance Expiring in ${daysLeft} Day${daysLeft !== 1 ? 's' : ''}!`
                    : `Insurance Expiry Reminder`,
                body: `${vehicle.vehicle_name} (${vehicle.registration_plate}) insurance expires on ${expiryDate.format('MMM D, YYYY')}. Please renew.`
            };

            await send_notification(
                vehicle.school_id,
                message,
                'vehicle_insurance_expiry',
                {
                    vehicle_id: vehicle.id,
                    vehicle_name: vehicle.vehicle_name,
                    days_left: daysLeft,
                    expiry_date: vehicle.insurance_expiry
                }
            );

            // Save to notification table
            await db.Notification.create({
                notification_by: vehicle.school_id,
                notification_to: vehicle.school_id,
                notification_type: 'vehicle_insurance_expiry',
                title: message.title,
                body: message.body,
                school_id: vehicle.school_id,
                notification_status: 'Unread'
            });

            console.log(`Insurance expiry alert sent for ${vehicle.vehicle_name} — ${daysLeft} days left`);
        }

    } catch (error) {
        console.error('Insurance expiry cron error:', error);
    }
});
