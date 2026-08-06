import { pgTable, uuid, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const submissionType = pgEnum("submission_type", ["idea", "mentorship", "sponsorship"]);

export const submissionStatus = pgEnum("submission_status", [
  "pending",
  "scored",
  "contacted",
  "archived",
  "spam",
  "duplicate",
]);

export const inviteCodes = pgTable("invite_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  codeHash: text("code_hash").notNull().unique(),
  // Plaintext, admin-visible copy of the code. Redemption itself only ever
  // checks codeHash (see submitIdea's handler) -- this column exists purely
  // so Mel can see which code to hand out to whom in the admin dashboard.
  // A deliberate, scoped exception to "hashed, never stored plaintext":
  // these are single-use, idea-submission-gate tokens, not passwords, and
  // the person issuing them needs to read them back.
  code: text("code"),
  issuedBy: text("issued_by").notNull(),
  usesRemaining: integer("uses_remaining").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Per-IP abuse mitigation for the open (non-invite-gated) mentor/sponsor
// routes. One row per attempt so the count is a real DB query, not an
// in-memory counter (Vercel functions don't share memory across invocations).
export const rateLimitHits = pgTable("rate_limit_hits", {
  id: uuid("id").primaryKey().defaultRandom(),
  ip: text("ip").notNull(),
  route: text("route").notNull(), // "mentorship" | "sponsorship"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: submissionType("type").notNull(),
  description: text("description").notNull(),
  proofUrl: text("proof_url"),
  contactName: text("contact_name").notNull(),
  contactPlatform: text("contact_platform").notNull(),
  contactValue: text("contact_value").notNull(),
  score: integer("score"),
  scoreRationale: text("score_rationale"),
  scoreModel: text("score_model"),
  scorePromptVersion: text("score_prompt_version"),
  scoredAt: timestamp("scored_at", { withTimezone: true }),
  inviteCodeId: uuid("invite_code_id").references(() => inviteCodes.id),
  status: submissionStatus("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
