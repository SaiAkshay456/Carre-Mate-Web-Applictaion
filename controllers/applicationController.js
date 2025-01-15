import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { Errorhandler } from "../middleware/error.js";
import { applicationModel } from "../models/applicationSchema.js";
import jobModel from "../models/jobSchema.js";
import cloudinary from "cloudinary";

export const employerGetAllApplications = catchAsyncError(async (req, res, next) => {
    const { role } = req.user;
    if (role === "JobSeeker") {
        return next(new Errorhandler(`${role} cannot access this resource`, 400));
    }

    const id = req.user._id;
    const applications = await applicationModel.find({ 'employerId.user': id })
    if (!applications) {
        return next(new Errorhandler("None applications posted", 300))
    }
    res.status(200).json({
        success: true,
        message: "successfully fetched",
        applications
    })
})

export const jobSeekerGetAllApplications = catchAsyncError(async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
        return next(new Errorhandler(`${role} cannot access this resource`, 400));
    }

    const id = req.user._id;
    const applications = await applicationModel.find({ 'applicantId.user': id })
    if (!applications) {
        return next(new Errorhandler("None applications applied", 300))
    }
    res.status(200).json({
        success: true,
        message: "successfully fetched",
        applications
    })
})

export const jobSeekerDeleteApplication = catchAsyncError(async (req, res, next) => {

    const { role } = req.user;
    if (role === "Employer") {
        return next(new Errorhandler(`${role} cannot access this resource`, 400));
    }

    const { id } = req.params;
    const deleteJob = await applicationModel.findById(id);
    if (!deleteJob) {
        return next(new Errorhandler("job not found to delete", 400))
    }
    await deleteJob.deleteOne();
    res.status(200).json({
        success: true,
        message: "application deleted true"
    })

})


export const postApplication = catchAsyncError(async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
        return next(new Errorhandler(`${role} cannot access this resource`, 400));
    }
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new Errorhandler(`Resume file required`, 400));
    }

    const { resume } = req.files;
    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedFormats.includes(resume.mimetype)) {
        return next(new Errorhandler("This format is not allowed.only jpg,png,webp", 300))
    }

    const cloudinaryRes = await cloudinary.uploader.upload(resume.tempFilePath);
    if (!cloudinaryRes || cloudinaryRes.error) {
        console.error("cloudinary error:", cloudinaryRes.error || "unknowun error of cloudinary");
        return next(new Errorhandler("failed to upload resume", 500));
    }
    const { name, email, phone, address, coverLetter, jobId } = req.body;
    const applicantId = {
        user: req.user._id,
        role: "JobSeeker"
    }
    if (!jobId) {
        return next(new Errorhandler("job not found", 400));
    }

    const jobDetails = await jobModel.findById(jobId);
    if (!jobDetails) {
        return next(new Errorhandler("job not found", 401));
    }
    const employerId = {
        user: jobDetails.postedBy,
        role: "Employer"
    }
    if (!name || !email || !phone || !address || !coverLetter || !employerId || !applicantId || !resume) {
        return next(new Errorhandler("please fill details", 400))
    }
    const application = await applicationModel.create({
        name, email, phone, address, coverLetter, employerId, applicantId, resume: {
            public_id: cloudinaryRes.public_id,
            url: cloudinaryRes.secure_url
        }
    })
    res.status(200).json({
        success: true,
        message: "application created",
        application
    })





})