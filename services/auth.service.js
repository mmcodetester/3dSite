const jwt = require('jsonwebtoken')
const RepositoryBase = require('../controllers/common/repository.base')
const User = require('../models/user.model')
require('dotenv').config()
const secretKey = process.env.SECRET_KEY
const repo = new RepositoryBase(User)

exports.GenerateToken = (user) => {
    let payload = {
        id: user.id,
        role_id: user.role_id
    }
    return jwt.sign(payload, secretKey, { expiresIn: '10h' });
}

exports.AuthGuard = (req, res, next) => {
    // authroization : Bearer token
    const authHeader = req.headers['authorization'];
    const tokenHeader = authHeader && authHeader.split(' ')
    if (!tokenHeader || tokenHeader.length < 2) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = tokenHeader[1]
    if (!token) {
        return res.status(401);
    }
    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.user = user;
        next();
    })
}
exports.GetLoggedInUser = async (req) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return null;

        const tokenParts = authHeader.split(' ');
        if (tokenParts.length !== 2) return null;

        const token = tokenParts[1];


        const payload = jwt.verify(token, secretKey);

        if (!payload?.id) return null;

        req.user = payload;

        const user = await repo.getById({ id: payload.id });

        return user;

    } catch (error) {
        return null;
    }
};