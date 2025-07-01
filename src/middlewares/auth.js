const createHttpError = require('http-errors');
const jwt = require('jsonwebtoken');

const protected = (req, res, next) => {
    try {
        // Authorization using Bearer token header
        // const authorizationValue = req.headers.authorization;
        // if (authorizationValue) {
        //     const token = authorizationValue.split(" ")[1];
        //     const decoded = jwt.verify(token, process.env.SECRET_KEY);
        //     req.decoded = decoded;
        //     next();
        // } else {
        //     return next(createHttpError(401, "Token Needed"));
        // }

        // Authorization directly using cookies in express
        const token = req.cookies.token; // token stored in HttpOnly cookie named 'token'
        if (!token) return next(createHttpError(401, "Token Needed")); // Unauthorized
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.decoded = decoded;
        next();
      
    } catch (err) {
        console.error(err);
        next(createHttpError(400, err.message));
    }
}

module.exports = {
    protected
}