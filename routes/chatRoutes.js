const express = require('express');
const router = express.Router();

const {verifyToken} = require('../middleware/verifyToken');
const {upload} = require("../helpers/storage")

const imageUpload = upload.fields([
  { name: 'profile_pic' },
]);


const chat = require("../controller/common/chatController")
const validator = require("../validator/authValidator")


router.get('/list_user_chat',verifyToken, chat.chatUserList);

router.post('/create_chat', verifyToken, chatValidator.creatChatValidator(),  chat.createPersnolChat);
router.post('/send_message', verifyToken, imageUpload, chatValidator.sendMessageValidator(), verifyToken, chat.sendMessage);
router.get('/get_chat_message',verifyToken, validator.getChatMessages(), chat.getChatMessages)


module.exports = router