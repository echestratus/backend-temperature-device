const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
    const verifyOptions = {
        expiresIn: '24h',
        issuer: 'Users'
    }
    return jwt.sign({
        data: payload
    }, process.env.SECRET_KEY, verifyOptions);
}

const generateRefreshToken = (payload) => {
    const verifyOptions = {
        expiresIn: '24h',
        issuer: 'Users'
    }
    return jwt.sign({
        data: payload
    }, process.env.SECRET_KEY, verifyOptions);
}

module.exports = {
    generateToken,
    generateRefreshToken
}