import express from "express";
import { authorizeRoles, verifyToken } from "../Middlewares/Auth.middleware.js";
import { createJobController, deleteJobController, generateJobDescriptionController, getCompanyJobFeedController, getJobFeedController, updateJobController } from "../Controllers/Job.controller.js";
import { requireCompanyScope } from "../Middlewares/Role.middleware.js";
import { aiLimiter } from "../Middlewares/rateLimit.middleware.js";


const jobRouter = express.Router();


/**
 * @route POST /api/job/create
 * @description post a job opening
 * @access Private [company_admin || recruiter]
 */
jobRouter.post("/create", verifyToken, authorizeRoles("company_admin", "recruiter"), createJobController);

/**
 * @route POST /api/job/generate-description
 * @description route for ai generated description
 * @access Private [company_admin || recruiter]
 */
jobRouter.post("/generate-description", verifyToken, authorizeRoles("company_admin", "recruiter"), aiLimiter, generateJobDescriptionController)


/**
 * @route GET /api/job
 * @description Get all open job opening
 * @access Private [for all user]
 */
jobRouter.get("/", verifyToken, getJobFeedController)

/**
 * @route GET /api/job/company
 * @description Get all jobs for specific company
 * @access Private [company_admin || recruiter]
 */
jobRouter.get("/company", verifyToken, authorizeRoles("company_admin", "recruiter"), getCompanyJobFeedController)
/**
 * @route PATCH /api/job/:jobId
 * @description update a specific job
 * @access Private [company_admin || recruiter]
 */
jobRouter.patch("/:jobId", verifyToken, authorizeRoles("company_admin", "recruiter"), requireCompanyScope, updateJobController)
/**
 * @route DELETE /api/job/:jobId
 * @description delete a specific job
 * @access Private [company_admin || recruiter]
 */
jobRouter.delete("/:jobId", verifyToken, authorizeRoles("company_admin", "recruiter"), requireCompanyScope, deleteJobController)

export default jobRouter;