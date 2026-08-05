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
  issuedBy: text("issued_by").notNull(),
  usesRemaining: integer("uses_remaining").notNull().default(1),
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
