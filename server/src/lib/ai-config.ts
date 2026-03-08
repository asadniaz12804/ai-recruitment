/**
 * AI feature-flag helpers.
 *
 * AI_ENABLED controls whether background AI jobs (resume parsing, scoring)
 * are enqueued. When false, uploads and applications succeed normally but
 * Resume.parseStatus stays "pending" and Application.matchScore stays null.
 */

export function isAiEnabled(): boolean {
  return process.env.AI_ENABLED === "true";
}

export function getOpenAiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}
