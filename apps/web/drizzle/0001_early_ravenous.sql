CREATE TABLE "rate_limit_hits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" text NOT NULL,
	"route" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
