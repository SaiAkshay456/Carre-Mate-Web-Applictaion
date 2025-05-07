import mongoose from "mongoose";
import validator from "validator"

const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "jobModel",
        required: true
    },
    name: {
        type: String,
        required: [true, "Name is must required"],
        minLength: [3, "Name is minimum 3 characters"],
        maxLength: [32, "Name can,t exceed 32 characters"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Name is must required"],
        trim: true,
        validate: [validator.isEmail, "please provide valid email"]
    },
    phone: {
        type: "Number",
        required: [true, "Please provide phone number"],
        minLength: [5, "must exceed 5"]
    },
    coverLetter: {
        type: String,
    },
    address: {
        type: String,
        required: true
    },
    resume: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }

    },
    applicantId: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        role: {
            type: String,
            enum: ["JobSeeker"],
            required: true
        }
    },
    employerId: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        role: {
            type: String,
            enum: ["Employer"],
            required: true
        }

    }

})

export const applicationModel = mongoose.model("application", applicationSchema)

// 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=openrouterkey