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
  resumeGroqSchema,
  ResumeReportSchema,
} from "../Schemas/resumeReportSchema.js";
import ApiError from "../Utils/ApiError.js";
import {
  jobDescriptionGroqSchema,
  jobDescriptionSchema,
} from "../Schemas/jobDescriptionSchema.js";

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
  const prompt = `Generate a detailed interview report for a candidate with the following details:
  
Resume: ${resume}

Self Description:
${selfDescription}

Job Description: ${jobDescription}

Based on the above information, generate:
1. A match score (0-100) showing how well the candidate fits the role
2. At least 5 technical questions relevant to the job description
3. At least 3 behavioral questions
4. Any skill gaps in the candidate's profile, sort them from high to low
5. A concrete 7 day, day-wise preparation plan to help the candidate succeed in the interview, while designing the roadmap give 60% focus on closing the skill gaps as much as possible and 40% focus on the overall tech stack, system design, DSA, OOP, Aptitude `;

  return callStructured({
    name: "interview_report",
    systemPrompt:
      "You are an interview coach. Always respond with valid JSON only. Never use markdown or code fences. if self description is given use that if not then use the resume text to get information about the self description",
    userPrompt: prompt,
    groqSchema: interviewReportGroqSchema,
    zodSchema: interviewReportSchema,
    temperature: 0.2,
    maxTokens: 3000,
  });
};

/**
 * @name generateResume
 * @description create resume
 */
//------ Generate resume function--------------------------
export const generateResume = async (resumeData) => {
  const {
    fullName,
    email,
    phone,
    location,
    portfolioUrl,
    linkedinUrl,
    githubProfileLink,
    summary,
    experiences,
    education,
    skills,
    certifications,
    projects,
  } = resumeData;
  const prompt = `
You are an expert Resume Writer, ATS Optimization Specialist, and Technical Recruiter.

Your task is to analyze the candidate resume data below and generate an optimized, ATS-friendly resume.

Follow these rules strictly:

## Resume Optimization Tasks

1. Professional Summary:
- Generate a strong professional summary of 3-4 sentences.
- Highlight candidate experience, technical skills, achievements, and career direction.
- If an existing summary exists, improve it while preserving the candidate's actual background.
- Do not add fake experience.

2. Skills:
- Improve each skill description.
- Keep descriptions concise, professional, and impact-focused.
- Do not add skills that are not present in the input.

3. Work Experience:
- Rewrite every achievement using strong action verbs.
- Convert weak statements into measurable achievements.
- Add metrics only if they can be reasonably inferred from the provided information.
- Never fabricate numbers, company details, or responsibilities.

Example:
Before:
"Worked on backend APIs"

After:
"Developed and optimized backend APIs to improve application performance and scalability"

4. Education:
- Rewrite degree names into their full, professional format by expanding abbreviations and including the major/specialization whenever it is available.
- Keep institution names exactly as provided.
- Do not invent or infer majors, specializations, grades, CGPA, GPA, results, graduation dates, or honors that are not explicitly mentioned.
- If only an abbreviated degree and major are provided, expand them into the official degree name.

Examples:
- Input: BSc CSE → Output: Bachelor of Science (BSc) in Computer Science and Engineering
- Input: BBA Marketing → Output: Bachelor of Business Administration (BBA) in Marketing
- Input: MSc EEE → Output: Master of Science (MSc) in Electrical and Electronic Engineering
- Input: Diploma CSE → Output: Diploma in Computer Science and Engineering
- Input: BSc → Output: Bachelor of Science (BSc)

5. Projects:
- Rewrite project descriptions to emphasize:
  - Technical implementation
  - Architecture
  - Technologies used
  - Impact/features
- Make descriptions suitable for software engineering roles.
- Do not invent technologies.

6. ATS Score:
Calculate an ATS score between 0-100 based on:

- Relevant skills matching job market expectations
- Keyword optimization
- Experience quality
- Achievement strength
- Project quality
- Resume completeness
- Professional formatting

Return a realistic score.

7. Resume Title:
Generate a professional resume title based on the candidate profile.

Examples:
"Full Stack Software Engineer"
"Frontend React Developer"
"Backend Node.js Engineer"

Do not use generic titles like "Resume" or "CV".

---

## URL Rules

- Always include https:// for URLs.
- If a URL exists in the input, preserve it exactly.
- Never create or modify URLs.
- If URL is missing, return an empty string "".
- Never return "N/A", "Not Available", or placeholders.

---

## Output Rules

- Return ONLY valid JSON.
- No explanation.
- No markdown.
- No code blocks.
- Follow the provided JSON schema exactly.
- Every field must be included.
- Use empty strings "" for unavailable text fields.
- Use empty arrays [] when no data exists.

---

## Candidate Resume Data

### PERSONAL INFORMATION

Name:
${fullName}

Email:
${email}

Phone:
${phone}

Location:
${location}

LinkedIn:
${linkedinUrl}

GitHub:
${githubProfileLink}

Portfolio:
${portfolioUrl}

Current Summary:
${summary || "No summary provided"}

---

### EXPERIENCE

${
  experiences.length
    ? experiences
        .map(
          (exp, i) => `
${i + 1}.
Company: ${exp.company}
Job Title: ${exp.jobTitle}
Duration: ${exp.duration}
Location: ${exp.expLocation}

Achievements:
${exp.achievements}
`,
        )
        .join("\n")
    : "No experience provided"
}

---

### EDUCATION

${
  education.length
    ? education
        .map(
          (edu, i) => `
${i + 1}.
Degree: ${edu.degree}
Institution: ${edu.institution}
Result: ${edu.result || ""}
`,
        )
        .join("\n")
    : "No education provided"
}

---

### SKILLS

${
  skills.length
    ? skills
        .map(
          (skill) => `
Skill:
${skill.name}

Current Description:
${skill.description || ""}
`,
        )
        .join("\n")
    : "No skills provided"
}

---

### CERTIFICATIONS

${
  certifications.length
    ? certifications
        .map(
          (cert) => `
Name:
${cert.name}

Issuer:
${cert.issuer}

Issue Date:
${cert.issueDate}

Credential URL:
${cert.credentialUrl || ""}
`,
        )
        .join("\n")
    : "No certifications provided"
}

---

### PROJECTS

${
  projects.length
    ? projects
        .map(
          (project, i) => `
${i + 1}.

Project Name:
${project.name}

Live Link:
${project.liveLink || ""}

Github:
${project.githubLink || ""}

Description:
${project.description}
`,
        )
        .join("\n")
    : "No projects provided"
}
`;
  return callStructured({
    name: "generate_resume",
    systemPrompt:
      "You are an interview coach. Always respond with valid JSON only. Never use markdown or code fences.",
    userPrompt: prompt,
    groqSchema: resumeGroqSchema,
    zodSchema: ResumeReportSchema,
    temperature: 0.5,
    maxTokens: 2500,
  });
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
  const formattedSkills = skills.join(",");
  const prompt = `Generate a professional recruiter assessment report for the candidate based on the following information.

Resume:
${resume}

Required Skills:
${formattedSkills}

Job Description:
${jobDescription}

Your role is to act as an experienced technical recruiter and hiring manager. Evaluate the candidate objectively and fairly. Base your assessment only on the information provided.

Generate the report in the following format:

1. Overall Match Score (0-100)
   - Score the candidate's suitability for the role.

2. Hiring Recommendation
   - Choose exactly one:
     - Strong_hire
     - hire
     - consider
     - weak_fit
     - reject

3. Executive Summary
   - Write a concise exactly 3 line summary explaining how well the candidate matches the role.

4. Key Strengths
   - List the candidate's strongest technical skills, projects, experience, and qualifications that align with the job requirements.

5. Key Weaknesses
   - List the most significant weaknesses or missing qualifications that may impact job performance.

6. Missing Skills
   - List the technologies, frameworks, tools, concepts, or experience the candidate lacks.
   - Assign each missing skill a severity:
     - High
     - Medium
     - Low
   - Sort the list from highest severity to lowest.

7. Skill Match Analysis
   - Categorize the required skills into:
     - Strong Match
     - Partial Match
     - Missing

8. Experience Evaluation
   - Look for professional experience, internships, work history, or employment-equivalent activity (e.g. freelance work, contract roles) in the resume.
   - If such experience IS present:
     - Evaluate whether it appears sufficient for the role's seniority and requirements.
     - Reference specific roles, durations, or responsibilities from the resume that inform your judgment.
   - If NO professional experience is present in the resume (e.g. the candidate only lists projects, education, or certifications):
     - State this explicitly: note that no professional experience was found in the resume.
     - Do not infer or assume experience level from projects, education, or skills alone.
     - Briefly note whether the listed projects/education could reasonably substitute for experience at an entry level, without treating them as equivalent to professional experience.



Important Guidelines:
- Compare the candidate's resume and skills against the job description and required skills.
- Analyze the candidate's projects, professional experience, certifications, education, and qualifications if they are mentioned in the resume.
- Highlight relevant projects and experiences that demonstrate alignment with the role.
- Do not invent or assume any projects, experience, certifications, skills, or qualifications that are not present in the provided information.
- If there is insufficient evidence for a conclusion, explicitly state that it cannot be determined.
- Keep the assessment objective, concise, and suitable for recruiters making hiring decisions.
- If the resume contains no professional work experience, explicitly state this in the Experience Evaluation section rather than leaving it vague or fabricating an assessment.
- Never present projects, coursework, or certifications as if they were professional experience — evaluate them separately and label them accurately.
`;

  return callStructured({
    name: "recruiter_report",
    systemPrompt: `You are an expert technical recruiter.

Analyze candidates against job requirements.

Return ONLY valid JSON.
Follow the exact field names from the provided JSON schema.
Do not rename keys.
Do not add extra fields.`,
userPrompt:prompt,
groqSchema:recruiterReportGroqSchema,
zodSchema:recruiterReportSchema,
temperature:0.2,
maxTokens:2000
  });

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
  const formattedSkills = skills.join(", ");

  const prompt = `
You are analyzing a candidate's interview readiness for a specific job role.

Candidate Resume:
${resume}

Required Skills for the Role:
${formattedSkills}

Job Description:
${jobDescription}

Analyze the candidate against the job requirements and generate an interview preparation report.

Your analysis must include:

1. Match Score
- Provide a score between 0 and 100.
- The score should represent how well the candidate's resume matches the job requirements.
- Consider:
  - Relevant technical skills
  - Professional experience
  - Projects
  - Domain knowledge
  - Missing required skills

2. Technical Interview Questions
- Generate at least 5 technical questions.
- Questions should be directly related to the job description and required skills.
- Prioritize questions that are likely to be asked for this specific role.
- Include a mix of fundamental and advanced questions.

3. Behavioral Interview Questions
- Generate at least 3 behavioral questions.
- Focus on teamwork, problem solving, ownership, communication, and handling challenges.

4. Skill Gap Analysis
- Identify missing or weak skills compared to the job requirements.
- Sort skill gaps from highest priority to lowest priority.
- Focus on skills that have the biggest impact on interview success.

5. 7-Day Interview Preparation Plan
Create a realistic day-by-day preparation roadmap.

Rules for the roadmap:
- Spend approximately 60% of the time improving identified skill gaps.
- Spend approximately 40% of the time preparing overall interview fundamentals:
  - Core technology concepts
  - System design
  - Data structures and algorithms
  - Object-oriented programming
  - Aptitude/problem solving
  - Behavioral preparation

Each day should contain:
- Topics to study
- Practical tasks or exercises
- Expected outcome by the end of the day

Only provide information that is relevant to this candidate and this job role.
`;
return callStructured({
  name:"analyze_prep_report",
  systemPrompt: `
You are an expert technical interviewer and career coach.

Your task is to evaluate candidates against job descriptions and create actionable interview preparation plans.

Important rules:
- Return ONLY valid JSON.
- Do not include markdown, explanations, or code blocks.
- Do not add fields outside the provided JSON schema.
- Base your evaluation only on the provided resume, skills, and job description.
- Be realistic and avoid giving inflated scores.
- Prioritize practical interview preparation over generic advice.
          `,
  userPrompt:prompt,
  groqSchema:interviewReportGroqSchema,
  zodSchema:interviewReportSchema,
  temperature:0.2,
  maxTokens:3000
})
  
};
