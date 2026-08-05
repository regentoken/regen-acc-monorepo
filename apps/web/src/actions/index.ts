import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { db } from "../db/client";
import { inviteCodes, submissions } from "../db/schema";

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
    handler: async (input) => {
      if (input.website) {
        return { ok: true };
      }
      await insertSubmission("mentorship", input);
      return { ok: true };
    },
  }),

  submitSponsorship: defineAction({
    accept: "form",
    input: z.object(baseInput),
    handler: async (input) => {
      if (input.website) {
        return { ok: true };
      }
      await insertSubmission("sponsorship", input);
      return { ok: true };
    },
  }),
};
