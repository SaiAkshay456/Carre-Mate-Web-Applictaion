import jwt from "jsonwebtoken";
import { catchAsyncError } from "./catchAsyncError.js";
import { Errorhandler } from "./error.js";
import User from "../models/user.js";

export const isAuthorized = catchAsyncError(async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return next(new Errorhandler("Token not found", 400));
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log(decode);

    req.user = await User.findById(decode.id)

    next();

})