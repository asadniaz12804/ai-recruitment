/**
 * OpenAI-backed AiProvider implementation.
 *
 * Uses the official openai SDK with request timeouts and retry logic.
 * Rate-limit errors (429) are automatically retried by BullMQ's exponential
 * backoff, so the provider throws on rate limits to let the worker retry.
 */
import OpenAI from "openai";
import type { AiProvider, ResumeParseResult, CandidateScoreResult } from "./provider.js";
import { RESUME_PARSE_SYSTEM, RESUME_PARSE_USER, SCORE_SYSTEM, SCORE_USER } from "./prompts.js";
import { getOpenAiKey, getOpenAiModel } from "../lib/ai-config.js";
import { logger } from "../logger.js";

const REQUEST_TIMEOUT_MS = 60_000; // 60 s per request

function getClient(): OpenAI {
  const apiKey = getOpenAiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS });
}

function parseJsonResponse(raw: string): unknown {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  }
  return JSON.parse(cleaned);
}

export class OpenAiProvider implements AiProvider {
  async parseResume(input: { text: string; fileName?: string }): Promise<ResumeParseResult> {
    const client = getClient();
    const model = getOpenAiModel();

    logger.info({ model, fileNameLength: input.fileName?.length }, "AI: parseResume start");

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: 1500,
      messages: [
        { role: "system", content: RESUME_PARSE_SYSTEM },
        { role: "user", content: RESUME_PARSE_USER(input.text) },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = parseJsonResponse(content) as Record<string, unknown>;

    logger.info("AI: parseResume complete");

    return {
      summary: (parsed.summary as string) ?? "",
      extractedFields: (parsed.extractedFields as Record<string, unknown>) ?? {},
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
    const client = getClient();
    const model = getOpenAiModel();

    logger.info({ model, jobTitle: input.jobTitle }, "AI: scoreCandidate start");

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        { role: "system", content: SCORE_SYSTEM },
        { role: "user", content: SCORE_USER(input) },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = parseJsonResponse(content) as Record<string, unknown>;

    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
    const summary = (parsed.summary as string) ?? "";

    logger.info({ score }, "AI: scoreCandidate complete");

    return { score, summary };
  }
}
