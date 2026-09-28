import express from "express";
import { authorizeRoles, verifyToken } from "../Middlewares/Auth.middleware.js";
import upload from "../Middlewares/File.middleware.js";
import { analyzePrepController, applyToJobController, getCandidateApplicationsController, getCompanyApplicationsController, updateApplicationJobStatusController } from "../Controllers/Application.controller.js";
import { requireCompanyScope } from "../Middlewares/Role.middleware.js";
import { aiLimiter, applyLimiter } from "../Middlewares/rateLimit.middleware.js";

const applicationRouter = express.Router();

/**
 * @route POST /api/application/:jobId
 * @description Apply to a job
 * @access Private [candidate only]
 */

applicationRouter.post("/:jobId", verifyToken, authorizeRoles("candidate"), applyLimiter, upload.single("resume"), applyToJobController)

/**
 * @route GET /api/application/
 * @description Get all application for candidate
 * @access Private [candidate only]
 */

applicationRouter.get("/", verifyToken, authorizeRoles("candidate"), getCandidateApplicationsController)

/**
 * @route GET/api/application/company?query [ex:GET /api/application/company?status=applied&job=687a2&page=1&limit=20&sort=newest]
 * @description get all application for company
 * @access Private ["company_admin", "recruiter"]
 */
applicationRouter.get("/company", verifyToken, authorizeRoles("company_admin", "recruiter"), getCompanyApplicationsController)


/**
 * @route PATCH /api/application/:applicationId
 * @description update the job status of the application
 * @access Private ["company_admin", "recruiter"]
 */
applicationRouter.patch("/:applicationId", verifyToken, authorizeRoles("company_admin", "recruiter"), updateApplicationJobStatusController)

/**
 * @route POST /api/application/:jobId
 * @description generate report for analyze&prep
 * @access Private ["candidate"]
 */
applicationRouter.post("/analyze/:jobId", verifyToken, authorizeRoles("candidate"),aiLimiter, upload.single("resume"), analyzePrepController)


export default applicationRouter;