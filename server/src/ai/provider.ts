/**
 * AI Provider abstraction.
 *
 * Interface that all AI providers must implement.
 * Swap implementations via the factory in ./index.ts.
 */

export interface ResumeParseResult {
  summary: string;
  extractedFields?: Record<string, unknown>;
  rawText?: string;
}

export interface CandidateScoreResult {
  score: number;   // 0–100
  summary: string;
}

export interface AiProvider {
  /** Parse/summarise resume text into structured output */
  parseResume(input: {
    text: string;
    fileName?: string;
  }): Promise<ResumeParseResult>;

  /** Score a candidate against a job description */
  scoreCandidate(input: {
    jobTitle: string;
    jobDescription: string;
    skillsRequired: string[];
    resumeText?: string;
    candidateSkills?: string[];
    candidateHeadline?: string;
  }): Promise<CandidateScoreResult>;
}
