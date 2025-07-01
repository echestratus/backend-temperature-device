const { response } = require('./response');
const createError = require('http-errors');

const requestToken = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (token) {
            return response(res, "succeed", 200, "Token fetched successfully", {token: token});
        } else {
            return next(createError(400, 'No token cookie found'));
        }
    } catch (err) {
        console.error("Something went wrong: ", err);
        return next(createError.InternalServerError());
    }
}

module.exports = {
    requestToken
}