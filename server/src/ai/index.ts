/**
 * AI provider factory.
 *
 * Returns the active AiProvider based on configuration.
 * - If AI_ENABLED !== "true", returns null (callers must check).
 * - If OPENAI_API_KEY is set, uses OpenAiProvider.
 * - Otherwise falls back to MockAiProvider (useful for dev).
 */
import type { AiProvider } from "./provider.js";
import { isAiEnabled, getOpenAiKey } from "../lib/ai-config.js";
import { logger } from "../logger.js";

let _provider: AiProvider | null | undefined;

export function getAiProvider(): AiProvider | null {
  if (_provider !== undefined) return _provider;

  if (!isAiEnabled()) {
    logger.info("AI is disabled (AI_ENABLED != true)");
    _provider = null;
    return null;
  }

  if (getOpenAiKey()) {
    // Lazy import to avoid loading openai SDK when AI disabled
    const { OpenAiProvider } = require("./openai-provider.js") as {
      OpenAiProvider: new () => AiProvider;
    };
    _provider = new OpenAiProvider();
    logger.info("AI provider: OpenAI");
    return _provider;
  }

  // Fallback to mock when key is missing but AI is enabled
  const { MockAiProvider } = require("./mock-provider.js") as {
    MockAiProvider: new () => AiProvider;
  };
  _provider = new MockAiProvider();
  logger.warn("AI_ENABLED=true but OPENAI_API_KEY missing — using MockAiProvider");
  return _provider;
}

/**
 * Override provider for testing.
 */
export function setAiProvider(provider: AiProvider | null): void {
  _provider = provider;
}

export function resetAiProvider(): void {
  _provider = undefined;
}
