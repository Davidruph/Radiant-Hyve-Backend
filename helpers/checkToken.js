const { db } = require("../config/db")
require('dotenv').config()
const jwt = require('jsonwebtoken');

exports.checkToken = async (data, user_id) => {
    let tokenData = {
        user_id: user_id,
        device_id: data.device_id,
        device_token: data.device_token,
        device_type: data.device_type
    }
    var token = await db.Token.findOne({ where: { device_id: data.device_id } })

    if (token) {
        await db.Token.update({ device_token: data.device_token, device_type: data.device_type, user_id }, { where: { device_id: data.device_id } })
        // await token.destroy()
    } else {
        token = await db.Token.create(tokenData)
    }
    console.log("userid", user_id);

    const jwtToken = jwt.sign({
        id: user_id,
        token_id: token.id
    }, `${process.env.JWT_SECRET_KEY}`);

    return jwtToken
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