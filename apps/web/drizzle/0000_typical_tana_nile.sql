CREATE TYPE "public"."submission_status" AS ENUM('pending', 'scored', 'contacted', 'archived', 'spam', 'duplicate');--> statement-breakpoint
CREATE TYPE "public"."submission_type" AS ENUM('idea', 'mentorship', 'sponsorship');--> statement-breakpoint
CREATE TABLE "invite_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_hash" text NOT NULL,
	"issued_by" text NOT NULL,
	"uses_remaining" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invite_codes_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "submission_type" NOT NULL,
	"description" text NOT NULL,
	"proof_url" text,
	"contact_name" text NOT NULL,
	"contact_platform" text NOT NULL,
	"contact_value" text NOT NULL,
	"score" integer,
	"score_rationale" text,
	"score_model" text,
	"score_prompt_version" text,
	"scored_at" timestamp with time zone,
	"invite_code_id" uuid,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_invite_code_id_invite_codes_id_fk" FOREIGN KEY ("invite_code_id") REFERENCES "public"."invite_codes"("id") ON DELETE no action ON UPDATE no action;