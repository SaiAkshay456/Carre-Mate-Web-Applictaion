import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { Errorhandler } from "../middleware/error.js";
import userFeedackModel from "../models/userFeedbackSchema.js";


export const postFeedbackUser = catchAsyncError(async (req, res, next) => {
    const { name, comment, rating, email } = req.body;

    if (!name || !comment || !rating) {
        return next(new Errorhandler("Please fill Details", 400));
    }

    const feedbackOfUser = await userFeedackModel.create({ name, comment, rating });
    if (!feedbackOfUser) {
        return next(new Errorhandler("feedbackuser glitch", 400))
    }
    res.status(200).json({
        success: true,
        message: "ThankYou for You Sight!!"
    })
})

export const getAllUserFeedback = catchAsyncError(async (req, res, next) => {
    const feedbacksOfUser = await userFeedackModel.find();
    console.log(feedbacksOfUser)
    res.status(200).json({
        success: true,
        usersFeed: feedbacksOfUser
    })
})