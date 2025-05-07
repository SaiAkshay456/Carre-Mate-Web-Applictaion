import express from "express";
import { isAuthorized } from "../middleware/auth.js";
import { deleteInterview, generateInterviewFeedback, generateQuestions, getAllInterviewFeedbacks, getAllInterviews, getFeedback, getInterviewDetails, postInterview } from "../controllers/generateQuestions.js";

const router = express.Router();

router.route("/generate-questions").post(isAuthorized, generateQuestions);

router.route("/post-interview").post(isAuthorized, postInterview)

router.route("/join-interview/:id").get(getInterviewDetails);

router.route("/interview-feedback").post(generateInterviewFeedback);

router.route("/all/interviews").get(isAuthorized, getAllInterviews);

router.route("/delete/:interview_id").delete(isAuthorized, deleteInterview);

router.route("/interview-feedback/:id").get(isAuthorized, getAllInterviewFeedbacks)

router.route("/interview-feedback/report/:id").get(isAuthorized, getFeedback)

export default router;