const redisClient = require('./redisConfig.js');
const { getIO } = require('./socketSetup.js');
const { db } = require('./db.js');

var emitToSockets = async (userId, eventName, data) => {
    // console.log("userId, eventName, data", userId, eventName, data);
    const socketIds = await redisClient.lrange(`user:${userId}:sockets`, 0, -1);
    console.log("socketIds", socketIds, userId, eventName);
    try {
        socketIds.forEach((socketId) => {
            const socket = getIO().sockets.sockets.get(socketId);
            if (socket) {
                console.log("Emit Sent", userId, eventName)
                socket.emit(eventName, data);
            }
        });
    } catch (error) {
        console.log("error in emitToSocket", error)
    }
};

const getSocketCount = async () => {
    try {
        const userKeys = await redisClient.keys('user:*:sockets');
        let totalSocketCount = 0;

        for (const key of userKeys) {
            const socketIds = await redisClient.lrange(key, 0, -1);
            totalSocketCount += socketIds.length;
        }

        return totalSocketCount;
    } catch (error) {
        console.error("Error getting socket count:", error);
        return 0;
    }
};


function socketConfig(io) {
    io.on("connection", async (socket) => {
        console.log("connection", socket.id);
        socket.on("socket_register", async function (data) {
            console.log("socket_register ->", data.user_id, socket.id);
            let user_id = data.user_id;
            socket.user_id = user_id;

            // Check if the socket ID is already registered for this user
            const existingSocketIds = await redisClient.lrange(`user:${user_id}:sockets`, 0, -1);
            // await db.User.update({ status: "Online" }, { where: { id: user_id } });
            if (existingSocketIds.includes(socket.id)) {
                console.log(`Socket ID ${socket.id} already registered for user ${user_id}`);
                return; // Skip the registration if the socket ID is already present
            }

            // If not already registered, add the socket ID to the list
            await redisClient.lpush(`user:${user_id}:sockets`, socket.id);
            // Retrieve and log all socket IDs for the user
            const socketIds = await redisClient.lrange(`user:${user_id}:sockets`, 0, -1);
            console.log("socketIds in socket_register-->", user_id, socketIds);
        });

        socket.on("join_room", async function (data) {
            console.log("join_room called", data);
            var user_id = data.user_id;
            var chat_id = parseInt(data.chat_id);
            socket.user_id = user_id;
            console.log("socket.join(chat_id)", chat_id);
            socket.join(chat_id);
            try {
                await emitToSockets(user_id, "join_room", {Message: "Successful",info: data});
            } catch (error) {
                console.log("join_room emit not send");
            }
        });

        socket.on("left_room", async function (data) {
            console.log("left_room called", data);
            var chat_id = parseInt(data.chat_id);
            socket.leave(chat_id);
            try {
                await emitToSockets(data.user_id, "left_room", { Message: "Successful",info: data});
            } catch (error) {
                console.log("left_room emit not send");
            }
        });

        socket.on("disconnect", async (sockets) => {
            console.log("disconnectedSocketId", socket.id, socket.user_id);
            try {
                await redisClient.lrem(`user:${socket.user_id}:sockets`, 0, socket.id);
            } catch (e) {
                console.log("id is not found ->>", socket.id);
            }
        });

        socket.on("join_group", async function (data) {
            console.log("join group called", data);
            let user_id = data.user_id;
            let chatroomId = parseInt(data.school_id);
            socket.user_id = user_id;
            socket.join(`lesson_chat_${chatroomId}`);
            try {
              await commonService.emitToSockets(data.user_id, "join_group", {Message: "Successful",info: data});
              console.log(`join_group emit send to user ${data.user_id}`);
            } catch (error) {
              console.log("join_group emit not send");
            }
          });
      
          socket.on("left_group", async function (data) {
              console.log("left_group", data);
            let chatroomId = parseInt(data.school_id);
            socket.leave(`lesson_chat_${chatroomId}`);
            try {
              await commonService.emitToSockets(data.user_id, "left_group", {Message: "group left Successful",info: data,});
                console.log(`left_group emit send to user ${data.user_id}`);
            } catch (error) {
              console.log("left_group emit not send");
            }
          });
          
        global.socket_id = socket.id;
    });

    const SOCKET_TIMEOUT = 30000; // Timeout value in milliseconds (adjust as needed)

    // Function to periodically check and disconnect sockets whose IDs have been removed from Redis
    setInterval(async () => {
        try {
            // Get all user IDs stored in Redis
            const userIds = await redisClient.keys("user:*:sockets");
            // console.log("userIds=====>>>", userIds);
            // Iterate through each user ID
            for (const userId of userIds) {
                // console.log('userId===>>>', userId);
                // Get all socket IDs associated with the current user from Redis
                const socketIds = await redisClient.lrange(userId, 0, -1);
                // console.log("socketIdss in disconnect",socketIds)
                // Iterate through each socket ID
                for (const socketId of socketIds) {
                    // Check if the socket corresponding to the socket ID is disconnected
                    const socket = io.sockets.sockets.get(socketId);

                    if (!socket || !socket.connected) {

                        // Socket is disconnected, disconnect it
                        // console.log("Disconnecting socket:", socketId);
                        await redisClient.lrem(userId, 0, socketId);
                        // io.emit("active_count", { active_count: await getSocketCount() })
                        io.emit("active_status", { user_id: userId, status: "Offline" });
                    }
                }
            }
        } catch (error) {
            console.error("Error checking and disconnecting sockets:", error)
        }
    }, SOCKET_TIMEOUT); // Run the check every SOCKET_TIMEOUT milliseconds
}

module.exports = { socketConfig, emitToSockets, getSocketCount };
