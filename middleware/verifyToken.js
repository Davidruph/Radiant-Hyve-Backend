const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const jwtSecretKey = process.env.JWT_SECRET_KEY;

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({ message: 'Authentication failed - Token missing on header' });
        }

        const token = authHeader.split(' ')[1];
        // Verify the token using the JWT secret key
        jwt.verify(token, jwtSecretKey, async (err, decodedToken) => {
            if (err) {
                return res
                    .status(401)
                    .json({ status: 0, message: "Token is not valid!" });
            }
            console.log("Middleware token:-", token, decodedToken)
            let User = await db.User.findOne({ where: { id: decodedToken.id } });
            if (!User) {
                return res.status(401).json({ status: 0, message: "You are not authenticated!" });
            }
            if (User.is_block == true) {
                return res.status(401).json({ status: 0, message: "You are block by admin!" });
            }
            const tokens = await db.Token.findByPk(decodedToken.token_id);
            if (!tokens) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            req.user = User;
            next();
        });
    } catch (error) {
        console.error('Error verifying JWT:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
};

const verifyGuestToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        console.log("verifyGuestToken", authHeader)
        if (!authHeader) {
            return next()
        }

        const token = authHeader.split(' ')[1];
        if (token == 'null') {
            return next()
        }
        // Verify the token using the JWT secret key
        jwt.verify(token, jwtSecretKey, async (err, decodedToken) => {
            if (err) {
                return res
                    .status(401)
                    .json({ status: 0, message: "Token is not valid!" });
            }
            let User = await db.User.findOne({ where: { id: decodedToken.id } });
            if (!User) {
                return res.status(401).json({ status: 0, message: "You are not authenticated!" });
            }
            const tokens = await db.Token.findByPk(decodedToken.token_id);
            console.log(decodedToken)
            if (!tokens) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            req.user = User;
            next();
        });
    } catch (error) {
        console.error('Error verifying JWT:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
};
module.exports = { verifyToken, verifyGuestToken };