import express from "express";
import { verifyToken } from "../Middlewares/Auth.middleware.js";
import {
  getInterviewReportByIdController,
  generateInterviewReportController,
  getAllInterviewReportController,
} from "../Controllers/Interview.controller.js";
import upload from "../Middlewares/File.middleware.js";
import { aiLimiter } from "../Middlewares/rateLimit.middleware.js";

const interviewRouter = express.Router();

/**
 * @route POST/api/interview/
 * @description generate new interview report on the basis of user's resume, jobDescription, selfDescription
 * @access Private
 */

interviewRouter.post(
  "/",
  verifyToken,
  aiLimiter,
  upload.single("resume"),
  generateInterviewReportController,
);

/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user
 * @access Private
 * 
 */
interviewRouter.get(
  "/",
  verifyToken,
  getAllInterviewReportController,
);

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId
 * @access Private
 */
interviewRouter.get(
  "/report/:interviewId",
  verifyToken,
  getInterviewReportByIdController,
);




export default interviewRouter;
