import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { Errorhandler } from "../middleware/error.js";
import User from "../models/user.js";
import { sendToken } from "../utils/jwtToken.js";

//register user
export const register = catchAsyncError(async (req, res, next) => {

    const { firstName, lastName, email, role, password } = req.body;

    if (!firstName || !email || !role || !password) {
        return next(new Errorhandler("please fill your details", 401));
    }

    const isEmail = await User.findOne({ email });

    if (isEmail) {
        return next(new Errorhandler(`${email} already exsists`, 402));
    }
    const user = await User.create({ firstName, lastName, email, role, password });
    console.log(user);
    sendToken(user, 200, res, "user registered");

})

//login user
export const login = catchAsyncError(async (req, res, next) => {

    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return next(new Errorhandler("fill your details", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return next(new Errorhandler("Email does not exsists", 400));
    }

    const matchPass = await user.comparePassword(password)

    if (!matchPass) {
        return next(new Errorhandler("Email or password is incorrect", 400))
    }

    if (role != user.role) {
        return next(new Errorhandler(`Role wth ${role} does not exixts`, 400));
    }

    sendToken(user, 200, res, "login successful")
})

//logout user

export const logout = catchAsyncError(async (req, res, next) => {
    res.status(201).cookie("token", "", {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    }).json({
        success: true,
        message: "logged out successfully!",
        email: req.user.email
    })
})

export const getUser = catchAsyncError(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        message: "user fetched true ",
        user
    })
})