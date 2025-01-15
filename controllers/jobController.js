import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { Errorhandler } from "../middleware/error.js";
import jobModel from "../models/jobSchema.js";


export const getAllJobs = catchAsyncError(async (req, res, next) => {
    const jobs = await jobModel.find({ expired: false })
    if (!jobs) {
        return next(new Errorhandler("All jobs are expired", 301))
    }
    res.status(200).json({
        success: true,
        jobs,
    })
})
export const postJob = catchAsyncError(async (req, res, next) => {
    const { role } = req.user;
    if (role === "JobSeeker") {
        return next(new Errorhandler(`user with this ${role} cannot post job`, 301))
    }
    const { companyName, title, city, category, country, location, fixedSalary, salaryFrom, salaryTo, description } = req.body;
    if (!title || !city || !category || !country || !location || !description || !companyName) {
        return next(new Errorhandler(`Fill the details properly`, 301))
    }
    if (!salaryFrom && !salaryTo && !fixedSalary) {
        return next(new Errorhandler("provide salary information", 302));
    }
    if ((!salaryFrom && salaryTo) || (!salaryFrom && salaryTo)) {
        return next(new Errorhandler("provide salaryFrom or To properly", 302));
    }
    if (salaryFrom && salaryTo && fixedSalary) {
        return next(new Errorhandler("provide either fixed salary or range of salary ", 302));
    }
    const postedBy = req.user._id;
    const postedName = req.user.firstName
    const jobs = await jobModel.create({
        title, city, category, country, location, fixedSalary, salaryFrom,
        salaryTo, description, postedBy, companyName
    })
    res.status(200).json({
        success: true,
        message: "Job posted successfully",
        jobs,
        postedName
    })

})


export const getMyJobs = catchAsyncError(async (req, res, next) => {
    const { role } = req.user;

    if (role === "JobSeeker") {
        return next(new Errorhandler(`${role} cannot access this resource`, 302));
    }
    const jobs = await jobModel.find({ postedBy: req.user._id });
    if (!jobs) {
        return next(new Errorhandler("You have'nt posted jobs till", 300))
    }
    res.status(200).json({
        success: true,
        jobs
    })
})


export const updateJob = catchAsyncError(async (req, res, next) => {

    const { role } = req.user;
    if (role === "JobSeeker") {
        return next(new Errorhandler(`${role} cannot access this resource`, 300))
    }
    const { id } = req.params;

    let updated = await jobModel.findById(id);

    if (!updated) {
        return next(new Errorhandler("Job not found with id", 300));
    }

    updated = await jobModel.findByIdAndUpdate(id, req.body, { new: true, runValidator: true, useFindAndModify: false })
    res.status(200).json({
        success: true,
        message: "successfully updated!",
        updated
    })


})

export const deleteJob = catchAsyncError(async (req, res, next) => {
    const { role } = req.user;
    if (role === "JobSeeker") {
        return next(new Errorhandler(`${role} cannot access this resource`, 300))
    }

    const { id } = req.params;

    let job = await jobModel.findById(id);
    if (!job) {
        return next(new Errorhandler(`cannot find job with id`, 300))
    }
    await job.deleteOne();
    res.status(200).json({
        success: true,
        messaage: "Deleted true"
    })
})

export const getSingleJob = catchAsyncError(async (req, res, next) => {
    const { id } = req.params
    const job = await jobModel.findById(id);
    if (!job) {
        return next(new Errorhandler("No job available", 302))
    }
    console.log(job)
    res.status(200).json({
        success: true,
        job,

    })
})