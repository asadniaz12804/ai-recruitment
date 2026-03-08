/**
 * Mock / Fake AiProvider for testing without real OpenAI calls.
 */
import type { AiProvider, ResumeParseResult, CandidateScoreResult } from "./provider.js";

export class MockAiProvider implements AiProvider {
  calls: { method: string; input: unknown }[] = [];

  async parseResume(input: { text: string; fileName?: string }): Promise<ResumeParseResult> {
    this.calls.push({ method: "parseResume", input: { fileName: input.fileName } });
    return {
      summary: "Mock summary: experienced professional with relevant skills.",
      extractedFields: {
        name: "Mock Candidate",
        skills: ["JavaScript", "TypeScript", "Node.js"],
        education: ["BS Computer Science"],
        experience: ["Software Engineer at MockCorp (2020-2024)"],
      },
      rawText: input.text,
    };
  }

  async scoreCandidate(input: {
    jobTitle: string;
    jobDescription: string;
    skillsRequired: string[];
    resumeText?: string;
    candidateSkills?: string[];
    candidateHeadline?: string;
  }): Promise<CandidateScoreResult> {
    this.calls.push({ method: "scoreCandidate", input: { jobTitle: input.jobTitle } });

    // Deterministic mock score based on skills overlap
    const required = new Set(input.skillsRequired.map((s) => s.toLowerCase()));
    const candidate = new Set([
      ...(input.candidateSkills ?? []).map((s) => s.toLowerCase()),
    ]);
    let overlap = 0;
    for (const s of required) {
      if (candidate.has(s)) overlap++;
    }
    const score = required.size > 0 ? Math.round((overlap / required.size) * 80) + 20 : 50;

    return {
      score: Math.min(100, score),
      summary: `Mock match: ${overlap}/${required.size} required skills matched.`,
    };
  }
}
