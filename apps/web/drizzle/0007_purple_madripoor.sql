CREATE TYPE "public"."cyp450_effect" AS ENUM('substrate', 'inhibitor', 'inducer');--> statement-breakpoint
CREATE TYPE "public"."cyp450_enzyme" AS ENUM('CYP1A2', 'CYP2C9', 'CYP2C19', 'CYP2D6', 'CYP3A4', 'CYP2E1');--> statement-breakpoint
CREATE TYPE "public"."meal_context" AS ENUM('fasted', 'with_meal', 'with_fat', 'post_meal');--> statement-breakpoint
ALTER TYPE "public"."route_of_administration" ADD VALUE 'sublingual' BEFORE 'subq_injection';--> statement-breakpoint
ALTER TYPE "public"."route_of_administration" ADD VALUE 'rectal';--> statement-breakpoint
CREATE TABLE "cyp450_pathway" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplement_id" uuid NOT NULL,
	"enzyme" "cyp450_enzyme" NOT NULL,
	"effect" "cyp450_effect" NOT NULL,
	"strength" text,
	"clinical_note" text,
	"research_url" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "log" ADD COLUMN "route" "route_of_administration" DEFAULT 'oral';--> statement-breakpoint
ALTER TABLE "log" ADD COLUMN "meal_context" "meal_context";--> statement-breakpoint
ALTER TABLE "cyp450_pathway" ADD CONSTRAINT "cyp450_pathway_supplement_id_supplement_id_fk" FOREIGN KEY ("supplement_id") REFERENCES "public"."supplement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cyp450_supplement_idx" ON "cyp450_pathway" USING btree ("supplement_id");--> statement-breakpoint
CREATE INDEX "cyp450_enzyme_idx" ON "cyp450_pathway" USING btree ("enzyme");