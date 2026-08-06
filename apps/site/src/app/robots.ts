import type { MetadataRoute } from "next";
import { SITE } from "../lib/seo";

/** Robots policy: the public site is open to everyone — including, explicitly,
 *  the AI crawlers that power answer engines (maximum AI visibility is the
 *  goal). Only the API surface stays dark.
 *
 *  The named AI group repeats the same rules as `*` — redundant in effect, but
 *  it makes the intent legible and survives any future tightening of `*`.
 *  Google-Extended and Applebot-Extended are robots-token-only opt-ins (they
 *  never fetch pages themselves); listing them keeps Gemini/Apple Intelligence
 *  grounding enabled. */

const DISALLOW = ["/api/"];

const AI_CRAWLERS = [
  "GPTBot", // OpenAI training
  "OAI-SearchBot", // ChatGPT search index — required to appear in ChatGPT search answers
  "ChatGPT-User", // ChatGPT live user-initiated fetches
  "ClaudeBot", // Anthropic training
  "Claude-User", // Claude live fetches
  "Claude-SearchBot", // Claude search index
  "anthropic-ai", // Anthropic legacy token
  "PerplexityBot", // Perplexity index
  "Perplexity-User", // Perplexity live fetches
  "Google-Extended", // Gemini / AI Overviews grounding opt-in (robots token)
  "Applebot-Extended", // Apple Intelligence opt-in (robots token)
  "Bytespider", // ByteDance
  "CCBot", // Common Crawl — feeds most open training corpora
  "cohere-ai",
  "meta-externalagent", // Meta AI
  "Amazonbot", // Amazon Rufus / Alexa
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
