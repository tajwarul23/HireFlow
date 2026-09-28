import { z } from "zod";

// ─── What the model returns (the final text is built by buildJobDescription) ───
export const jobDescriptionAiSchema = z.object({
  aboutCompany: z.string().min(1),
  aboutRole: z.string().min(1),
  responsibilities: z.array(z.string()).min(1),
  skillRequirements: z.array(z.string()),
  preferredQualifications: z.array(z.string()),
  experienceLevel: z.string().min(1),
  closingStatement: z.string().min(1),
});

const stringList = (description) => ({
  type: "array",
  description,
  items: { type: "string" },
});

export const jobDescriptionAiGroqSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "aboutCompany",
    "aboutRole",
    "responsibilities",
    "skillRequirements",
    "preferredQualifications",
    "experienceLevel",
    "closingStatement",
  ],
  properties: {
    aboutCompany: { type: "string", description: "2–3 sentences using only the provided company info" },
    aboutRole: { type: "string", description: "2–3 sentences, including employment type and work mode" },
    responsibilities: stringList("Exactly 6 one-sentence items starting with a verb"),
    skillRequirements: stringList("One item per required skill, in order, containing the skill name"),
    preferredQualifications: stringList("Exactly 3 items about working habits or soft skills"),
    experienceLevel: { type: "string", description: "1–2 sentences stating the level as given" },
    closingStatement: { type: "string", description: "1–2 sentences inviting candidates to apply" },
  },
};
