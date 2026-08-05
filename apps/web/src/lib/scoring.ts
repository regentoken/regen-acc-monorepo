import OpenAI from "openai";
import { z } from "astro:schema";

// Locked brand voice / product logic (RGA-012) — verbatim, do not rephrase.
const SCORING_SYSTEM_PROMPT = `You are Reggie, the mushroom mascot and voice of Regen Accelerator (regen/acc). You score how "regen" a submitted idea is, using this rubric. Score each dimension from 1 to 10:

1. Regen impact: does this make life more human, help real builders or people directly, versus pure hype, extraction, or tech for its own sake?
2. Buildability: is this concrete enough to actually ship using AI leverage (regenmaxxing), not vague ambition?
3. Momentum: is there existing proof of work, real traction, or a clear next step, versus a pure idea with nothing behind it?

Sum the three scores (max 30) and convert to a 0 to 100 overall score: score = round(sum / 30 * 100).

Then write a short rationale, 2 to 4 sentences, in Reggie's voice: playful, self-aware, warm, optimist. Be honest, not falsely encouraging. Never use an em-dash. Never mention capital, funding, grants, or investment. Never use corporate language.

Return strict JSON only, no markdown fences, matching this shape:
{"regenImpact": <1-10>, "buildability": <1-10>, "momentum": <1-10>, "score": <0-100>, "rationale": "<string>"}`;

const scoringResultSchema = z.object({
  regenImpact: z.number().int().min(1).max(10),
  buildability: z.number().int().min(1).max(10),
  momentum: z.number().int().min(1).max(10),
  score: z.number().int().min(0).max(100),
  rationale: z.string().min(1),
});

export type ScoringResult = {
  regenImpact: number;
  buildability: number;
  momentum: number;
  score: number;
  rationale: string;
};

export async function scoreIdea({
  description,
  proofUrl,
}: {
  description: string;
  proofUrl?: string | null;
}): Promise<ScoringResult> {
  // Read via process.env, never import.meta.env — see turbo.json's build/dev
  // `env` arrays and apps/web/src/db/client.ts for the convention (Vite
  // statically inlines import.meta.env.X at build time, which both bakes the
  // literal secret into the compiled artifact and breaks under Turborepo,
  // which strips undeclared env vars from the build task).
  const apiKey = process.env.NEBIUS_API_KEY;
  const baseURL = process.env.NEBIUS_BASE_URL;
  const model = process.env.NEBIUS_MODEL;

  if (!apiKey || !baseURL || !model) {
    throw new Error(
      "Scoring is not configured: NEBIUS_API_KEY, NEBIUS_BASE_URL, or NEBIUS_MODEL is missing.",
    );
  }

  const client = new OpenAI({ apiKey, baseURL });

  const userMessage = [`Description: ${description}`, proofUrl ? `Proof URL: ${proofUrl}` : null]
    .filter(Boolean)
    .join("\n");

  let completion;
  try {
    completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SCORING_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Scoring request to Nebius failed: ${message}`);
  }

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Scoring response was empty.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Scoring response was not valid JSON.");
  }

  const result = scoringResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Scoring response did not match the expected shape: ${result.error.message}`);
  }

  return {
    ...result.data,
    // The system prompt says never use an em-dash, but LLMs don't reliably
    // follow style instructions (observed in testing) — the em-dash ban is
    // an absolute brand rule (design-brief.md), so enforce it here rather
    // than trust the model.
    rationale: result.data.rationale.replace(/\s*—\s*/g, " - "),
  };
}
