import dotenv from "dotenv";
dotenv.config();
import Groq from "groq-sdk";

import {
  interviewReportGroqSchema,
  interviewReportSchema,
  recruiterReportGroqSchema,
  recruiterReportSchema,
} from "../Schemas/interviewReportSchema.js";
import {
  resumeAiGroqSchema,
  resumeAiSchema,
} from "../Schemas/resumeReportSchema.js";
import ApiError from "../Utils/ApiError.js";
import {
  jobDescriptionAiGroqSchema,
  jobDescriptionAiSchema,
} from "../Schemas/jobDescriptionSchema.js";
import {
  buildRecruiterReportPrompt,
  recommendationFromScore,
  recruiterReportSystemPrompt,
} from "../Prompts/recruiterReport.prompt.js";
import {
  buildInterviewReportPrompt,
  interviewReportSystemPrompt,
  normalizeInterviewReport,
} from "../Prompts/interviewReport.prompt.js";
import {
  buildResume,
  buildResumePrompt,
  resumeSystemPrompt,
} from "../Prompts/resume.prompt.js";
import {
  buildJobDescription,
  buildJobDescriptionPrompt,
  jobDescriptionSystemPrompt,
} from "../Prompts/jobDescription.prompt.js";

const ai = new Groq({
  apiKey: process.env.GROK_API_KEY,
  maxRetries: 2,
});

const callStructured = async ({
  name,
  systemPrompt,
  userPrompt,
  groqSchema,
  zodSchema,
  temperature,
  maxTokens,
  reasoningEffort = "medium",
}) => {
  const response = await ai.chat.completions.create({
    model: process.env.GROK_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name, strict: true, schema: groqSchema },
    },
    temperature,
    max_completion_tokens: maxTokens,
    reasoning_effort: reasoningEffort,
  });

  const choice = response.choices[0];
  if (choice.finish_reason === "length") {
    throw new ApiError(
      502,
      `AI response for ${name} was cut off (token limit reached)`,
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(choice.message.content);
  } catch (error) {
    throw new ApiError(502, `AI returned invalid JSON for ${name}`);
  }

  const result = zodSchema.safeParse(parsed);
  if (!result.success) {
    console.error(`[${name}] schema validation failed:`, result.error.issues);
    throw new ApiError(
      502,
      `AI response for ${name} did not match the expected schema`,
    );
  }
  return result.data;
};

/**
 * @name generateInterviewReport
 * @description generate interview report
 */

// ─── Generate interview report Function ────────────────────────────────────────────────────────────

export const generateInterviewReport = async ({
  resume,
  selfDescription,
  jobDescription,
}) => {
  const report = await callStructured({
    name: "interview_report",
    systemPrompt: interviewReportSystemPrompt,
    userPrompt: buildInterviewReportPrompt({
      resume,
      selfDescription,
      jobDescription,
    }),
    groqSchema: interviewReportGroqSchema,
    zodSchema: interviewReportSchema,
    temperature: 0.2,
    maxTokens: 4500,
    reasoningEffort: "low",
  });
  return normalizeInterviewReport(report);
};

/**
 * @name generateResume
 * @description create resume
 */
//------ Generate resume function--------------------------
export const generateResume = async (resumeData) => {
  const aiOutput = await callStructured({
    name: "resume",
    systemPrompt: resumeSystemPrompt,
    userPrompt: buildResumePrompt(resumeData),
    groqSchema: resumeAiGroqSchema,
    zodSchema: resumeAiSchema,
    temperature: 0.3,
    maxTokens: 2500,
  });
  return buildResume(resumeData, aiOutput);
};

/**
 * @name generateRecruiterReport
 * @description when a candidate applies for a job a recruiterReport is also get attached with the application to analyze
 */
export const generateRecruiterReport = async (
  resume,
  jobDescription,
  skills,
) => {
  const report = await callStructured({
    name: "recruiter_report",
    systemPrompt: recruiterReportSystemPrompt,
    userPrompt: buildRecruiterReportPrompt({ resume, jobDescription, skills }),
    groqSchema: recruiterReportGroqSchema,
    zodSchema: recruiterReportSchema,
    temperature: 0.2,
    maxTokens: 2500,
  });

  report.hiringRecommendation = recommendationFromScore(report.matchScore);
  return report;
};
/**
 * @name generateJobDescription
 * @description ai generated job description
 */
export const generateJobDescription = async (
  title,
  experienceLevel,
  workMode,
  employmentType,
  skills,
  companyName,
  aboutCompany,
) => {
  const aiOutput = await callStructured({
    name: "job_description",
    systemPrompt: jobDescriptionSystemPrompt,
    userPrompt: buildJobDescriptionPrompt({
      title,
      experienceLevel,
      workMode,
      employmentType,
      skills,
      companyName,
      aboutCompany,
    }),
    groqSchema: jobDescriptionAiGroqSchema,
    zodSchema: jobDescriptionAiSchema,
    temperature: 0.3,
    maxTokens: 2000,
    reasoningEffort: "low",
  });

  return buildJobDescription(aiOutput, skills);
};

/**
 * @name generateAnalyzePrepReport
 * @description generate report based on job description, skill, and resume text
 */
export const generateAnalyzePrepReport = async (
  resume,
  jobDescription,
  skills,
) => {
  const report = await callStructured({
    name: "interview_report",
    systemPrompt: interviewReportSystemPrompt,
    userPrompt: buildInterviewReportPrompt({ resume, jobDescription, skills }),
    groqSchema: interviewReportGroqSchema,
    zodSchema: interviewReportSchema,
    temperature: 0.2,
    maxTokens: 4500,
    reasoningEffort: "low",
  });
  return normalizeInterviewReport(report);
};
