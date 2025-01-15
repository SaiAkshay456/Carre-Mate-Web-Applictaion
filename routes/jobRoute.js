import express from "express";
import { deleteJob, getAllJobs, getMyJobs, getSingleJob, postJob, updateJob } from "../controllers/jobController.js";
import { isAuthorized } from "../middleware/auth.js";

const router = express.Router();

router.route("/getalljobs").get(getAllJobs);

router.route("/postjob").post(isAuthorized, postJob);
router.route("/getmyjobs").get(isAuthorized, getMyJobs);
router.route("/updatejob/:id").put(isAuthorized, updateJob);
router.route("/deletejob/:id").delete(isAuthorized, deleteJob);
router.route("/:id").get(isAuthorized, getSingleJob);
export default router;