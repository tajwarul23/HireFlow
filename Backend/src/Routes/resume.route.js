import express from "express";
import { verifyToken } from "../Middlewares/Auth.middleware.js";
import {
  createResume,
  deleteResumeById,
  getAllResume,
  getResumeById,
} from "../Controllers/resume.controller.js";
import { aiLimiter } from "../Middlewares/rateLimit.middleware.js";

const resumeRouter = express.Router();

/**
 * @route POST /api/resume/
 * @description generate new report on the basis of user's data
 * @access Private
 */

resumeRouter.post("/", verifyToken, aiLimiter, createResume);

/**
 * @route GET /api/resume/
 * @description get all all resume of the user
 * @access Private
 */
resumeRouter.get("/", verifyToken, getAllResume);

/**
 * @route GET /api/resume/:resumeId
 * @description get specific resume by id
 * @access Private
 */
resumeRouter.get("/:resumeId", verifyToken, getResumeById);
/**
 * @route DELETE /api/resume/:resumeId
 * @description delete specific resume by id
 * @access Private
 */
resumeRouter.delete("/:resumeId", verifyToken, deleteResumeById);

export default resumeRouter;
