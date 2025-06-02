import mongoose from "mongoose";
import validator from "validator";

const feedbackSchema = new mongoose.Schema({
    interview_id: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: [true, "username is must"],
        trim: true,
    },
    userEmail: {
        type: String,
        required: [true, "username is must"],
        trim: true,
        validate: validator.isEmail,
    },
    rating: {
        technicalSkills: {
            type: Number
        },
        communication: {
            type: Number
        },
        problemSolving: {
            type: Number
        },
        experience: {
            type: Number
        }
    },
    considered: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
}, { timestamps: true })

const feedBackModel = mongoose.model("feedBackModel", feedbackSchema);

export default feedBackModel;