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
    feedback: {
        techicalSkills: {
            type: Number
        },
        communication: {
            type: Number
        },
        problemSolving: {
            type: Number
        },
        experince: {
            type: Number
        }
    },
    considered: {
        type: Boolean,
        required: true
    }
}, { timestamps: true })

const feedBackModel = mongoose.model("feedBackModel", feedbackSchema);

export default feedBackModel;