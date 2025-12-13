CREATE TYPE "public"."dosage_unit" AS ENUM('mg', 'mcg', 'g', 'IU', 'ml');--> statement-breakpoint
CREATE TYPE "public"."interaction_type" AS ENUM('inhibition', 'synergy', 'competition');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'critical');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"type" "interaction_type" NOT NULL,
	"mechanism" text,
	"severity" "severity" NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"supplement_id" uuid NOT NULL,
	"dosage" real NOT NULL,
	"unit" "dosage_unit" NOT NULL,
	"logged_at" timestamp with time zone NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratio_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_supplement_id" uuid NOT NULL,
	"target_supplement_id" uuid NOT NULL,
	"min_ratio" real,
	"max_ratio" real,
	"optimal_ratio" real,
	"warning_message" text NOT NULL,
	"severity" "severity" NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "stack" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stack_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stack_id" uuid NOT NULL,
	"supplement_id" uuid NOT NULL,
	"dosage" real NOT NULL,
	"unit" "dosage_unit" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"form" text,
	"elemental_weight" real,
	"default_unit" "dosage_unit" DEFAULT 'mg',
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "supplement_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "timing_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_supplement_id" uuid NOT NULL,
	"target_supplement_id" uuid NOT NULL,
	"min_hours_apart" real NOT NULL,
	"reason" text NOT NULL,
	"severity" "severity" NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction" ADD CONSTRAINT "interaction_source_id_supplement_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."supplement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction" ADD CONSTRAINT "interaction_target_id_supplement_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."supplement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log" ADD CONSTRAINT "log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log" ADD CONSTRAINT "log_supplement_id_supplement_id_fk" FOREIGN KEY ("supplement_id") REFERENCES "public"."supplement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratio_rule" ADD CONSTRAINT "ratio_rule_source_supplement_id_supplement_id_fk" FOREIGN KEY ("source_supplement_id") REFERENCES "public"."supplement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratio_rule" ADD CONSTRAINT "ratio_rule_target_supplement_id_supplement_id_fk" FOREIGN KEY ("target_supplement_id") REFERENCES "public"."supplement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stack" ADD CONSTRAINT "stack_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stack_item" ADD CONSTRAINT "stack_item_stack_id_stack_id_fk" FOREIGN KEY ("stack_id") REFERENCES "public"."stack"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stack_item" ADD CONSTRAINT "stack_item_supplement_id_supplement_id_fk" FOREIGN KEY ("supplement_id") REFERENCES "public"."supplement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timing_rule" ADD CONSTRAINT "timing_rule_source_supplement_id_supplement_id_fk" FOREIGN KEY ("source_supplement_id") REFERENCES "public"."supplement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timing_rule" ADD CONSTRAINT "timing_rule_target_supplement_id_supplement_id_fk" FOREIGN KEY ("target_supplement_id") REFERENCES "public"."supplement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interaction_source_idx" ON "interaction" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "interaction_target_idx" ON "interaction" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "log_user_idx" ON "log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "log_logged_at_idx" ON "log" USING btree ("logged_at");--> statement-breakpoint
CREATE INDEX "stack_user_idx" ON "stack" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stack_item_stack_idx" ON "stack_item" USING btree ("stack_id");--> statement-breakpoint
CREATE INDEX "supplement_name_idx" ON "supplement" USING btree ("name");