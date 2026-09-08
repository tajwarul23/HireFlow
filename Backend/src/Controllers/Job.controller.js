/**
 * @name createJobController
 * @description RECRUITER only, creating job opening
 * @access Private
 */

import mongoose from "mongoose";
import { CompanyModel } from "../Models/company.model.js";
import { JobModel } from "../Models/job.model.js";
import { userModel } from "../Models/user.model.js";
import { generateJobDescription } from "../services/ai.service.js";
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import asyncHandler from "../Utils/asyncHandler.js";

/**
 * @name createJobController
 * @description Recruiter post job opening
 * @access Private [company_admin || recruiter]
 */

export const createJobController = asyncHandler(async (req, res) => {
  const dbUser = req.user;
  if (!req.company) {
    throw new ApiError(404, "You must belong to a company");
  }
  const dbCompany = req.company;

  const {
    title,
    skills,
    location,
    workMode,
    employmentType,
    experienceLevel,

    description,
    status,
    deadline,
    vacancy,
    salary,
  } = req.body;
  const { salaryMin, salaryMax, currency } = salary;
  if (
    !title?.trim() ||
    !location?.trim() ||
    !description?.trim() ||
    !workMode?.trim() ||
    !employmentType?.trim() ||
    !experienceLevel?.trim() ||
    !status?.trim() ||
    !currency?.trim() ||
    !salaryMin ||
    !salaryMax ||
    !deadline ||
    !Array.isArray(skills) ||
    skills.length === 0
  ) {
    console.log(req.body);

    throw new ApiError(400, "All fields are required");
  }
  const cleanedSkills = skills.map((skill) => skill.trim()).filter(Boolean);

  if (!cleanedSkills.length) {
    throw new ApiError(400, "At least one valid skill is required.");
  }
  const normalizedTitle = title.trim().toLowerCase();
  const existedJob = await JobModel.findOne({
    normalizedTitle,
    company: dbCompany._id,
  });
  if (existedJob) {
    throw new ApiError(401, "This job was already created..");
  }

  const createdJob = await JobModel.create({
    title,
    skills: cleanedSkills,
    location,
    workMode,
    employmentType,
    experienceLevel,
    salary: {
      salaryMin: salaryMin,
      salaryMax: salaryMax,
      currency: currency,
    },

    status,
    deadline,
    description,
    vacancy,
    normalizedTitle,
    postedBy: dbUser._id,
    company: dbCompany._id,
    companyName: dbCompany.companyName,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, createdJob, "Job posted successfully"));
});

/**
 * @name generateJobDescriptionController
 * @description generate job description using ai
 * @access Private [company_admin || recruiter]
 */

export const generateJobDescriptionController = asyncHandler(
  async (req, res) => {
    const { title, experienceLevel, workMode, employmentType, skills } =
      req.body;

    if (
      !title?.trim() ||
      !workMode?.trim() ||
      !employmentType?.trim() ||
      !experienceLevel?.trim() ||
      !Array.isArray(skills) ||
      skills.length === 0
    ) {
      throw new ApiError(400, "All fields are required");
    }
    if (!req.company) {
      throw new ApiError(404, "You must belong to a company");
    }
    const { companyName, aboutCompany } = req.company;
    const cleanedSkills = skills.map((skill) => skill.trim()).filter(Boolean);

    if (!cleanedSkills.length) {
      throw new ApiError(400, "At least one valid skill is required.");
    }

    const jobDescriptionByAi = await generateJobDescription(
      title,
      experienceLevel,
      workMode,
      employmentType,
      cleanedSkills,
      companyName,
      aboutCompany,
    );
    if (!jobDescriptionByAi) {
      throw new ApiError(
        501,
        "Failed to generate AI generated job description",
      );
    }
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          jobDescriptionByAi,
          "Job description successfully generated",
        ),
      );
  },
);

/**
 * @name getJobFeedController
 * @description Job feed for all user
 * @access Private
 */
export const getJobFeedController = asyncHandler(async (req, res) => {
  const {
    limit = 20,
    cursor,
    q,
    location,
    workMode,
    employmentType,
    experienceLevel,
  } = req.query;

  const pageSize = Math.min(Number(limit), 50);

  const query = { status: "OPEN" };

  // Cursor pagination

  if (cursor) {
    let decodedCursor;
    try {
      decodedCursor = JSON.parse(cursor);
    } catch (error) {
      throw new ApiError(400, "Invalid cursor");
    }
    const { createdAt, id } = decodedCursor;

    if (!createdAt || !id) {
      throw new ApiError(400, "Invalid Cursor");
    }
    query.$or = [
      {
        createdAt: {
          $lt: new Date(createdAt),
        },
      },

      {
        createdAt: new Date(createdAt),

        _id: {
          $lt: id,
        },
      },
    ];
  }

  //search
  if (q && q.trim()) {
    const searchTerm = q.trim().replace(/\s+/g, "");
    query.$text = {
      $search: searchTerm,
      $caseSensitive: false,
      $diacriticSensitive: false,
    };
  }

  //filters
  if (location) {
    query.location = {
      $regex: location,

      $options: "i",
    };
  }

  if (workMode) {
    query.workMode = workMode.toUpperCase();
  }

  if (employmentType) {
    query.employmentType = employmentType.toUpperCase();
  }

  if (experienceLevel) {
    query.experienceLevel = experienceLevel.toUpperCase();
  }

  const candidateId = new mongoose.Types.ObjectId(req.user.id);

  const jobs = await JobModel.aggregate([
    {
      $match: query,
    },
    {
      $sort: {
        createdAt: -1,
        _id: -1,
      },
    },
    {
      $limit: pageSize + 1,
    },
    {
      $lookup: {
        from: "applications",
        let: { jobId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$job", "$$jobId"] },
                  { $eq: ["$candidate", candidateId] },
                ],
              },
            },
          },
          {
            $limit: 1,
          },
        ],

        as: "application",
      },
    },
    {
      $addFields: {
        isApplied: {
          $gt: [{ $size: "$application" }, 0],
        },
      },
    },
    {
      $project: { application: 0 },
    },
  ]);
  const hasMore = jobs.length > pageSize;

  const results = hasMore ? jobs.slice(0, pageSize) : jobs;

  let nextCursor = null;
  if (hasMore) {
    const lastJob = results[results.length - 1];
    nextCursor = JSON.stringify({
      createdAt: lastJob.createdAt,
      id: lastJob._id,
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: results.length, jobs: results, nextCursor, hasMore },
        "Fetched Job Successfully",
      ),
    );
});

/**
 * @name getCompanyController
 * @description get company's all job
 * @access Private [company_admin || recruiter]
 */
export const getCompanyJobFeedController = asyncHandler(async (req, res) => {
  const dbUser = await userModel.findById(req.user.id);
  if (!dbUser) {
    throw new ApiError(401, "No user found");
  }

  if (!dbUser.company) {
    throw new ApiError(400, "User is not associated with any company");
  }

  const { page = 1, limit = 20 } = req.query;

  // cap page size so a caller can't force an unbounded fetch via ?limit=
  const pageSize = Math.min(Number(limit) || 20, 100);
  const skip = Number(page - 1) * pageSize;

  const filter = { company: dbUser.company };

  const [jobs, totalJobs] = await Promise.all([
    JobModel.find(filter)
      .populate({
        path: "postedBy",
        select: "userName _id company",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),

    JobModel.countDocuments(filter),
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          count: totalJobs,
          jobs,
          pagination: {
            totalJobs,
            currentPage: Number(page),
            totalPage: Math.ceil(totalJobs / pageSize),
            limit: pageSize,
            hasNextPage: Number(page) < Math.ceil(totalJobs / pageSize),
            hasPreviousPage: Number(page) > 1,
          },
        },
        "Company Jobs fetched successfully",
      ),
    );
});

/**
 * @name updateJobController
 * @description update a specific job
 * @access Private [company_admin || recruiter]
 */

export const updateJobController = asyncHandler(async (req, res) => {
  const {
    title,
    location,
    workMode,
    employmentType,
    experienceLevel,
    status,
    vacancy,
    deadline,
    salary,
  } = req.body;

  if (title !== undefined) req.job.title = title;
  if (location !== undefined) req.job.location = location;
  if (workMode !== undefined) req.job.workMode = workMode;
  if (employmentType !== undefined) req.job.employmentType = employmentType;
  if (experienceLevel !== undefined) req.job.experienceLevel = experienceLevel;
  if (status !== undefined) req.job.status = status;
  if (vacancy !== undefined) req.job.vacancy = vacancy;
  if (deadline !== undefined) req.job.deadline = deadline;

  if (salary !== undefined) {
    const { salaryMin, salaryMax, currency } = salary;

    if (salaryMin !== undefined) {
      req.job.salary.salaryMin = salaryMin;
    }

    if (salaryMax !== undefined) {
      req.job.salary.salaryMax = salaryMax;
    }

    if (currency !== undefined) {
      req.job.salary.currency = currency;
    }
  }
  if(!req.job.isModified()){
    
  return res
    .status(200)
    .json(new ApiResponse(200, req.job, "No Changes to update"));
  }
  await req.job.save();

  return res
    .status(200)
    .json(new ApiResponse(200, req.job, "Job updated successfully"));
});

/**
 * @name deleteJobController
 * @description delete a specific job
 * @access Private [company_admin || recruiter]
 */

export const deleteJobController = asyncHandler(async (req, res) => {
  await req.job.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Job deleted successfully"));
});
