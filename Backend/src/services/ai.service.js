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
  jobDescriptionGroqSchema,
  jobDescriptionSchema,
} from "../Schemas/jobDescriptionSchema.js";
import { buildRecruiterReportPrompt, recommendationFromScore, recruiterReportSystemPrompt } from "../Prompts/recruiterReport.prompt.js";
import { buildInterviewReportPrompt, interviewReportSystemPrompt, normalizeInterviewReport } from "../Prompts/interviewReport.prompt.js";
import { buildResume, buildResumePrompt, resumeSystemPrompt } from "../Prompts/resume.prompt.js";

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
  reasoningEffort = "medium"
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
    reasoning_effort:reasoningEffort
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
  systemPrompt:interviewReportSystemPrompt,
  userPrompt: buildInterviewReportPrompt({resume, selfDescription, jobDescription}),
  groqSchema:interviewReportGroqSchema,
  zodSchema:interviewReportSchema,
  temperature:0.2,
  maxTokens:4500,
  reasoningEffort:"low"
 })
 return normalizeInterviewReport(report)
};

/**
 * @name generateResume
 * @description create resume
 */
//------ Generate resume function--------------------------
export const generateResume = async (resumeData) => {
  
 
  const aiOutput = await callStructured({
    name: "resume",
    systemPrompt:resumeSystemPrompt,
    userPrompt: buildResumePrompt(resumeData),
    groqSchema: resumeAiGroqSchema,
    zodSchema: resumeAiSchema,
    temperature: 0.3,
    maxTokens:2500
  });
  return buildResume(resumeData, aiOutput)
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
  name:"recruiter_report",
  systemPrompt:recruiterReportSystemPrompt,
  userPrompt:buildRecruiterReportPrompt({resume, jobDescription, skills}),
  groqSchema:recruiterReportGroqSchema,
  zodSchema:recruiterReportSchema,
  temperature:0.2,
  maxTokens:2500
})

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
  const formattedSkills = skills.join(", ");

  const prompt = `
Generate a professional ATS-friendly job description using the following information.

Company Name:
${companyName}

About Company:
${aboutCompany || "Not provided"}

Job Title:
${title}

Experience Level:
${experienceLevel}

Work Mode:
${workMode}

Employment Type:
${employmentType}

Required Skills:
${formattedSkills}

Requirements:
- Maximum 2950 characters.
- Use the provided experience level to tailor the responsibilities and expectations for the role.
- Mention the experience level explicitly in the "Experience Level" section.
- Write responsibilities appropriate for a ${experienceLevel.toLowerCase()} candidate.
- Include only the provided skills as mandatory requirements.
- Do not invent additional required technical skills, certifications, years of experience, salary, benefits, or company achievements.
- Keep the company introduction concise if limited information is available.
- End with a professional call-to-action encouraging qualified candidates to apply.
- Return only the JSON object that matches the provided schema.
`;
return callStructured({
  name:"job_description",
  systemPrompt:`
        You are a senior technical recruiter and HR specialist.

Your task is to generate a professional, realistic, and ATS-friendly job description suitable for publication on a modern job portal.

Guidelines:
- Return valid JSON only.
- Never use markdown, HTML, code fences, or any text outside the JSON response.
- Write in clear, professional English.
- Make the description engaging, concise, and suitable for direct publication.
- Do not invent company information beyond what is provided.
- If company information is limited, keep the company introduction brief and generic.
- Use only the technologies, skills, and requirements provided by the user.
- Do not add technical skills, certifications, responsibilities, salary, benefits, or years of experience that were not provided.
- Incorporate the provided experience level naturally throughout the description by setting appropriate expectations for the role.
- Structure the description using clearly labeled sections.
- Every section heading MUST end with a colon (:).
- Each section heading MUST appear on its own line.
- Use these exact section headings when applicable:
  - About the Company:
  - About the Role:
  - Key Responsibilities:
  - Preferred Qualifications:
  - Experience Level:
  - Application Closing Statement:
- Every section heading must end with a colon (:).
- Use the exact section heading format:
  "About the Company:"
  "About the Role:"
  "Key Responsibilities:"
  "Preferred Qualifications:"
  "Experience Level:"
  "Application Closing Statement:"
- Do not add a colon to normal paragraph sentences unless grammatically necessary.
- Keep each section heading on its own line.
- Do not use markdown formatting such as #, **, -, or bullet symbols for section headings.
        `,
    userPrompt:prompt,
    groqSchema:jobDescriptionGroqSchema,
    zodSchema:jobDescriptionSchema,
    temperature:0.5,
    maxTokens:2000
})
  
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
  systemPrompt:interviewReportSystemPrompt,
  userPrompt: buildInterviewReportPrompt({resume, jobDescription, skills}),
  groqSchema:interviewReportGroqSchema,
  zodSchema:interviewReportSchema,
  temperature:0.2,
  maxTokens:4500,
  reasoningEffort:"low"
 })
 return normalizeInterviewReport(report)
  
};
