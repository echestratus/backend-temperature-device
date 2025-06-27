
const response = (res, status, statusCode, message, data, pagination) => {
    const printResponse = {
        status: status,
        statusCode: statusCode,
        message: message,
        data: data || ''
    }
    if (pagination) {
        printResponse.pagination = pagination;
    }

    res.status(statusCode).json(printResponse);
}

module.exports = {
    response
}