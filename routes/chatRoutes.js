const express = require('express');
const router = express.Router();

const {verifyToken} = require('../middleware/verifyToken');
const {upload} = require("../helpers/storage")

const imageUpload = upload.fields([
  { name: 'media' },
  { name: 'thumbnail' }
]);


const chat = require("../controller/common/chatController")
const validator = require("../validator/chatValidator")

const lessonChat = require("../controller/common/groupChatController")


router.get('/list_user_chat',verifyToken, chat.chatUserList);

router.post('/create_personal_chat', verifyToken,  chat.createPersnolChat);
router.post('/send_personal_chat_message', verifyToken, imageUpload, validator.sendMessageValidator(), chat.sendMessage);
router.get('/get_personal_chat_message',verifyToken, validator.getChatMessages(), chat.getChatMessages)
router.get('/get_personal_chats',verifyToken, chat.getPersonalChats)


router.post('/create_lesson_chat', verifyToken,  lessonChat.createLessonChat);
router.post('/send_lesson_chat_message', verifyToken, imageUpload, lessonChat.sendGroupMessage);
router.get('/get_lesson_chat_message',verifyToken, lessonChat.getLessonChatMessages)

module.exports = router