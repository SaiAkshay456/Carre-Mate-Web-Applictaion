import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: [true, "Company Name is required field"],
        minLength: [3, "Minimum Length is 3"],
        maxLength: [52, "Maximum length is 52"]

    },
    title: {
        type: String,
        required: [true, "Title is required field"],
        minLength: [3, "Minimum Length is 3"],
        maxLength: [52, "Maximum length is 52"]
    },
    description: {
        type: String,
        required: [true, "description is required field"],
        maxLength: [300, "Maximum 300 words"]
    },
    category: {
        type: String,
        required: [true, "category is required field"],
        maxLength: [300, "Maximum length is 52"]
    },
    country: {
        type: String,
        required: [true, "country is required field"],
    },
    city: {
        type: String,
        required: [true, "city is required field"],
    },
    location: {
        type: String,
        required: true
    },
    fixedSalary: {
        type: String,
        minLength: [4, "must exceed 4"]
    },
    salaryFrom: {
        type: String,

    },
    salaryTo: {
        type: String,
    },
    expired: {
        type: Boolean,
        default: false

    },
    postedOn: {
        type: Date,
        default: Date.now,
    },
    postedBy: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    }

})

const jobModel = mongoose.model("jobModel", jobSchema);

export default jobModel;