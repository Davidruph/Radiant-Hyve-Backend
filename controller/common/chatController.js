require('dotenv').config()
const db = require("../../config/db");
const { getIO } = require('../../config/socketSetup');
const fs = require('fs');
const path = require('path');
const { send_notification } = require('../../helpers/notification')
const { Op, Sequelize, where } = require('sequelize');
const { emitToSockets, getUniqueJoinUserIdsByChatId, emitToSocketById } = require(`../../config/socketConfig`);
const { upload_file, deleteFromS3, uploadVideo } = require('../../helpers/s3_upload')


const uploadMediaInChat = async (media, thumbnails, mediaType, mediaText, documentText, messageText) => {
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


const createPersnolChat = async (req, res) => {
    const { chat_to } = req.body;

    if (!chat_to) {
        return res.status(400).json({ message: 'chat_to is required' });
    }
    const chat_by = req.user.id;

    try {
        const sender = await db.User.findByPk(chat_by);
        const receiver = await db.User.findOne({
            where: {
                id: chat_to,
                is_deleted: false,
                is_blocked: false,
                school_id: sender.school_id
            }
        });

        if (!receiver) {
            return res.status(404).json({ status: 0, messsage: 'chat_to user not found.' });
        }

        if (parseInt(chat_to) === parseInt(chat_by)) {
            return res.status(400).json({ status: 0, messsage: 'You cannot create a chat with yourself.' });
        }

        const existingChat = await db.Chat.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    { chat_by: chat_by, chat_to: chat_to },
                    { chat_by: chat_to, chat_to: chat_by }
                ],
                school_id: null
            }
        });

        if (existingChat) {
            return res.status(200).json({ status: 1, messsage: 'Chat created successfully.', chat: existingChat });
        }

        const chat = await db.Chat.create({
            chat_by: chat_by,
            chat_to: parseInt(chat_to),
            school_id: null
        });
        return res.status(201).json({
            status: 1,
            message: "Chat created successfully.",
            chat,
        });
    } catch (error) {
        console.error('Error creating chat:', error);
        return res.status(500).json({
            message: 'Internal server error',
            details: error.message,
        });
    }
};

const getPersonalChats = async (req, res) => {
    const { page } = req.query;
    if (!page) {
        return res.status(400).json({ status: 0, messsage: 'pag is required.' })
    }
    const userId = req.user.id;
    const limit = 10;
    const offset = (page - 1) * limit;
    try {
        // const totalChatsCount = await db.Chat.count({
        //     where: {
        //         school_id: null,
        //         [db.Sequelize.Op.or]: [{ chat_by: userId }, { chat_to: userId }],
        //     },
        //     // group: ["Chat.id"],
        //     //             having: Sequelize.literal(`(
        //     //     SELECT COUNT(*) FROM tbl_message t1
        //     //     WHERE t1.chat_id =  Chat.id
        //     //     AND (
        //     //         (Chat.chat_by = ${userId} AND t1.is_delete_by = false)
        //     //         OR
        //     //         (Chat.chat_to = ${userId} AND t1.is_delete_to = false)
        //     //     )
        //     // ) > 0`)
        // });

        const personalChats = await db.Chat.findAll({
            where: {
                school_id: null,
                [Op.or]: [
                    { chat_by: userId },
                    { chat_to: userId }
                ]
            },
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                              SELECT COUNT(*) FROM tbl_message t2 
                              WHERE t2.chat_id = Chat.id AND t2.message_status = "Unread" 
                              AND t2.message_to = ${userId}
                              )`),
                        "unreadMessagesCount",
                    ],
                    [
                        Sequelize.literal(`(
                              SELECT MAX(chat_messages.createdAt)
                              FROM tbl_message AS chat_messages
                              WHERE chat_messages.chat_id = Chat.id
                                AND (
                            (Chat.chat_by = ${userId} AND chat_messages.is_delete_by = false)
                             OR
                            (Chat.chat_to = ${userId} AND chat_messages.is_delete_to = false)
                            )
                          )`),
                        "latestMessageCreatedAt",
                    ],
                    [
                        Sequelize.literal(`(
                              SELECT u.id
                              FROM tbl_user u
                              WHERE u.id = CASE 
                                  WHEN Chat.chat_by = ${userId} THEN Chat.chat_to
                                  ELSE Chat.chat_by 
                              END
                          )`),
                        "other_id",
                    ],
                    [
                        Sequelize.literal(`(
                              SELECT u.full_name
                              FROM tbl_user u
                              WHERE u.id = CASE 
                                  WHEN Chat.chat_by = ${userId} THEN Chat.chat_to
                                  ELSE Chat.chat_by 
                              END
                          )`),
                        "otherUserFullName",
                    ],
                    [
                        Sequelize.literal(`(
                              SELECT u.profile_pic
                              FROM tbl_user u
                              WHERE u.id = CASE 
                                  WHEN Chat.chat_by = ${userId} THEN Chat.chat_to
                                  ELSE Chat.chat_by 
                              END
                          )`),
                        "otherUserProfileImage",
                    ],
                ],
            },
            include: [
                {
                    model: db.Message,
                    as: "Messages",
                    limit: 1,
                    order: [["createdAt", "DESC"]],
                    required: false,
                },
            ],
            order: [[Sequelize.col("latestMessageCreatedAt"), "DESC"]],
            // group: ["Chat.id"],
            having: Sequelize.literal(`(
                SELECT COUNT(*) FROM tbl_message 
                WHERE tbl_message.chat_id = Chat.id
                 AND (
        (Chat.chat_by = ${userId} AND tbl_message.is_delete_by = false)
                OR
         (Chat.chat_to = ${userId} AND tbl_message.is_delete_to = false)
     )
            ) > 0`),
            limit: limit,
            offset: offset,
        });

        const lessonChat = await db.Chat.findOne({
            where: {
                chat_by: req.user.school_id,
                chat_to: req.user.id,
                school_id: req.user.school_id
            }
        })

        const unreadCount = await db.MessageStatus.count({
            where: {
                message_to: userId,
                message_status: "Unread",
            }
        })

        return res.status(200).json({
            status: 1,
            message: "Chats retrieved successfully",
            lesson_chat_unread_count: unreadCount,
            lesson_chat_id: lessonChat ? lessonChat.id : null,
            // totalChats: totalChatsCount,
            // totalPages: Math.ceil(totalChatsCount / limit),
            currentPage: parseInt(page),
            chats: personalChats,
        });
    } catch (error) {
        console.error('Error fetching personal chats:', error);
        return res.status(500).json({
            status: 0,
            message: 'Internal server error',
            details: error.message,
        });
    }
};

const getChatMessages = async (req, res) => {
    try {
        const { chat_id, page } = req.query;
        if (!chat_id || !page) {
            return res.status(400).json({ status: 0, message: 'chat_id and page is required' })
        }
        let user_id = req.user.id;
        const limit = 10;
        const offset = (page - 1) * limit;


        const chat = await db.Chat.findOne({
            where: {
                id: chat_id,
                [Op.or]: [
                    { chat_by: req.user.id },
                    { chat_to: req.user.id }
                ],
                school_id: null
            },
        });
        console.log('chat', chat)

        if (!chat) {
            return res.status(404).json({ status: 0, message: "Chat not found" });
        }
        await db.Message.update(
            { message_status: "Read" },
            {
                where: {
                    chat_id,
                    message_to: user_id,
                },
            }
        );

        let whereCondition = {}

        if (chat.chat_by == user_id) {
            whereCondition = {
                chat_id,
                is_delete_by: false,
                school_id: null,
            }
        }
        else if (chat.chat_to == user_id) {
            whereCondition = {
                chat_id,
                is_delete_to: false,
                school_id: null,
            }
        }

        const messages = await db.Message.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: db.User,
                    as: "sendermessage",
                    attributes: ["id", "full_name", "profile_pic", "role"],
                },
            ],
            distinct: true,
            col: "id",
            order: [["createdAt", "DESC"]],
            limit: limit,
            offset: offset,
        });

        return res.status(200).json({
            status: 1,
            message: "Get chat messages successfully",
            totalMessages: messages.count,
            totalPages: Math.ceil(messages.count / limit),
            currentPage: parseInt(page),
            is_blocked: chat.get('is_blocked'),
            data: messages.rows,
        });
    } catch (error) {
        console.error("ERROR", error);
        return res.status(500).json({ status: 0, message: "Something went wrong", error: error.message });
    }
};


const sendMessage = async (req, res) => {
    const { chat_id, message_type, other_id, file_name, media_text, message_text } = req.body;
    const message_by = req.user.id;

    if (message_by === parseInt(other_id)) {
        return res.status(400).json({
            status: 0,
            message: "You cannot send a message to yourself."
        });
    }

    const chat = await db.Chat.findOne({
        where: {
            id: chat_id,
            [Op.or]: [
                { chat_by: message_by, chat_to: other_id },
                { chat_by: other_id, chat_to: message_by }
            ],
            school_id: null
        }
    });

    if (!chat) {
        return res.status(404).json({
            status: 0,
            message: "Invalid chat. The chat does not exist or is not valid for the users."
        });
    }
    const sender = await db.User.findByPk(message_by);
    const receiver = await db.User.findByPk(other_id);
    if (!receiver) {
        return res.status(404).json({ status: 0, message: "User not found" });
    }
    const allowedMessageTypes = ["Text", "Image", "Video", "Document", "Audio", "Video/Text", "Image/Text"];

    const messageTypes = Array.isArray(message_type) ? message_type : message_type ? JSON.parse(message_type) : [];

    if (messageTypes.some(type => !allowedMessageTypes.includes(type))) {
        return res.status(400).json({
            status: 0,
            message: "Invalid message type. Allowed types are: Text, Image, Video, Document,Audio,Video/Text,Image/Text"
        });
    }

    try {
        let clientsInRoom = 0

        let { uniqueJoinUserIds, enrichedSenderTokens, enrichedReceiverTokens, allSocketsWithTokens } = await getUniqueJoinUserIdsByChatId(chat_id, message_by);
        try {
            const room = getIO().sockets.adapter.rooms.get(parseInt(chat_id));
            // console.log("uniqueJoinUserIds, enrichedSenderTokens, enrichedReceiverTokens, allSocketsWithTokens", uniqueJoinUserIds, enrichedSenderTokens, enrichedReceiverTokens, allSocketsWithTokens)
            if (room) {
                clientsInRoom = room.size;
                console.log("clientsInRoom in sendMessage", clientsInRoom);
            } else {
                console.log(`Room ${parseInt(chat_id)} does not exist`);
            }
        } catch (error) {
            console.log("Error checking socket room", error);
        }



        const mediaTextArray = Array.isArray(media_text) ? media_text : media_text ? JSON.parse(media_text) : [];
        const fileNameArray = Array.isArray(file_name) ? file_name : file_name ? JSON.parse(file_name) : [];
        const messageTypes = Array.isArray(message_type) ? message_type : message_type ? JSON.parse(message_type) : [];

        console.log("mediaTextArray", mediaTextArray, fileNameArray, messageTypes)
        console.log("mediaTextArray", mediaTextArray[0], mediaTextArray[1])
        let arrayOfMedias = await uploadMediaInChat(req.files.media, req.files.thumbnail, messageTypes, mediaTextArray, fileNameArray, message_text)
        console.log("arrayOfMedias", arrayOfMedias)
        if (arrayOfMedias.length > 0) {
            arrayOfMedias.map(async media => {
                let messageData = {
                    message_by,
                    chat_id,
                    message_type: media.message_type,
                    message_to: other_id,
                    message_status: uniqueJoinUserIds && uniqueJoinUserIds.length == 2 ? "Read" : "Unread",
                    message_text: media.image,
                    thumbnail: media.thumbnail,
                    media_text: media.media_text,
                    file_name: media.file_name,
                };

                const message = await db.Message.create(messageData);
                const data = await db.Message.findOne({
                    where: { id: message.id },
                    include: [
                        {
                            model: db.User,
                            as: "sendermessage",
                            attributes: ["id", "full_name", "profile_pic", "role"],
                        },
                    ],
                });
                try {
                    await getIO().to(parseInt(data.chat_id)).emit("new_message", data);
                    console.log(`NEW MESSAGE EMIT: ${JSON.stringify(data)}`);
                } catch (error) {
                    console.log(`NEW MESSAGE EMIT NOT SENT`, error);
                }

                if (enrichedReceiverTokens.length > 0) {
                    let chatDetails = await getChatDetails(data);
                    // let unreadCount = await unreadChatCount(data.message_to);
                    enrichedReceiverTokens.map(async (token) => {
                        if (token.is_join_room == false) {
                            try {
                                await emitToSocketById(token.socket_id, "count_update", chatDetails);
                                // await emitToSocketById(token.socket_id, "unread_chat_count", unreadCount);
                                console.log(`count_update receiver: ${JSON.stringify(chatDetails)}`);
                            } catch (error) {
                                console.log("COUNT UPDATE EMIT NOT SENT FOR RECEIVER : error", error);
                            }
                        }
                        if (token.is_join_room == false || token.socket_id == null) {
                            const text = media.message_type == 'Text' ? (media.image.length > 50 ? `${media.image.substring(0, 50)}...` : media.image) : `sent you an attachment 📎`;
                            const notiType = "chat";
                            const message = {
                                title: "New Message Received",
                                body: `💬 ${ data.sendermessage.full_name}: ${text} (Tap to reply).`,
                            };
                            const Data = {
                                chat_id: data.chat_id,
                                other_id: data.message_to,
                                user_id: data.message_by,
                                fullname: data.sendermessage.full_name,
                                profile_image: data.sendermessage.profile_pic,
                                notiType: notiType,
                                role: data.sendermessage.role,

                            };
                            await send_notification(messageData.message_to, message, notiType, Data);
                        }
                    })
                }
                if (enrichedSenderTokens.length > 0) {
                    let chatDetails = await getChatDetails(data);
                    enrichedSenderTokens.map(async (token) => {
                        if (token.is_join_room == false && token.socket_id != null) {
                            try {
                                await emitToSocketById(token.socket_id, "count_update", chatDetails);
                                console.log(`count_update sender: ${JSON.stringify(chatDetails)}`);
                            } catch (error) {
                                console.log("COUNT UPDATE EMIT NOT SENT TO SENDER: error", error);
                            }
                        }
                    })
                }
            })
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

async function getChatDetails(messageData) {
    const userId = messageData.message_to;
    return await db.Chat.findOne({
        where: { id: messageData.chat_id },
        attributes: {
            include: [
                [
                    Sequelize.literal(`(
                          SELECT COUNT(*) FROM tbl_message t2 
                          WHERE t2.chat_id = Chat.id AND t2.message_status = "Unread" 
                          AND t2.message_to = ${userId}
                          )`),
                    "unreadMessagesCount",
                ],
                [
                    Sequelize.literal(`(
                          SELECT MAX(chat_messages.createdAt)
                          FROM tbl_message AS chat_messages
                          WHERE chat_messages.chat_id = Chat.id
                      )`),
                    "latestMessageCreatedAt",
                ],
                [
                    Sequelize.literal(`(
                          SELECT u.id
                          FROM tbl_user u
                          WHERE u.id = CASE 
                              WHEN Chat.chat_by = ${userId} THEN Chat.chat_to
                              ELSE Chat.chat_by 
                          END
                      )`),
                    "other_id",
                ],
                [
                    Sequelize.literal(`(
                          SELECT u.full_name
                          FROM tbl_user u
                          WHERE u.id = CASE 
                              WHEN Chat.chat_by = ${userId} THEN Chat.chat_to
                              ELSE Chat.chat_by 
                          END
                      )`),
                    "otherUserFullName",
                ],
                [
                    Sequelize.literal(`(
                          SELECT u.profile_pic
                          FROM tbl_user u
                          WHERE u.id = CASE 
                              WHEN Chat.chat_by = ${userId} THEN Chat.chat_to
                              ELSE Chat.chat_by 
                          END
                      )`),
                    "otherUserProfileImage",
                ],
            ],
        },
        include: [
            {
                model: db.Message,
                as: "Messages",
                limit: 1,
                order: [["createdAt", "DESC"]],
            },
        ],
    });
}

const chatUserList = async (req, res) => {
    try {
        const { page, search } = req.query
        if (!page) {
            return res.status(400).json({ status: 0, messsage: "page is required" })
        }

        const limit = 10
        const offset = (page - 1) * limit

        const whereCondition = {
            school_id: req.user.school_id,
            role: { [Op.ne]: "school" },
            id: { [Op.ne]: req.user.id },
            is_blocked: false,
            is_deleted: false
        }

        if (search) {
            whereCondition[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { role: { [Op.like]: `%${search}%` } }
            ];
        }

        const user = await db.User.findAndCountAll({
            where: whereCondition,
            attributes: ["id", "full_name", "profile_pic", "role"],
            limit,
            offset
        })

        return res.status(200).json({
            status: 1,
            message: 'user retrieved successfully',
            total_user: user.count,
            current_page: parseInt(page),
            totalPage: Math.ceil(user.count / limit),
            data: user.rows
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

const clearChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chat_id } = req.query;

        if (!chat_id) {
            return res.status(400).json({
                status: 0,
                message: "chat_id is required"
            });
        }
        const chat = await db.Chat.findOne({
            where: {
                id: chat_id,
                [Op.or]: [
                    { chat_by: req.user.id },
                    { chat_to: req.user.id }
                ],
                school_id: null
            },
        });

        if (!chat) {
            return res.status(404).json({
                status: 0,
                message: "Chat not found"
            });
        }
        if (chat.chat_by == userId) {
            await db.Message.update(
                { is_delete_by: true },
                {
                    where: {
                        chat_id,
                        [Op.or]: [
                            { message_to: req.user.id },
                            { message_by: req.user.id }
                        ],
                        school_id: null
                    }
                }
            );
        } else if (chat.chat_to == userId) {
            await db.Message.update(
                { is_delete_to: true },
                {
                    where: {
                        chat_id,
                        [Op.or]: [
                            { message_to: req.user.id },
                            { message_by: req.user.id }
                        ],
                        school_id: null
                    }
                }
            );
        }

        return res.status(200).json({
            status: 1,
            message: "Chat cleared successfully"
        });

    } catch (error) {
        console.error("Error clearing chat:", error);
        return res.status(500).json({
            status: 0,
            message: "Internal server error",
            error: error.message
        });
    }
};


module.exports = {
    sendMessage,
    getChatMessages,
    createPersnolChat,
    getPersonalChats,
    clearChat,
    chatUserList,
}


