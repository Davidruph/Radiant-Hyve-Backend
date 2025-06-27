require('dotenv').config()
const db = require("../../config/db");
const { getIO } = require('../../config/socketSetup');
const fs = require('fs');
const path = require('path');
const { send_notification } = require('../../helpers/notification')
const { Op, Sequelize, where } = require('sequelize');
const { emitToSockets } = require(`../../config/socketConfig`);
const { upload_file, deleteFromS3, uploadVideo } = require('../../helpers/s3_upload')

const uploadMediaInChat = async (media, thumbnails, mediaType, mediaText, documentText,  messageText) => {
    const uploadedMedia = [];
    try {
        const types = mediaType;
        let thumbnailIndex = 0;
        let mediaTextIndex = 0;
        let documentTextIndex = 0;
        console.log("types[0]", types[0])
        if (types[0] == "Text") {
            const object = {
                image: messageText,
                thumbnail: null,
                media_text: null,
                file_name: null,
                message_type: types[0]
            }
            uploadedMedia.push(object);
        } else {
            for (const [index, element] of media.entries()) {
                let object = {}
                if (types[index] == 'Video' || types[index] == 'Video/Text') {
                    const imageUrl = await uploadVideo(element, 'chat_media');;
                    object = {
                        image: imageUrl,
                        thumbnail: null,
                        media_text: null,
                        file_name: null,
                        message_type: types[index]
                    };
                } else {
                    const imageUrl = await upload_file(element, 'chat_media');;
                    object = {
                        image: imageUrl,
                        thumbnail: null,
                        media_text: null,
                        file_name: null,
                        message_type: types[index]
                    };
                }
                if (types[index] == 'Video' || types[index] == 'Video/Text') {
                    if (thumbnails && thumbnails[thumbnailIndex]) {
                        const thumbnailUrl = await upload_file(thumbnails[thumbnailIndex], 'thumbnail/');
                        object.thumbnail = thumbnailUrl;
                        thumbnailIndex++;
                    }
                }
                if (types[index] == 'Image/Text' || types[index] == 'Video/Text') {
                    if (mediaText && mediaText[mediaTextIndex]) {
                        object.media_text = mediaText[mediaTextIndex];
                        mediaTextIndex++;
                    }
                }
                if (types[index] == 'Document') {
                    if (documentText && documentText[documentTextIndex]) {
                        object.file_name = documentText[documentTextIndex];
                        documentTextIndex++;
                    }
                }
                uploadedMedia.push(object);
            }
        }
        return uploadedMedia;
    } catch (error) {
        console.error('Error uploading media', error);
        throw new Error('Failed to upload media');
    }
};

const createLessonChat = async (req, res) => {
    if (req.user.role != "principal" && req.user.role != "teacher") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        let school_id = null
        if (req.user.role != "school") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const existingChat = await db.Chat.findOne({
            where: {
                chat_by: school_id,
                chat_to: req.user.id,
                school_id: school_id,
            }
        });

        if (existingChat) {
            return res.status(200).json({ status: 1, messsage: 'Chat created successfully.', chat: existingChat });
        }

        const chat = await db.Chat.create({
            chat_by: school_id,
            chat_to: req.user.id,
            school_id: school_id,
        });
        return res.status(201).json({
            status: 1,
            message: "Chat created successfully.",
            chat,
        });
    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({
            status: 0,
            message: "Internal server error",
            error: error.message,
        });
    }
}

const sendGroupMessage = async (req, res) => {
    if (req.user.role != "principal" && req.user.role != "teacher" && req.user.role != "school") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { message_type, file_name, media_text, message_text } = req.body;
        console.log('sendGroupMessage api called', req.body);
        console.log('sendGroupMessage api called', req.files);
        const message_by = req.user.id

        let school_id = null
        if (req.user.role != "school") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const existingChat = await db.Chat.findOne({ where: { chat_by: school_id, chat_to: req.user.id, school_id } })
        if (!existingChat) {
            await db.Chat.create({
                chat_by: school_id,
                chat_to: req.user.id,
                school_id: school_id,
            })
        }
        const allowedMessageTypes = ["Text", "Image", "Video", "Document", "Audio", "Video/Text", "Image/Text"];

        const messageTypes = Array.isArray(message_type) ? message_type : message_type ? JSON.parse(message_type) : [];

        if (messageTypes.some(type => !allowedMessageTypes.includes(type))) {
            return res.status(400).json({
                status: 0,
                message: "Invalid message type. Allowed types are: Text, Image, Video, Document,Audio,Video/Text,Image/Text"
            });
        }

        let clientsInRoom;
        try {
            const room = getIO().sockets.adapter.rooms.get(`lesson_chat_${school_id}`);
            if (room) {
                clientsInRoom = room.size;
                console.log("clientsInRoom in sendMessage", clientsInRoom);
            } else {
                console.log(`Room ${parseInt(school_id)} does not exist`);
            }
        } catch (error) {
            console.log("Error checking socket room", error);
        }

        const mediaTextArray = Array.isArray(media_text) ? media_text : media_text ? JSON.parse(media_text) : [];
        const fileNameArray = Array.isArray(file_name) ? file_name : file_name ? JSON.parse(file_name) : [];
        const arrayOfMedias = await uploadMediaInChat(req.files.media, req.files.thumbnail, messageTypes, mediaTextArray, fileNameArray, message_text);

        if (arrayOfMedias.length > 0) {
            for (let media of arrayOfMedias) {
                let messageData = {
                    message_by,
                    school_id,
                    message_type: media.message_type,
                    message_to: null,
                    message_status: 'Unread',
                    message_text: media.image,
                    thumbnail: media.thumbnail,
                    media_text: media.media_text,
                    file_name: media.file_name,
                };

                const message = await db.Message.create(messageData);
                const emitData = await db.Message.findOne({
                    where: { id: message.id },
                    include: [
                        {
                            model: db.User,
                            as: "sendermessage",
                            attributes: ['id', 'full_name', 'role', 'profile_pic', 'school_name'],
                        },
                    ],
                });
                await getIO().to(`lesson_chat_${school_id}`).emit("new_lesson_chat_message", emitData);
                console.log(`NEW MESSAGE EMIT1: ${JSON.stringify(emitData)}`);
                const sockets = await getIO().in(`lesson_chat_${school_id}`).fetchSockets();
                const usersInRoom = sockets.map((socket) => parseInt(socket.user_id));
                const getRes = await db.Chat.findAll({ where: { school_id }, attributes: ["chat_to"] });

                const allUsers = getRes.map(({ chat_to }) => chat_to);
                const joinUserList = allUsers.filter((user) => usersInRoom.includes(user));
                const notJoinUserList = allUsers.filter((user) => !usersInRoom.includes(user));
                console.log("allUsers", allUsers);
                console.log("joinUserList", joinUserList);
                console.log("notJoinUserList", notJoinUserList);
                const insertSeenMessage = async (messageTo, message_status) => {
                    await db.MessageStatus.create({
                        message_by,
                        message_to: messageTo,
                        message_id: message.id,
                        school_id,
                        message_status,
                        read_at: message_status == 'read' ? new Date(new Date().toUTCString()) : null
                    });
                };
                await Promise.all(joinUserList.map(user => insertSeenMessage(user, 'read')));

                await Promise.all(notJoinUserList.map(async (user) => {
                    await insertSeenMessage(user, 'unread');
                    const countUpdateRes = await getChatDetails(user, school_id);
                    try {
                        await emitToSockets(user, "lesson_chat_count_update", countUpdateRes);
                        console.log(`Count update for user ${user}:`, countUpdateRes);
                    } catch (e) {
                        console.log(`Count update emit not sent`);
                    }
                    const text = media.message_type == 'Text' ? (media.image.length > 50 ? `${media.image.substring(0, 50)}...` : media.image) : `sent you an attachment 📎`;
                    const notiType = "lesoon_chat";
                    const message = {
                        title: "New Message Received",
                        body: `💬 Lesson chat: ${text} (Tap to reply).`,
                    };

                    // const userChat = await db.Chat.findOne({
                    //     where: {
                    //         school_id,
                    //         chat_to: user
                    //     },
                    // });

                    const Data = {
                        school_id: school_id,
                        user_id: emitData.message_by,
                        fullname: emitData.sendermessage.full_name,
                        profile_image: emitData.sendermessage.profile_pic,
                        role: emitData.sendermessage.role,
                        notiType: notiType,
                    };
                    await send_notification(user, message, notiType, Data);
                }));
            }
        }
        return res.status(201).json({
            status: 1,
            message: "Message sent successfully"
        });
    } catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({
            status: 0,
            message: "Internal server error",
            error: error.message,
        });
    }
};


async function getChatDetails(userId, school_id) {
    return await db.Chat.findOne({
        where: { school_id, chat_to: userId },
        attributes: {
            include: [
                [
                    Sequelize.literal(`(
                        SELECT COUNT(*) 
                        FROM tbl_message_status t2 
                        WHERE t2.school_id = Chat.school_id 
                          AND t2.message_status = 'unread' 
                          AND t2.message_to = ${userId}
                    )`),
                    "unreadMessagesCount",
                ],
                [
                    Sequelize.literal(`(
                        SELECT MAX(group_messages.createdAt)
                        FROM tbl_message AS group_messages
                        WHERE group_messages.school_id = Chat.school_id
                    )`),
                    "latestMessageCreatedAt",
                ],
            ]
        },
        include: [
            {
                model: db.Message,
                as: "Messages",
                limit: 1,
                order: [["createdAt", "DESC"]],
            }
        ]
    });
}

const getLessonChatMessages = async (req, res) => {
    if (req.user.role != "principal" && req.user.role != "teacher" && req.user.role != "school") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const { page } = req.query;
        if (!page) {
            return res.status(400).json({ status: 0, message: "page is required." })
        }
        let user_id = req.user.id;
        const limit = 10;
        const offset = (page - 1) * limit;

        let school_id = null
        if (req.user.role != "school") {
            const principal = await db.User.findOne({
                where: { id: req.user.id, is_deleted: false }
            })
            school_id = principal.school_id
        } else {
            school_id = req.user.id
        }

        const totalMessages = await db.Message.count({ where: { school_id } });

        const messages = await db.Message.findAll({
            where: { school_id },
            include: [
                {
                    model: db.User,
                    as: "sendermessage",
                    attributes: ['id', 'full_name', 'profile_pic', 'role', 'school_name'],
                },
                {
                    model: db.MessageStatus,
                    as: "MessageStatus",
                    attributes: ["message_to"],
                    where: { message_to: user_id },
                    required: true
                }
            ],
            order: [["createdAt", "DESC"]],
            limit,
            offset,
        });

        const total_user = await db.User.count({
            where: {
                school_id,
                role: {
                    [Op.in]: ["teacher", "principal", "parent"]
                },
                is_deleted: false
            }
        });

        await db.MessageStatus.update(
            {message_status: 'read' },
            {
                where: {
                    message_to: user_id,
                }
            }
        );

        const total_member = parseInt(total_user) + 1

        const totalPages = Math.ceil(totalMessages / limit);
        return res.status(200).json({
            status: 1,
            message: "Get group chat messages successfully",
            total_member,
            data: messages,
            currentPage: Number(page),
            totalPages,
            totalMessages,

        });
    } catch (error) {
        console.error("ERROR", error);
        return res.status(500).json({ status: 0, message: "Something went wrong", error: error.message });
    }
};

const unreadCount = async (req, res) => {
    if (req.user.role != "principal" && req.user.role != "teacher" && req.user.role != "school") {
        return res.status(403).json({ satus: 0, message: "You are not authorized to perform this action" })
    }
    try {
        const user_id = req.user.id;

        const unreadCount = await db.MessageStatus.count({
            where: {
                message_to: user_id,
                message_status: 'unread',
            }
        });

        return res.status(200).json({
            status: 1,
            message: "Unread count retrieved successfully",
            unreadCount
        });
    } catch (error) {
        console.error("Error retrieving unread count:", error);
        return res.status(500).json({
            status: 0,
            message: "Internal server error",
            error: error.message,
        });
    }
};

module.exports = {
    getLessonChatMessages,
    createLessonChat,
    sendGroupMessage,
    unreadCount
}
