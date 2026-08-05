import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { db } from "../db/client";
import { inviteCodes, submissions } from "../db/schema";

// Submit an idea/mentorship/sponsorship ask. One action, one shared form —
// see docs/v2-request-for-regens/architecture.md for the access-control and
// scoring design this implements.
export const server = {
  submit: defineAction({
    accept: "form",
    input: z.object({
      type: z.enum(["idea", "mentorship", "sponsorship"]),
      description: z.string().min(1, "Tell us a bit more."),
      proofUrl: z.string().nullable().optional(),
      contactName: z.string().min(1, "Let us know who you are."),
      contactPlatform: z.string().min(1),
      contactValue: z.string().min(1, "We need a way to reach you."),
      inviteCode: z.string().nullable().optional(),
      // Honeypot: real visitors never fill this in. Checked before the
      // invite code so an invalid code never gets a distinguishable error
      // from a bot hit (timing/error-signal leak — see architecture.md).
      website: z.string().nullable().optional(),
    }),
    handler: async (input) => {
      if (input.website) {
        return { ok: true };
      }

      let inviteCodeId: string | null = null;

      if (input.type === "idea") {
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

        inviteCodeId = redeemed.id;
      }

      await db.insert(submissions).values({
        type: input.type,
        description: input.description,
        proofUrl: input.proofUrl || null,
        contactName: input.contactName,
        contactPlatform: input.contactPlatform,
        contactValue: input.contactValue,
        inviteCodeId,
      });

      return { ok: true };
    },
  }),
};
