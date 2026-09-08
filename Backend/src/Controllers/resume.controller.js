import { generateResume } from "../services/ai.service.js";
import resumeTemplate from "../Templates/resumeTemplate.js";
import { generatePDFFromPage, warmUpPage } from "../services/generatePDF.js";
import {uploadPDF} from "../services/uploadPDF.js";
import { ResumeModel } from "../Models/resume.model.js";
import mongoose from "mongoose";
import {convert} from "html-to-text"
// import { success } from "zod";

/**
 * @description controller to generate resume based on user form data
 *
 */
export const createResume = async (req, res) => {
  try {
    const resumeData = req.body;
    if (!resumeData || Object.keys(resumeData).length === 0) {
      return res.status(400).json({
        message: "Resume data is required to generate resume",
        success: false,
      });
    }

    const userName = resumeData?.fullName;

    
    const [resumeByAi, warmPage] = await Promise.all([
      generateResume(resumeData),
      warmUpPage(),
    ]);
    
    
    
    
    if (!resumeByAi) {
      await warmPage.close(); 
      return res.status(500).json({
        message: "Failed to generate resume using AI. Please Try Again.",
        success: false,
      });
    }

    const resumeTitle = resumeByAi.title; 

    const html = resumeTemplate(resumeByAi);
    const rawText = convert(html);
    // console.log("RawText", rawText);
    
    
    const { pdfBuffer, thumbnailBuffer } = await generatePDFFromPage(warmPage, html);

    if (!pdfBuffer || !thumbnailBuffer) {
      return res.status(500).json({
        message: "Failed to generate PDF. Please try again.",
        success: false,
      });
    }

 
    const resume = await ResumeModel.create({
      user: req.user.id,
      title: resumeTitle,
      resumeUrl: null,
      publicId: null,
      thumbnailUrl: null,
      thumbnailPublicId: null,
      rawText,
      ...resumeByAi,
      atsScore: resumeByAi.atsScore,
      isSaving: true, 
    });

    
    res.status(201).json({
      message: "Resume Generated Successfully",
      resume: {
        ...resumeByAi,
        _id: resume._id,     
        title: resumeTitle,
        resumeUrl: null,      
        thumbnailUrl: null,   
        isSaving: true,       
      },
      success: true,
    });

    // Everything below runs AFTER the response is sent
    // Headers are locked — we can only log errors, not send new responses
    try {
      const { resumeUrl, publicId, thumbnailUrl, thumbnailPublicId } =
        await uploadPDF(pdfBuffer, thumbnailBuffer, userName);

      // Patch the existing record with real Cloudinary URLs
      await ResumeModel.findByIdAndUpdate(resume._id, {
        resumeUrl,
        publicId,
        thumbnailUrl,
        thumbnailPublicId,
        isSaving: false, 
      });

      console.log("Background save complete:", resumeUrl);
    } catch (backgroundError) {
      // Can't send a response — headers already sent
      // Mark as failed so frontend poll can show a "Save failed" state
      await ResumeModel.findByIdAndUpdate(resume._id, {
        isSaving: false,
        saveFailed: true,
      });
      console.error("Background save failed:", backgroundError.message);
    }

  } catch (error) {
    if (res.headersSent) return; // guard — background errors can't send responses

    if (error.status === 429) {
      return res.status(429).json({
        message: "AI service is busy. Please try again in a few seconds",
        success: false,
      });
    }

    console.error("Error in createResume:", error);
    return res.status(500).json({
      message: "Failed to create Resume. Please Try Again in some time",
      success: false,
    });
  }
};

/**
 * @description controller to get the specific resume by id
 */
export const getResumeById = async (req, res) => {
  const { resumeId } = req.params;
  if (!resumeId) {
    return res.status(400).json({
      message: "Resume ID is required",
      success: false,
    });
  }
  try {
    const resumeById = await ResumeModel.findOne({
      _id: resumeId,
    });
    if (!resumeById) {
      return res.status(404).json({
        message: "No resume found for this specification",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Resume Fetched successfully",
      success: true,
      resumeById,
    });
  } catch (error) {
    console.log("Error in getResumeById", error.message);
    return res
      .status(401)
      .json({ message: "Failed to fetched User Resume", success: false });
  }
};

/**
 * @description controller to get all resume for the specific user
 */
export const getAllResume = async (req, res) => {
  try {
    const allResume = await ResumeModel.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    if (!allResume.length) {
      return res
        .status(200)
        .json({ message: "No resumes found", success: true, allResume: [] });
    }
    return res.status(200).json({
      message: "Successfully Fetched all resume for the user",
      allResume,
      success: true,
    });
  } catch (error) {
    console.log("error in all resume", error.message);
    return res
      .status(401)
      .json({ message: "Failed to fetch resume", success: false });
  }
};

/**
 * @description controller to delete a specific resume by id
 */
export const deleteResumeById = async (req, res) => {
  const { resumeId } = req.params;
  if (!resumeId) {
    return res.status(400).json({
      message: "Resume ID is required",
      success: false,
    });
  }
  try {
    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(400).json({
        message: "Invalid resume ID",
        success: false,
      });
    }
    const resume = await ResumeModel.findOneAndDelete({
      _id: resumeId,
      user: req.user.id,
      //add cloudinary delete
    });

    if (!resume) {
      return res
        .status(404)
        .json({ message: "Resume not found", success: false });
    }
    return res
      .status(200)
      .json({ message: "Resume Deleted Successfully", success: true });
  } catch (error) {
    console.log("error in deleting resume by id", error.message);
    return res
      .status(401)
      .json({ message: "Failed to delete resume", success: false });
  }
};
