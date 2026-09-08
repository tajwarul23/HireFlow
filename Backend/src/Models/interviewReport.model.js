import mongoose from "mongoose";


const technicalQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      
    },
    intention: { type: String,  },
    answer: { type: String,  },
  },
  { _id: false },
);

const behavioralQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      
    },
    intention: { type: String, },
    answer: { type: String, },
  },
  { _id: false },
);

const skillGapsSchema = new mongoose.Schema(
  {
    skill: { type: String },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],

    },
  },
  { _id: false },
);

const strengthSchema = new mongoose.Schema({
  skill: {type: String},

},{ _id: false });

const preparationPlanSchema = new mongoose.Schema({
  day: { type: Number },
  focus: { type: String},
  tasks: [{ type: String}], //task is a array of string
},{ _id: false });
const interviewReportSchema = new mongoose.Schema(
  {
   

  source: {
    type: String,
    enum: ["external_job", "platform_job", "application"],
    required: true,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },

  

  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },

  
    title: { type: String, required: [true, "title is required"] },
    jobDescription: {
      type: String,
      
    },
    resume: { type: String },
    selfDescription: { type: String },
    matchScore: { type: Number, min: 0, max: 100 },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillGapsSchema],
    preparationPlan: [preparationPlanSchema],
   
   
  },
  { timestamps: true },
);

// getAllInterviewReportController filters by user, sorted newest first
interviewReportSchema.index({ user: 1, createdAt: -1 });

export const interviewReportModel = mongoose.model(
  "interviewReport",
  interviewReportSchema,
);
