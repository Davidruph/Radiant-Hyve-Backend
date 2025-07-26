const  db  = require("../config/db")
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require("uuid");


exports.checkToken = async (data, user_id) => {
    let tokenData = {
        user_id: user_id,
        device_id: data.device_id,
        device_token: data.device_token,
        device_type: data.device_type,
        refresh_token: uuidv4(), token_expire_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
    var token = await db.Token.findOne({ where: { device_id: data.device_id , user_id } })

    if (token) {
        await db.Token.update({ device_token: data.device_token, device_type: data.device_type, user_id }, { where: { device_id: data.device_id, user_id } })
        // await token.destroy()
    } else {
        token = await db.Token.create(tokenData)
    }
    console.log("userid", user_id);

    var jwtToken = jwt.sign({
        user_id: user_id,
        token_id: token.id
    }, `${process.env.JWT_SECRET_KEY}`, { expiresIn: '1d' });

    return {
        token: jwtToken,
        refresh_token: token.refresh_token,
    }
}

// exports.checkToken = async (data, user_id) => {
//     let tokenData = {
//         user_id: user_id,
//         device_id: data.device_id,
//         device_token: data.device_token,
//         device_type: data.device_type,
//         user_role: data.user_role,
//     }
//     var token = await db.Token.findOne({ where: { user_role: data.user_role, device_id: data.device_id } })
//     if (token) {
//         await db.Token.update({ device_token: data.device_token, device_type: data.device_type, user_id }, { where: { id: token.id } })
//     } else {
//         token = await db.Token.create(tokenData)
//     }
//     console.log("userid", user_id);

//     const jwtToken = jwt.sign({
//         id: user_id,
//         token_id: token.id
//     }, `${process.env.JWT_SECRET_KEY}`);

//     return jwtToken
// }