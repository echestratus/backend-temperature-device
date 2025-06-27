const createHttpError = require('http-errors');
const jwt = require('jsonwebtoken');

const protected = (req, res, next) => {
    try {
        const authorizationValue = req.headers.authorization;
        if (authorizationValue) {
            const token = authorizationValue.split(" ")[1];
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            req.decoded = decoded;
            next();
        } else {
            return next(createHttpError(400, "Token Needed"));
        }
    } catch (err) {
        next(createHttpError(400, err.message));
    }
}

module.exports = {
    protected
}