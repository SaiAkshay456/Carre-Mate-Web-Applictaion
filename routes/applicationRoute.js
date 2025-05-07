
import express from "express";
import { isAuthorized } from "../middleware/auth.js";
import path from "path";
// import { upload } from "../server.js"
import { employerGetAllApplications, jobSeekerDeleteApplication, jobSeekerGetAllApplications, postApplication } from "../controllers/applicationController.js";
import multer from 'multer';
import crypto from "crypto";
const router = express.Router();

function generateUniqueHexFilename(originalName) {
    const hex = crypto.randomBytes(16).toString("hex"); // Generates 32-character hex
    const ext = path.extname(originalName); // Extracts the file extension
    return `${hex}${ext}`;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // You can set a temporary folder for storing files
    },
    filename: (req, file, cb) => {
        let uniqueFilName = generateUniqueHexFilename(file.originalname);
        cb(null, uniqueFilName);
    }
});

const upload = multer({
    storage: storage, limits: { fileSize: 5 * 1024 * 1024 },
});

router.route("/empApplications").get(isAuthorized, employerGetAllApplications)

router.route("/jobseekerApplications").get(isAuthorized, jobSeekerGetAllApplications);

router.route("/deleteApplication/:id").delete(isAuthorized, jobSeekerDeleteApplication);

router.route("/post").post(isAuthorized, upload.single('resume'), postApplication);

export default router;  