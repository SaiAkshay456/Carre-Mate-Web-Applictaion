import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { Errorhandler } from "../middleware/error.js";
import { applicationModel } from "../models/applicationSchema.js";
import jobModel from "../models/jobSchema.js";
import fs from "fs";
import cloudinary from "../server.js";
import axios from "axios";
import fetch from "node-fetch";
import path from "path";
import { preprocess, cosineSimilarity } from "../utils/extractDetails.js"
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import natural from "natural";
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();
// import pdfjsLib from 'pdfjs-dist/es5/build/pdf.js'; // Correct import path for legacy build

// Function to fetch and parse the PDF from Cloudinary URL
const extractTextFromPdf = async (pdfUrl) => {
    try {
        // Fetch the PDF document from Cloudinary URL
        const response = await fetch(pdfUrl);
        const pdfBuffer = await response.buffer();

        // Load the PDF document using the legacy build of pdf.js
        const loadingTask = pdfjsLib.getDocument(pdfBuffer);
        const pdf = await loadingTask.promise;

        let extractedText = "";

        // Loop through all the pages of the PDF
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Extract text from each page
            const pageText = textContent.items.map(item => item.str).join(' ');
            extractedText += pageText + '\n';
        }

        return extractedText;

    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        return "";
    }
};

// Example usage







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
        return next(new Errorhandler(" cannot access this resource", 400));
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
    if (role === 'Employer') {
        return next(new Errorhandler("You can't access this resource", 300));
    }

    const userId = req.user?._id;
    const { name, email, phone, address, jobId, coverLetter } = req.body;

    if (!name || !email || !phone || !address || !jobId) {
        return next(new Errorhandler("Please fill all required fields", 302));
    }

    const job = await jobModel.findById(jobId);
    if (!job) {
        return next(new Errorhandler("Job not found", 400));
    }

    const employerId = {
        user: job.postedBy,
        role: "Employer"
    };
    const applicantId = {
        user: userId,
        role: "JobSeeker"
    };

    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    // ✅ Fix: Use resource_type "auto" instead of "raw"
    const result = await cloudinary.uploader.upload(file.path, {
        folder: 'resumes',
        resource_type: 'raw', // ← This allows proper serving of PDFs
        public_id: file.filename,
        type: "upload"
    });

    fs.unlink(file.path, (err) => {
        if (err) {
            console.error("Error deleting local file:", err);
        } else {
            console.log("Local file deleted:", file.path);
        }
    });

    const resumeText = await extractTextFromPdf(result.secure_url);

    let jobDescription = job.description;
    let resumeDescription = resumeText;

    tfidf.addDocument(preprocess(jobDescription).join(' '));
    tfidf.addDocument(preprocess(resumeDescription).join(' '));
    // Cosine similarity

    let jdVector;
    let resumeVector;
    jdVector = tfidf.listTerms(0).map(t => t.tfidf);
    resumeVector = tfidf.listTerms(1).map(t => t.tfidf);

    let score = cosineSimilarity(jdVector, resumeVector);
    const jdKeywords = new Set(preprocess(jobDescription));
    const resumeKeywords = new Set(preprocess(resumeDescription));

    const intersection = [...jdKeywords].filter(word => resumeKeywords.has(word));
    const keywordScore = intersection.length / jdKeywords.size;
    const finalScore = (score * 0.7 + keywordScore * 0.3) * 100; // percentage
    console.log(finalScore)
    let applicationData;
    let application;
    if (finalScore > 70) {
        applicationData = {
            name,
            email,
            phone,
            address,
            resume: {
                public_id: result.public_id,
                url: result.secure_url
            },
            employerId,
            applicantId,
            jobId
        };

        if (coverLetter) {
            applicationData.coverLetter = coverLetter;
        }

        application = await applicationModel.create(applicationData);
        if (!application) {
            return next(new Errorhandler("Error submitting application", 300));
        }
        res.status(200).json({
            success: true,
            message: "Application submitted successfully",
            application: application || null,
            finalScore
        });
    }
    else {
        res.status(200).json({
            success: true,
            message: "Application not successfully",
            application: application || null,
            finalScore
        });
    }
});

