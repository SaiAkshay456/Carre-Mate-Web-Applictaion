import mongoose, { model } from "mongoose";
import validator from "validator";
const userFeedackSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "Name is required"]
    },
    email: {
        type: String,
        trim: true,
        validate: validator.isEmail,
    },
    rating: {
        type: Number,
        required: [true, "Rating is Must"]
    },
    comment: {
        type: String,
        required: true, // Optional field
        minlength: [4, 'Comment must be at least 4 characters long'], // Minimum 10 chars
        maxlength: [500, 'Comment cannot exceed 500 characters'], // Maximum 500 chars
        trim: true
    }

},
    { timestamps: true })

const userFeedackModel = mongoose.model("userFeedBackModel", userFeedackSchema);


export default userFeedackModel;