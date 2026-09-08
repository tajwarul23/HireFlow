import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    recruiterReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecruiterReport",
    },

    status: {
  type: String,
  enum: [
    "applied",
    "interview",
    "shortlisted",
    "rejected",
    "hired"
  ],
  default: "applied",
},
    recruiterReportStatus: {
      type: String,
      enum: [ "generating", "generated", "failed"],
      default: "generating",
    },
    recruiterMessage: { type: String },
    statusUpdatedAt: { type: Date },

    matchScore:{
      type:Number,
      default:0
    }
  },
  { timestamps: true },
);

// one application per candidate per job — prevents duplicate applies
applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });
applicationSchema.index({ job: 1, status: 1 }); // recruiter's applicant list, filtered by status
applicationSchema.index({ company: 1, matchScore: -1 }); // recruiter's company-wide applicant list, sorted by match
applicationSchema.index({ candidate: 1, createdAt: -1 }); // candidate's own applications, newest first

export const applicationModel = mongoose.model(
  "Application",
  applicationSchema,
);
