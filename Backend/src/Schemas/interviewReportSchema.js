import { z } from "zod";
const SEVERITIES = ["low", "medium", "high"];

// ─── Interview report: Zod (validates the model's output) ─────────────────────
const questionZod = z.object({
  question: z.string().min(1),
  intention: z.string().min(1),
  answer: z.string().min(1),
});

export const interviewReportSchema = z.object({
  title: z.string().min(1),
  skillGaps: z.array(z.object({ skill: z.string(), severity: z.enum(SEVERITIES) })),
  matchScore: z.number().min(0).max(100),
  technicalQuestions: z.array(questionZod).min(1),
  behavioralQuestions: z.array(questionZod).min(1),
  preparationPlan: z
    .array(
      z.object({
        day: z.number(),
        focus: z.string().min(1),
        tasks: z.array(z.string()).min(1),
      }),
    )
    .min(1),
});

// ─── Interview report: Groq schema ────────────────────────────────────────────
const questionGroq = (answerDescription) => ({
  type: "object",
  additionalProperties: false,
  required: ["question", "intention", "answer"],
  properties: {
    question: { type: "string", description: "One clear interview question" },
    intention: { type: "string", description: "One sentence on what the interviewer is testing" },
    answer: { type: "string", description: answerDescription },
  },
});

export const interviewReportGroqSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "skillGaps",
    "matchScore",
    "technicalQuestions",
    "behavioralQuestions",
    "preparationPlan",
  ],
  properties: {
    title: { type: "string", description: "Job title from the job description" },
    skillGaps: {
      type: "array",
      description: "At most 6 gaps, ordered high, medium, low",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["skill", "severity"],
        properties: {
          skill: { type: "string", description: "Short skill name" },
          severity: { type: "string", enum: SEVERITIES },
        },
      },
    },
    matchScore: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description:
        "Whole number: skills (0–40) + experience (0–30) + responsibility coverage (0–20) + supporting evidence (0–10)",
    },
    technicalQuestions: {
      type: "array",
      description: "Exactly 6, easiest to hardest",
      items: questionGroq("First-person model answer, 2-3 sentences, using only resume experience"),
    },
    behavioralQuestions: {
      type: "array",
      description: "Exactly 4: teamwork, ownership or problem solving, failure or feedback, communication",
      items: questionGroq(
        "First-person STAR answer, 3-4 sentences, built on a real role or project from the resume",
      ),
    },
    preparationPlan: {
      type: "array",
      description:
        "Exactly 7 days: days 1–4 skill gaps, day 5 core tech and system design, day 6 DSA/OOP/aptitude, day 7 behavioral and mock interview",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "focus", "tasks"],
        properties: {
          day: { type: "number" },
          focus: { type: "string", description: "Short title for the day" },
          tasks: {
            type: "array",
            description: "Exactly 3 concrete actions, each starting with a verb",
            items: { type: "string" },
          },
        },
      },
    },
  },
};

const HIRING_RECOMMENDATIONS = ["strong_hire", "hire", "consider", "weak_fit", "reject"];

const areaItemZod = z.object({ area: z.string(), explanation: z.string() });

export const recruiterReportSchema = z.object({
  skillMatchAnalysis: z.object({
    strongMatch: z.array(z.string()),
    partialMatch: z.array(z.string()),
    missing: z.array(z.string()),
  }),
  skillGaps: z.array(z.object({ skill: z.string(), severity: z.enum(SEVERITIES) })),
  experienceEvaluation: z.string().min(1),
  matchScore: z.number().min(0).max(100).transform(Math.round),
  hiringRecommendation: z.enum(HIRING_RECOMMENDATIONS),
  strengths: z.array(areaItemZod).min(1),
  weaknesses: z.array(areaItemZod).min(1),
  executiveSummary: z.string().min(1),
});

const areaItemGroq = {
  type: "object",
  additionalProperties: false,
  required: ["area", "explanation"],
  properties: {
    area: { type: "string", description: "Short label, 2–5 words" },
    explanation: {
      type: "string",
      description: "One sentence naming the resume evidence and the job requirement it relates to",
    },
  },
};

const skillListGroq = (description) => ({
  type: "array",
  description,
  items: { type: "string" },
});

export const recruiterReportGroqSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "skillMatchAnalysis",
    "skillGaps",
    "experienceEvaluation",
    "matchScore",
    "hiringRecommendation",
    "strengths",
    "weaknesses",
    "executiveSummary",
  ],
  properties: {
    skillMatchAnalysis: {
      type: "object",
      additionalProperties: false,
      description: "Every required skill placed in exactly one list, spelled exactly as given",
      required: ["strongMatch", "partialMatch", "missing"],
      properties: {
        strongMatch: skillListGroq("Required skills used in a described work role or project"),
        partialMatch: skillListGroq("Required skills only listed, or covered by a close alternative"),
        missing: skillListGroq("Required skills with no mention and no close alternative"),
      },
    },
    skillGaps: {
      type: "array",
      description: "Missing skills (high), partial skills (medium), then at most 2 unevidenced responsibilities (low); ordered high to low",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["skill", "severity"],
        properties: {
          skill: { type: "string" },
          severity: { type: "string", enum: SEVERITIES },
        },
      },
    },
    experienceEvaluation: {
      type: "string",
      description: "2–4 sentences on professional experience only, with the total rounded to the nearest half year",
    },
    matchScore: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Whole number: skills (0–40) + experience (0–30) + responsibility coverage (0–20) + supporting evidence (0–10)",
    },
    hiringRecommendation: {
      type: "string",
      enum: HIRING_RECOMMENDATIONS,
      description: "Taken from matchScore using the bands in the instructions",
    },
    strengths: { type: "array", description: "2 to 4 items, most important first", items: areaItemGroq },
    weaknesses: { type: "array", description: "1 to 4 items, most important first", items: areaItemGroq },
    executiveSummary: {
      type: "string",
      description: "Exactly 3 sentences: overall fit, strongest evidence, main gap or risk",
    },
  },
};
