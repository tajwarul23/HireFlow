import mongoose from "mongoose";
import { applicationModel } from "../Models/application.model.js";
import { interviewReportModel } from "../Models/interviewReport.model.js";
import { JobModel } from "../Models/job.model.js";
import { RecruiterReportModel } from "../Models/recruiterReport.model.js";
import { ResumeModel } from "../Models/resume.model.js";
import {
  generateAnalyzePrepReport,
  generateInterviewReport,
  generateRecruiterReport,
} from "../services/ai.service.js";
import { resumeResolveForRequest } from "../services/resolveResume.js";
import { uploadPDF } from "../services/uploadPDF.js";
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import asyncHandler from "../Utils/asyncHandler.js";
import { sendApplicationStatusEmail } from "../services/email.service.js";
import { application } from "express";
import { createNotification } from "../services/createNotification.js";
import { userModel } from "../Models/user.model.js";
import { NotificationModel } from "../Models/notification.model.js";

/**
 * @name applyToJobController
 * @description candidate will apply to job
 * @access Private [candidate only]
 */

export const applyToJobController = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (req.user.company) {
    throw new ApiError(401, "Can't apply to a job with recruiter account");
  }

  const job = await JobModel.findById(jobId).select(
    "_id company description skills title",
  );

  if (!job) {
    throw new ApiError(404, "No job found");
  }

  const resume = await resumeResolveForRequest(req);

  let application;

  try {
    application = await applicationModel.create({
      candidate: req.user.id,
      job: job._id,
      resume: resume._id,
      company: job.company,
      status: "applied",
      recruiterReportStatus: "generating",
    });
    await JobModel.findByIdAndUpdate(job._id, { $inc: { applicantsCount: 1 } });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "You have already applied for this job");
    }

    throw error;
  }

  // Send response immediately
  res
    .status(201)
    .json(new ApiResponse(201, application, "Applied to job successfully"));

  //send notification to the company_admin and recruiter
  const recipients = await userModel.find({company:job.company, role:{$in:["recruiter", "company_admin"]}}).select("_id");

  if(recipients.length > 0){
    await NotificationModel.insertMany(
      recipients.map((r)=>({
        recipient: r._id,
        type: "NEW_APPLICATION",
        message:`${req.user.userName} applied for ${job.title}`,
        title:"New Application Received"

      }))
    )
  }


  // Generate report asynchronously
  generateRecruiterReport(resume.rawText, job.description, job.skills)
    .then(async (recruiterReport) => {
      const report = await RecruiterReportModel.create({
        candidate: req.user.id,
        job: job._id,
        application: application._id,
        resume: resume._id,

        ...recruiterReport,
      });

      await applicationModel.findByIdAndUpdate(application._id, {
        recruiterReport: report._id,
        recruiterReportStatus: "generated",
        matchScore: report.matchScore,
      });

      // console.log("Generated recruiter report", report);
    })
    .catch(async (error) => {
      console.error("Recruiter report generation failed:", error.message);

      await applicationModel.findByIdAndUpdate(application._id, {
        recruiterReportStatus: "failed",
      });
    });
});

/**
 * @name getCandidateAllApplicationController
 * @description candidate will get all the application details
 * @access Private [candidate only]
 */

export const getCandidateApplicationsController = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sort = "newest", job } = req.query;

    const filter = { candidate: req.user.id };

    if (status !== undefined) {
      filter.status = status;
    }

    if (job !== undefined) {
      filter.job = job;
    }

    const sortOption = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    // cap page size so a caller can't force an unbounded fetch via ?limit=
    const pageSize = Math.min(Number(limit) || 10, 100);

    const skip = Number(page - 1) * pageSize;

    const [applications, totalApplications] = await Promise.all([
      applicationModel
        .find(filter)
        .populate({
          path: "candidate",
          select: "userName email",
        })
        .populate({
          path: "job",
          select: "title description employmentType workMode companyName",
        })
        .populate({
          path: "resume",
          select: "title resumeUrl thumbnailUrl",
        })

        .sort(sortOption)
        .skip(skip)
        .limit(pageSize),

      applicationModel.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          applications,
          pagination: {
            totalApplications,
            currentPage: Number(page),
            totalPage: Math.ceil(totalApplications / pageSize),
            limit: pageSize,
            hasNextPage:
              Number(page) < Math.ceil(totalApplications / pageSize),
            hasPreviousPage: Number(page) > 1,
          },
        },
        "Applications Fetched successfully",
      ),
    );
  } catch (error) {
    console.log("error in getCompanyApplicationController", error.message);
    throw new ApiError(501, "Error getting company applications");
  }
};

/**
 * @name getCompanyApplicationsController
 * @description recruiter will get all the application details
 * @access Private [company_admin || recruiter]
 */

export const getCompanyApplicationsController = async (req, res) => {
  try {
    const { status, job, sort = "newest", page = 1, limit = 20 } = req.query;

    const filter = {
      company: req.user.company,
    };

    if (status !== undefined) {
      filter.status = status;
    }

    if (job !== undefined) {
      filter.job = job;
    }

    const pageSize = Math.min(Number(limit) || 20, 100);
    const skip = Number(page - 1) * pageSize;

    const [applications, totalApplications] = await Promise.all([
      applicationModel
        .find(filter)
        .populate({
          path: "candidate",
          select: "userName email",
        })
        .populate({
          path: "job",
          select: "title description employmentType workMode",
        })
        .populate({
          path: "resume",
          select: "title resumeUrl thumbnailUrl",
        })
        .populate({
          path: "recruiterReport",
          select:
            "skillGaps weaknesses strengths executiveSummary hiringRecommendation matchScore",
        })
        .sort({matchScore:-1})
        .skip(skip)
        .limit(pageSize)
        .lean(),

      applicationModel.countDocuments(filter),
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            applications,
            pagination: {
              totalApplications,
              currentPage: Number(page),
              totalPage: Math.ceil(totalApplications / pageSize),
              limit: pageSize,
              hasNextPage:
                Number(page) < Math.ceil(totalApplications / pageSize),
              hasPreviousPage: Number(page) > 1,
            },
          },
          "Applications fetched successfully",
        ),
      );
  } catch (error) {
    console.log("error in getCompanyApplicationController", error.message);

    throw new ApiError(501, "Error getting company applications");
  }
};

/**
 * @name getCompanyApplicantListByJobIdController
 * @description recruiter will get all the applicant details by specific job id
 * @access Private [company_admin || recruiter]
 */
export const getCompanyApplicantListByJobIdController = asyncHandler(
  async (req, res) => {},
);
/**
 * @name updateApplicationJobStatusController
 * @description recruiter will update  the application details
 * @access Private [company_admin || recruiter]
 */

export const updateApplicationJobStatusController = asyncHandler(
  async (req, res) => {
    const { applicationId } = req.params;
    const { status, interviewLink, interviewDate, interviewTime } = req.body;
    if (!status) {
      throw new ApiError(401, "Status is required");
    }

    const allowedStatus = [
      "applied",
      "interview",
      "shortlisted",
      "rejected",
      "hired",
    ];
    const allowedTransitions = {
      applied: ["interview", "shortlisted", "rejected"],
      interview: ["shortlisted", "rejected", "hired"],
      shortlisted: ["interview", "hired", "rejected"],
      rejected: [],
      hired: [],
    };
    if (!allowedStatus.includes(status)) {
      throw new ApiError(401, "Invalid status input");
    }
    if (
      status === "interview" &&
      (!interviewLink?.trim() || !interviewDate || !interviewTime?.trim())
    ) {
      throw new ApiError(400, "Interview link, date and time are required");
    }
    if (!mongoose.isValidObjectId(applicationId)) {
      throw new ApiError(400, "Invalid Id");
    }
    const application = await applicationModel
      .findOne({
        _id: applicationId,
        company: req.user.company,
      })
      .select("company status statusUpdatedAt candidate job")
      .populate({
        path: "candidate",
        select: "userName email",
      })
      .populate({
        path: "job",
        select: "title",
      })
      .populate({
        path: "company",
        select: "companyName",
      });

    if (!application) {
      throw new ApiError(404, "No application found");
    }
    if (String(application.company._id) !== String(req.user.company)) {
      throw new ApiError(401, "Unauthorized access to the resource");
    }

    const currentStatus = application.status;

    const allowedNextStatuses = allowedTransitions[currentStatus] || [];

    if (!allowedNextStatuses.includes(status)) {
      throw new ApiError(
        403,
        `Cannot move application from ${currentStatus} to ${status}`,
      );
    }

    application.status = status;
    application.statusUpdatedAt = new Date();

    await application.save();

   

     res
      .status(200)
      .json(
        new ApiResponse(200, application, "Job status updated successfully"),
      );


       await sendApplicationStatusEmail({
      to: application.candidate.email,
      candidateName: application.candidate.userName,
      jobTitle: application.job.title,
      companyName: application.company.companyName,
      status,
      interviewLink,
      interviewDate,
      interviewTime,
    });

    await createNotification({
      recipient:application.candidate,
      type:"APPLICATION_STATUS_UPDATED",
      title:"Application Status Updated",
      message:
        status === "interview"
          ? `You've been called for an interview for ${application.job.title} on ${interviewDate} at ${interviewTime}. Join here: ${interviewLink}`
          : `Your application for ${application.job.title} has been moved to ${application.status}`,
    })
  },
);

/**
 * @name analyzePrepController
 * @description get interview report against a job description and a resume
 * @access Private [candidate only]
 */
export const analyzePrepController = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (req.user.company) {
    throw new ApiError(401, "Can't apply to a job with recruiter account");
  }

  const job = await JobModel.findById(jobId).select(
    "_id company description skills",
  );

  if (!job) {
    throw new ApiError(404, "No job found");
  }

  const resume = await resumeResolveForRequest(req);
  // console.log("from application controller", job.description);

  const interviewReportByAi = await generateAnalyzePrepReport(
    resume.rawText,
    job.description,
    job.skills,
  );

  if (!interviewReportByAi) {
    return res.status(400).json({
      message: "Failed to generate interview report. Please try again later",
      success: false,
    });
  }
  const interviewReport = await interviewReportModel.create({
    ...interviewReportByAi,
    source: "application",
    user: req.user.id,
    resume: resume.rawText,
    jobDescription: job.description,
    job: job._id,
  });

  return res.status(201).json({
    message: "Interview Report Generated successfully",
    interviewReport,
    success: true,
  });
});
