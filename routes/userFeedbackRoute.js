import express from "express"
import { isAuthorized } from "../middleware/auth.js";
import { getAllUserFeedback, postFeedbackUser } from "../controllers/userFeedBackController.js";

const router = express.Router();

router.route("/post/feedack").post(isAuthorized, postFeedbackUser);

router.route("/getuserfeedback").get(getAllUserFeedback);
export default router;