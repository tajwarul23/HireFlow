import { z } from "zod";

const ExperienceSchema = z.object({
  jobTitle: z.string().min(1, "Job Title is required"),
  company: z.string().min(1, "Company is required"),
  duration: z.string().min(1, "Duration is required"),
  expLocation: z.string().min(1, "Experience is required"),
  achievements: z.string().min(1, "Achievement is required"),
});

const SkillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  description: z.string().min(1, "Skill description is required"),
});

const CertificationSchema = z.object({
  name: z.string().min(1, "Certification Name is required"),
  issuer: z.string().min(1, "Certification issuer name is required"),
  issueDate: z.string().min(1, "Certificate issue date is required"),
  credentialUrl: z.string()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal("")),
});

const ProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  githubLink: z.string()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal("")),
  liveLink: z.string()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal("")),
  description: z.string().min(1, "Project description is required"),
});

export const ResumeReportSchema = z.object({
  title: z.string().default("Untitled Resume"),

  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .max(20, "Phone number is too long")
    .regex(/^[+\d\s\-().]+$/, "Only digits, spaces, +, -, () allowed"),
  location: z.string().min(1, "Location is required"),
  portfolioUrl: z.string()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal("")),
  linkedinUrl: z.string()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal("")),
  githubProfileLink: z.string()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal("")),
  summary: z.string(),
  atsScore:z.number().min(1).max(100),
 education: z
     .array(
       z.object({
         degree: z.string().min(1, "Degree is required"),
         institution: z.string().min(1, "Institution is required"),
         result: z.string().optional(), 
       })
     )
     .min(1, "Add at least one education entry"),

  experiences: z.array(ExperienceSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
});

// ─── What the model returns (the final resume is built by buildResume) ─────────
const QUALITY_LABELS = ["strong", "good", "basic", "none"];

export const resumeAiSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  experiences: z.array(z.object({ achievements: z.array(z.string()) })),
  education: z.array(z.object({ degree: z.string() })),
  skills: z.array(z.object({ description: z.string() })),
  projects: z.array(z.object({ description: z.string() })),
  atsAssessment: z.object({
    achievementQuality: z.enum(QUALITY_LABELS),
    projectQuality: z.enum(QUALITY_LABELS),
    skillsFocus: z.enum(QUALITY_LABELS),
  }),
});

const textItem = (key, description) => ({
  type: "object",
  additionalProperties: false,
  required: [key],
  properties: { [key]: { type: "string", description } },
});

export const resumeAiGroqSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "experiences", "education", "skills", "projects", "atsAssessment"],
  properties: {
    title: { type: "string", description: "2–4 word professional title" },
    summary: { type: "string", description: "Exactly 3 sentences, no 'I', no name" },
    experiences: {
      type: "array",
      description: "Same count and order as the input experiences",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["achievements"],
        properties: {
          achievements: {
            type: "array",
            description: "One bullet per original statement, each starting with an action verb, 10–25 words",
            items: { type: "string" },
          },
        },
      },
    },
    education: {
      type: "array",
      description: "Same count and order as the input education",
      items: textItem("degree", "Full official degree name; abbreviations expanded only"),
    },
    skills: {
      type: "array",
      description: "Same count and order as the input skills",
      items: textItem("description", "One phrase, 4–12 words, no full stop"),
    },
    projects: {
      type: "array",
      description: "Same count and order as the input projects",
      items: textItem("description", "1–2 sentences, 20–40 words"),
    },
    atsAssessment: {
      type: "object",
      additionalProperties: false,
      required: ["achievementQuality", "projectQuality", "skillsFocus"],
      properties: {
        achievementQuality: { type: "string", enum: QUALITY_LABELS },
        projectQuality: { type: "string", enum: QUALITY_LABELS },
        skillsFocus: { type: "string", enum: QUALITY_LABELS },
      },
    },
  },
};
