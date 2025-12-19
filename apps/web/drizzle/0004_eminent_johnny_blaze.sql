CREATE TYPE "public"."route_of_administration" AS ENUM('oral', 'subq_injection', 'im_injection', 'intranasal', 'transdermal', 'topical');--> statement-breakpoint
ALTER TYPE "public"."supplement_category" ADD VALUE 'peptide' BEFORE 'other';--> statement-breakpoint
ALTER TABLE "supplement" ADD COLUMN "is_research_chemical" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "supplement" ADD COLUMN "route" "route_of_administration" DEFAULT 'oral' NOT NULL;--> statement-breakpoint
ALTER TABLE "supplement" ADD COLUMN "storage_instructions" text;