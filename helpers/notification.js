
const { db } = require("../config/db");

const axios = require("axios");
const { JWT } = require("google-auth-library");
// Path to your service account key file
const SERVICE_ACCOUNT_FILE = require("./notification.json");
const { emitToSockets } = require("../config/socketConfig");

// Project ID from Firebase Console
const PROJECT_ID = SERVICE_ACCOUNT_FILE.project_id;
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

const client = new JWT(
    SERVICE_ACCOUNT_FILE.client_email,
    null,
    SERVICE_ACCOUNT_FILE.private_key,
    ["https://www.googleapis.com/auth/firebase.messaging"]
);

async function getAccessToken() {
    try {
        const accessToken = await client.authorize();
        console.log("Access Token:", accessToken.access_token);
        return accessToken.access_token;
    } catch (error) {
        console.log("Error generating access token:", error);
    }
}
// console.log(getAccessToken())

const send_notification = async (user_id, message, notificationType, data) => {
    try {
        let notificationCount = await db.Notification.count({ where: { notification_to: user_id, notification_status: "Unread" } });
        console.log(`Notification count for user ${user_id}:`, notificationCount);

        // Emit the notification count to each user
        await emitToSockets(user_id, "unread_notification_count", { data: notificationCount });
        const accessToken = await getAccessToken();
        const tokensResult = await db.Token.findAll({
            where: {
                user_id: user_id
            },
            attributes: ['device_token'],
            order: [['id', 'DESC']]
        });
        // console.log("accessToken :-", accessToken)
        const tokenArray = tokensResult.map((token) => token.device_token);
        console.log("tokenArray:", tokenArray);
        if (tokenArray.length <= 0) {
            console.log("No token found:", user_id);
            return;
        }
        // console.log(tokenArray)
        const stringData = {};
        // for (const [key, value] of Object.entries(data)) {
        //     // console.log("value", value)
        //     stringData[key] = value.toString();
        // }
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object' && value !== null) {
                // Stringify nested objects
                // stringData[key] = JSON.parse(JSON.stringify(value));
                stringData[key] = JSON.stringify(value);
            } else if (value !== null) {
                // Convert non-object values to strings
                stringData[key] = value.toString();
            } else {
                stringData[key] = value;
            }
        }
        for (const token of tokenArray) {
            const messagePayload = {
                message: {
                    token: token,
                    notification: {
                        title: message.title,
                        body: message.body,
                    },
                    data: {
                        ...stringData,
                        notification_type: notificationType.toString()
                    }
                },
            };
            console.log("messagePayload", user_id, token, messagePayload);
            try {
                const response = await axios.post(FCM_URL, messagePayload, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                });
                console.log(`Successfully sent message: ${user_id}`, response.data,);
            } catch (error) {
                console.error(`Error sending push notification to user_id ${user_id} `, error.message);
            }
        }
    } catch (error) {
        console.error(
            `Error sending push notification to user_id ${user_id}`,
            error.message
        );
    }
};

// send_notification(9, { title: "DieHard", body: "Hello From DieHard!" }, 1, {})
module.exports = { send_notification };