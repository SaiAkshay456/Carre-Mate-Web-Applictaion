import jwt from "jsonwebtoken";
import { catchAsyncError } from "./catchAsyncError.js";
import { Errorhandler } from "./error.js";
import User from "../models/user.js";

export const isAuthorized = catchAsyncError(async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return next(new Errorhandler("You Need to Resgister", 400));
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decode.id).select('-password');
    if (!req.user) {
        return next(new Errorhandler("user not found", 400))
    }
    next();
})