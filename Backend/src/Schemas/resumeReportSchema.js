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

export const resumeGroqSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Give a standard, professional title For the Resume",
    },
    fullName: { type: "string", description: "Full name of the resume owner" },
    email: { type: "string", description: "Email of the resume owner" },
    phone: { type: "string", description: "Phone number of the resume owner" },
    location: { type: "string", description: "Location of the resume owner" },
    portfolioUrl: {
      type: "string",
      description: "portfolio url of the resume owner",
    },
    linkedinUrl: {
      type: "string",
      description: "linkedin url of the resume owner",
    },
    githubProfileLink: {
      type: "string",
      description: "gitHub url of the resume owner",
    },
    summary: {
      type: "string",
      description: "professional summary of the resume owner ",
    },
    
    experiences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          jobTitle: { type: "string" },
          company: { type: "string" },
          duration: { type: "string" },
          expLocation: { type: "string" },
          achievements: { type: "string" },
        },
        
        required: [
          "jobTitle",
          "company",
          "duration",
          "expLocation",
          "achievements",
        ],
         additionalProperties: false,
      },
    },

   education: {
      type: "array",
      items: {type: "object",
      properties: {
        degree: { type: "string" },
        institution: { type: "string" },
        result: { type: "string" },
      },
      required: ["degree", "institution", "result"],
       additionalProperties: false,
    }
  },

    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name", "description"],
         additionalProperties: false,
      },
    },

    certifications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          issuer: { type: "string" },
          issueDate: { type: "string" },
          credentialUrl: { type: "string" },
        },
        required: ["name", "issuer", "issueDate", "credentialUrl"],
         additionalProperties: false,
      },
    },

    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          liveLink: { type: "string" },
          githubLink: { type: "string" },
        },
        required: ["name", "description", "liveLink", "githubLink"],
         additionalProperties: false,
      },
    },
    atsScore:{type:"number", description:"Provide an ATS score Based on the resume details"}
  },
  required: [
    "title",
    "fullName",
    "email",
    "phone",
    "location",
    "education",
    "summary",
    "experiences",
    "skills",
    "certifications",
    "projects",
    "atsScore",
    "githubProfileLink",
    "linkedinUrl",
    "portfolioUrl"
    
  ],
   additionalProperties: false,
};
