export class Errorhandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode
    }
}

export const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || "Internal server error";
    err.statusCode = err.statusCode || 500;
    if (err.name === "CastError") {
        const message = `Resource not found`;
        err = new Errorhandler(message, 500);
    }
    if (err.code === 11000) {
        const message = `objects keys ${Object.keys(err.keyValue)}`;
        err = new Errorhandler(message, 400);
    }
    if (err.name === "JsonWebTokenError") {
        const message = `jwt token invalid`
        err = new Errorhandler(message, 400);
    }
    if (err.name === "TokenExpiredError") {
        const message = `Token session expired`
        err = new Errorhandler(message, 400);
    }
    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    })
}

