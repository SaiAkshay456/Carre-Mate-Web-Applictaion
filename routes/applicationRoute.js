
import express from "express";
import { isAuthorized } from "../middleware/auth.js";
import { employerGetAllApplications, jobSeekerDeleteApplication, jobSeekerGetAllApplications, postApplication } from "../controllers/applicationController.js";

const router = express.Router();

router.route("/empApplications").get(isAuthorized, employerGetAllApplications)

router.route("/jobseekerApplications").get(isAuthorized, jobSeekerGetAllApplications);

router.route("/deleteApplication/:id").delete(isAuthorized, jobSeekerDeleteApplication);

router.route("/post").post(isAuthorized, postApplication);

export default router;  