import { applicationModel } from "../Models/application.model.js";
import { CompanyModel } from "../Models/company.model.js";
import { JobModel } from "../Models/job.model.js";
import { userModel } from "../Models/user.model.js";
import {
  deleteFromCloudinary,
  uploadCompanyLogo,
} from "../services/uploadPDF.js";
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import asyncHandler from "../Utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { sendCompanyInviteEmail } from "../services/email.service.js";
import { createNotification } from "../services/createNotification.js";
import mongoose from "mongoose";

const buildInviteLink = (companyId) => {
  const inviteToken = jwt.sign(
    {
      companyId,
      type: "company_invite",
    },
    process.env.INVITATION_TOKEN_SECRET,
    { expiresIn: "1d" },
  );

  const clientUrl =
    process.env.NODE_ENV === "production"
      ? "https://hireflow-dev.vercel.app"
      : "http://localhost:5173";

  return `${clientUrl}/onboarding/company?token=${inviteToken}`;
};
/**
 * @name createCompanyController
 * @description RECRUITER only, creator become company_admin
 * @access Private
 */
export const createCompanyController = asyncHandler(async (req, res) => {
  const { companyName, aboutCompany, industry, country } = req.body;
  const logo = req.file;

  if (
    !companyName?.trim() ||
    !aboutCompany?.trim() ||
    !logo ||
    !industry?.trim() ||
    !country?.trim()
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedCompany = await CompanyModel.findOne({ companyName });
  if (existedCompany) {
    throw new ApiError(400, "Company already exist.");
  }
  if (req.user.company) {
    throw new ApiError(
      401,
      "You're already part of a company. Leave it first to create a new one.",
    );
  }
  const uploadedLogo = await uploadCompanyLogo(logo.buffer, companyName);
  const company = await CompanyModel.create({
    companyName,
    aboutCompany,
    logoUrl: uploadedLogo.logoUrl,
    logoPublicId: uploadedLogo.publicId,
    industry,
    country,
    createdBy: req.user.id,
  });
  const updatedUser = await userModel.findByIdAndUpdate(
    req.user.id,
    {
      role: "company_admin",
      company: company._id,
      joinedAt: new Date(),
    },
    { new: true },
  );

  const newToken = jwt.sign(
    {
      id: updatedUser._id,
      userName: updatedUser.userName,
      role: updatedUser.role,
      company: updatedUser.company,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.cookie("token", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
  return res.status(201).json(
    new ApiResponse(201, company, "Company Created Successfully", {
      updatedUser,
    }),
  );
});

/**
 * @name generateInviteController
 * @description company_admin generates a shareable invite link for their company
 * @access Private (company_admin)
 */
export const generateInviteController = asyncHandler(async (req, res) => {
  const inviteLink = buildInviteLink(req.user.company);

  return res
    .status(200)
    .json(new ApiResponse(200, inviteLink, "Your invite link"));
});

/**
 * @name inviteByEmailController
 * @description company_admin sends a shareable invite link directly to a recruiter's email
 * @access Private (company_admin)
 */
export const inviteByEmailController = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email?.trim()) {
    throw new ApiError(400, "Email is required");
  }

  const inviteLink = buildInviteLink(req.user.company);

  await sendCompanyInviteEmail({
    to: email.trim(),
    companyName: req.company.companyName,
    inviterName: req.user.userName,
    inviteLink,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, `Invite sent to ${email.trim()}`));
});

/**
 * @name joinCompanyController
 * @description join the company with an invited link
 * @access Firebase auth needed
 */
export const joinCompanyController = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw new ApiError(400, "Invite token is required");
  let decoded = jwt.verify(token, process.env.INVITATION_TOKEN_SECRET);
  if (!decoded) throw new ApiError(400, "Invalid or expired invite link");
  if (decoded.type !== "company_invite")
    throw new ApiError(400, "Invalid invite token");

  const company = await CompanyModel.findById(decoded.companyId);
  if (!company) throw new ApiError(404, "Company not found");

  if (
    req.user.company &&
    req.user.company.toString() !== company._id.toString()
  ) {
    throw new ApiError(400, "You are already associated with a company.");
  }

  const updatedUser = await userModel.findOneAndUpdate(
    { _id: req.user.id, company: { $ne: company._id } },
    {
      role: "recruiter",
      company: company._id,
      joinedAt: new Date(),
    },
    { new: true },
  );

  if (!updatedUser) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          req.user,
          `Already a member of ${company.companyName}`,
        ),
      );
  }

  const newToken = jwt.sign(
    {
      id: updatedUser._id,
      userName: updatedUser.userName,
      role: updatedUser.role,
      company: updatedUser.company,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.cookie("token", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });

  //send notification to the company admin
  const companyAdmin = await userModel
    .findOne({ company: company._id, role: "company_admin" })
    .select("_id");

  if (companyAdmin) {
    await createNotification({
      recipient: companyAdmin._id,
      type: "COMPANY_MEMBER_JOINED",
      title: "New team member joined",
      message: `${req.user.userName} joined the company`,
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser,
        `Joined ${company.companyName} successfully`,
      ),
    );
});

/**
 * @name updateCompanyController
 * @description update the company info
 * @access Private (company admin only)
 */
export const updateCompanyController = asyncHandler(async (req, res) => {
  const { companyName, aboutCompany, country, industry } = req.body;

  const company = await CompanyModel.findById(req.user.company);

  if (!company) {
    throw new ApiError(404, "Company not found");
  }
  if (company.createdBy.toString() !== req.user.id.toString()) {
    throw new ApiError(403, "You are not authorized to update this company");
  }
  const normalizedCompanyName = companyName?.trim();
  const companyNameChanged =
    normalizedCompanyName !== undefined &&
    normalizedCompanyName !== company.companyName;

  if (normalizedCompanyName !== undefined) {
    company.companyName = normalizedCompanyName;
  }

  if (aboutCompany !== undefined) {
    company.aboutCompany = aboutCompany;
  }

  if (country !== undefined) {
    company.country = country;
  }

  if (industry !== undefined) {
    company.industry = industry;
  }

  await company.save();

  if (companyNameChanged) {
    await JobModel.updateMany(
      {
        company: company._id,
      },
      {
        $set: {
          companyName: company.companyName,
        },
      },
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { company }, "Company updated successfully"));
});

/**
 * @name updateCompanyLogoController
 * @description update the company logo
 * @access Private (company admin only)
 */
export const updateCompanyLogoController = async (req, res) => {
  try {
    const logo = req.file;
    if (!req.file) {
      throw new ApiError(401, "Logo file is required");
    }

    if (!req.file.mimetype.startsWith("image/")) {
      throw new ApiError(400, "Only image files are allowed");
    }

    const company = await CompanyModel.findById(req.user.company);

    if (!company) {
      throw new ApiError(404, "Company not found");
    }

    if (String(company.createdBy) !== String(req.user.id)) {
      throw new ApiError(403, "You are not authorized to update this company");
    }

    const newLogo = await uploadCompanyLogo(logo.buffer, company.companyName);
    const oldLogoPublicId = company.logoPublicId;
    company.logoUrl = newLogo.logoUrl;
    company.logoPublicId = newLogo.publicId;
    await company.save();
    if (oldLogoPublicId) {
      deleteFromCloudinary(oldLogoPublicId).catch((err) => {
        console.log("Error deleting old logo", err.message);
      });
    }
    return res
      .status(201)
      .json(new ApiResponse(201, company, "Logo updated successfully"));
  } catch (error) {
    console.log("Error on updating logo", error.message);
    throw new ApiError(501, "Error on updating logo");
  }
};

/**
 * @name getCompanyController
 * @description get Company info
 * @access Private (company_admin || recruiter )
 */

export const getCompanyController = asyncHandler(async (req, res) => {
  if (!req.company) {
    return res.status(404).json({
      message: "Company not found",
    });
  }
  const company = req.company;

  const [applicationLength, employeeDetails] = await Promise.all([
    applicationModel.countDocuments({
      company: req.company._id,
    }),
    CompanyModel.aggregate([
      {
        $match: {
          _id: req.company._id,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "company",
          as: "employees",
          pipeline: [
            {
              $project: {
                userName: 1,
                email: 1,
                role: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          employeeCount: { $size: "$employees" },
        },
      },
    ]),
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { company, applicationLength, employeeDetails },
        "Company data fetched successfully",
      ),
    );
});

/**
 * @name leaveCompanyController
 * @description leave the company
 * @access Private (company_admin || recruiter )
 */
export const leaveCompanyController = asyncHandler(async (req, res) => {
  if (!req.company) {
    throw new ApiError(404, "Company not found");
  }

  if (req.user.role === "company_admin") {
    const oldestEmployee = await userModel
      .findOne({
        company: req.company._id,
        role: "recruiter",
      })
      .sort({ joinedAt: 1 });

    if (oldestEmployee) {
      oldestEmployee.role = "company_admin";
      await oldestEmployee.save();
      const company = await CompanyModel.findById(req.company._id);
      company.createdBy = oldestEmployee._id;
      await company.save();
    }
    if (!oldestEmployee) {
      throw new ApiError(
        400,
        "There are no other members in this company. To leave, you must delete the company first.",
      );
    }
    const updatedUser = await userModel
      .findOneAndUpdate(
        {
          _id: req.user._id,
          company: req.company._id,
        },
        {
          $set: {
            role: "pending_recruiter",
            company: null,
          },
        },
        { new: true },
      )
      .select("-password");

    if (!updatedUser) {
      throw new ApiError(500, "Error leaving the company");
    }
    //send notification to the new admin
    await createNotification({
      recipient: oldestEmployee._id,
      message: "You've been promoted to company admin",
      title: "Promoted to Company Admin",
      type: "PROMOTED_TO_COMPANY_ADMIN",
    });
    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Left the company successfully"));
  }
  const updatedUser = await userModel
    .findOneAndUpdate(
      {
        _id: req.user.id,
        company: req.company._id,
      },
      {
        $set: {
          role: "pending_recruiter",
          company: null,
        },
      },
      { new: true },
    )
    .select("-password");

  if (!updatedUser) {
    throw new ApiError(500, "Error leaving the company");
  }

  //send notification to the admin
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Left the company successfully"));
});

/**
 * @name removeEmployeeController
 * @description admin can remove employee (recruiter)
 * @access Private (company_admin )
 */
export const removeEmployeeController = asyncHandler(async (req, res) => {
  const company = await CompanyModel.findById(req.user.company);

  if (!company) {
    throw new ApiError(404, "Company not found");
  }

  if (String(company.createdBy) !== String(req.user.id)) {
    throw new ApiError(403, "You are not authorized to update this company");
  }
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  if (String(userId) === String(req.user.id)) {
    throw new ApiError(400, "Wrong user id");
  }

  const updatedUser = await userModel
    .findOneAndUpdate(
      {
        _id: userId,
        company: company._id,
      },
      {
        $set: {
          role: "pending_recruiter",
          company: null,
        },
      },
      { new: true },
    )
    .select("-password");
  if (!updatedUser) {
    throw new ApiError(500, "Failed to remove employee");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Employee removed successfully"));
});

/**
 * @name aboutCompanyController
 * @description all can view aboutCompany to know company details
 * @access all authenticated user
 */
export const aboutCompanyController = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid Company ID",
        success: false,
      });
    }
    const company = await CompanyModel.findById(companyId).select(
      "industry country aboutCompany",
    );
    if (!company) {
      return res
        .status(404)
        .json({ message: "Company Not Found", success: false });
    }

    return res
      .status(200)
      .json({ message: "About Company Fetched", company, success: true });
  } catch (error) {
    console.log("Error fetching about company", error.message);
    return res
      .status(500)
      .json({ message: "Failed to fetch about company", success: false });
  }
};
