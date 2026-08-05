import { createHash } from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { db } from "../db/client";
import { inviteCodes, rateLimitHits, submissions } from "../db/schema";

// Three separate actions (not one shared "submit"), one per ask. Astro scopes
// getActionResult() by action name, so this is what keeps a result from one
// CtaForm instance (e.g. the idea form) from also rendering as "success" on
// the untouched mentor/sponsor forms sharing the same page. See
// docs/v2-request-for-regens/architecture.md for the access-control and
// scoring design each handler implements.

const baseInput = {
  description: z.string().min(1, "Tell us a bit more."),
  proofUrl: z.string().nullable().optional(),
  contactName: z.string().min(1, "Let us know who you are."),
  contactPlatform: z.string().min(1),
  contactValue: z.string().min(1, "We need a way to reach you."),
  // Honeypot: real visitors never fill this in. Checked before anything
  // else so a bot hit never reaches the invite-code check (which would
  // otherwise leak code validity via a distinguishable error/timing signal
  // — see architecture.md).
  website: z.string().nullable().optional(),
};

type SubmissionInput = {
  description: string;
  proofUrl?: string | null;
  contactName: string;
  contactPlatform: string;
  contactValue: string;
};

async function insertSubmission(
  type: "idea" | "mentorship" | "sponsorship",
  input: SubmissionInput,
  inviteCodeId: string | null = null,
) {
  await db.insert(submissions).values({
    type,
    description: input.description,
    proofUrl: input.proofUrl || null,
    contactName: input.contactName,
    contactPlatform: input.contactPlatform,
    contactValue: input.contactValue,
    inviteCodeId,
  });
}

// Abuse mitigation for the open (non-invite-gated) mentor/sponsor routes.
// DB-backed, not in-memory — Vercel functions don't share memory across
// invocations, so an in-memory counter would silently do nothing.
const RATE_LIMIT_MAX_PER_HOUR = 5;

async function assertUnderRateLimit(route: "mentorship" | "sponsorship", context: ActionAPIContext) {
  const ip = context.clientAddress;

  // Record this attempt first, then count the window it falls in — so a
  // request that gets rate-limited still counts against the next window
  // instead of getting a free retry.
  await db.insert(rateLimitHits).values({ ip, route });

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rateLimitHits)
    .where(and(eq(rateLimitHits.ip, ip), eq(rateLimitHits.route, route), gte(rateLimitHits.createdAt, oneHourAgo)));

  if (count > RATE_LIMIT_MAX_PER_HOUR) {
    throw new ActionError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many submissions from this connection. Try again later.",
    });
  }
}

export const server = {
  submitIdea: defineAction({
    accept: "form",
    input: z.object({ ...baseInput, inviteCode: z.string().nullable().optional() }),
    handler: async (input) => {
      if (input.website) {
        return { ok: true };
      }

      if (!input.inviteCode?.trim()) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "An invite code is required to submit an idea.",
        });
      }

      const codeHash = createHash("sha256").update(input.inviteCode.trim()).digest("hex");

      // Conditional UPDATE ... RETURNING is one atomic statement, so
      // concurrent redemptions of the same code can't both succeed.
      const [redeemed] = await db
        .update(inviteCodes)
        .set({ usesRemaining: sql`${inviteCodes.usesRemaining} - 1` })
        .where(and(eq(inviteCodes.codeHash, codeHash), sql`${inviteCodes.usesRemaining} > 0`))
        .returning({ id: inviteCodes.id });

      if (!redeemed) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "That invite code isn't valid.",
        });
      }

      await insertSubmission("idea", input, redeemed.id);
      return { ok: true };
    },
  }),

  submitMentorship: defineAction({
    accept: "form",
    input: z.object(baseInput),
    handler: async (input, context) => {
      if (input.website) {
        return { ok: true };
      }
      await assertUnderRateLimit("mentorship", context);
      await insertSubmission("mentorship", input);
      return { ok: true };
    },
  }),

  submitSponsorship: defineAction({
    accept: "form",
    input: z.object(baseInput),
    handler: async (input, context) => {
      if (input.website) {
        return { ok: true };
      }
      await assertUnderRateLimit("sponsorship", context);
      await insertSubmission("sponsorship", input);
      return { ok: true };
    },
  }),
};
