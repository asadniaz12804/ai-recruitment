/**
 * Prompt templates for OpenAI calls.
 * Keep them short and focused on structured JSON output.
 */

export const RESUME_PARSE_SYSTEM = `You are a resume parsing assistant. Extract structured information from the resume text.
Return ONLY valid JSON with no markdown formatting, no code fences. The JSON object must have:
- "summary": a 2-3 sentence professional summary of the candidate
- "extractedFields": an object with optional keys: "name", "email", "phone", "skills" (array of strings), "education" (array of strings), "experience" (array of strings with company/role/dates)
Do not include any text outside the JSON object.`;

export const RESUME_PARSE_USER = (text: string) =>
  `Parse the following resume text:\n\n${text.slice(0, 6000)}`;

export const SCORE_SYSTEM = `You are a recruitment scoring assistant. Given a job description and candidate information, provide a match score and summary.
Return ONLY valid JSON with no markdown formatting, no code fences. The JSON object must have:
- "score": integer from 0 to 100 representing how well the candidate matches the job
- "summary": a 2-3 sentence explanation of the match
Do not include any text outside the JSON object.`;

export const SCORE_USER = (input: {
  jobTitle: string;
  jobDescription: string;
  skillsRequired: string[];
  resumeText?: string;
  candidateSkills?: string[];
  candidateHeadline?: string;
}) => {
  const parts = [
    `Job Title: ${input.jobTitle}`,
    `Job Description: ${input.jobDescription.slice(0, 3000)}`,
  ];
  if (input.skillsRequired.length > 0) {
    parts.push(`Required Skills: ${input.skillsRequired.join(", ")}`);
  }
  if (input.resumeText) {
    parts.push(`Resume Text: ${input.resumeText.slice(0, 4000)}`);
  }
  if (input.candidateSkills && input.candidateSkills.length > 0) {
    parts.push(`Candidate Skills: ${input.candidateSkills.join(", ")}`);
  }
  if (input.candidateHeadline) {
    parts.push(`Candidate Headline: ${input.candidateHeadline}`);
  }
  return parts.join("\n\n");
};
