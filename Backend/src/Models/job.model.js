import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    skills: [
      {
        type: String,
      },
    ],

    location: String,

    workMode: {
      type: String,
      enum: ["REMOTE", "HYBRID", "ONSITE"],
      default: "ONSITE",
    },

    employmentType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"],
      default: "FULL_TIME",
    },

    experienceLevel: {
      type: String,
      enum: ["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD"],
    },

    salary: {
      salaryMin: Number,
      salaryMax: Number,
      currency: {
        type: String,
        default: "USD",
      },
    },

    status: {
      type: String,
      enum: ["DRAFT", "OPEN", "CLOSED"],
      default: "OPEN",
    },
    vacancy: {
      type: Number,
      required: true,
    },

    normalizedTitle: {
      type: String,
      required: true,
    },

    applicantsCount:{
      type:Number,
      default:0
    },

    deadline: Date,
  },
  { timestamps: true },
);
//cursor pagination
jobSchema.index({ status: 1, createdAt: -1, _id: -1 });

//for unique job per company
jobSchema.index(
  {
    company: 1,
    normalizedTitle: 1,
  },
  { unique: true },
);
//for text search
jobSchema.index({
  title: "text",
  skills: "text",
  description:"text",
  companyName: "text",
  location: "text",
});

//for filtering
jobSchema.index({ workMode: 1, employmentType: 1, experienceLevel: 1 });

//for company job feed, sorted newest first
jobSchema.index({ company: 1, createdAt: -1 });

jobSchema.pre("validate", function (next) {
  if (
    this.salary?.salaryMax !== undefined &&
    this.salary?.salaryMin !== undefined &&
    this.salary.salaryMax < this.salary.salaryMin
  ) {
    return next(
      new Error("Minimum salary cannot be greater than maximum salary"),
    );
  }
  next();
});

export const JobModel = mongoose.model("Job", jobSchema);
