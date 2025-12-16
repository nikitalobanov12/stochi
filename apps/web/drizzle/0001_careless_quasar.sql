CREATE TYPE "public"."supplement_category" AS ENUM('mineral', 'vitamin', 'amino-acid', 'adaptogen', 'nootropic', 'antioxidant', 'omega', 'other');--> statement-breakpoint
CREATE TABLE "user_goal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"goal" text NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stack" ADD COLUMN "is_public" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "supplement" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "supplement" ADD COLUMN "mechanism" text;--> statement-breakpoint
ALTER TABLE "supplement" ADD COLUMN "research_url" text;--> statement-breakpoint
ALTER TABLE "supplement" ADD COLUMN "category" "supplement_category";--> statement-breakpoint
ALTER TABLE "supplement" ADD COLUMN "common_goals" text[];--> statement-breakpoint
ALTER TABLE "user_goal" ADD CONSTRAINT "user_goal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_goal_user_idx" ON "user_goal" USING btree ("user_id");