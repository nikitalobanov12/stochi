CREATE TYPE "public"."biomarker_type" AS ENUM('25_oh_d', 'ferritin', 'serum_iron', 'rbc_magnesium', 'serum_zinc', 'serum_copper', 'b12', 'folate');--> statement-breakpoint
CREATE TYPE "public"."cyp450_evidence_type" AS ENUM('in_vivo_human', 'in_vitro_microsomes', 'animal_model', 'theoretical');--> statement-breakpoint
CREATE TYPE "public"."kinetics_type" AS ENUM('first_order', 'michaelis_menten');--> statement-breakpoint
CREATE TABLE "user_biomarker" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"supplement_id" uuid,
	"biomarker_type" "biomarker_type" NOT NULL,
	"value" real NOT NULL,
	"unit" text NOT NULL,
	"measured_at" timestamp with time zone NOT NULL,
	"calibrated_f" real,
	"calibrated_cl" real,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cyp450_pathway" ADD COLUMN "confidence_score" real DEFAULT 0.5;--> statement-breakpoint
ALTER TABLE "cyp450_pathway" ADD COLUMN "evidence_type" "cyp450_evidence_type" DEFAULT 'in_vitro_microsomes';--> statement-breakpoint
ALTER TABLE "supplement" ADD COLUMN "kinetics_type" "kinetics_type" DEFAULT 'first_order';--> statement-breakpoint
ALTER TABLE "supplement" ADD COLUMN "vmax" real;--> statement-breakpoint
ALTER TABLE "supplement" ADD COLUMN "km" real;--> statement-breakpoint
ALTER TABLE "supplement" ADD COLUMN "absorption_saturation_dose" real;--> statement-breakpoint
ALTER TABLE "supplement" ADD COLUMN "rda_amount" real;--> statement-breakpoint
ALTER TABLE "user_biomarker" ADD CONSTRAINT "user_biomarker_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_biomarker" ADD CONSTRAINT "user_biomarker_supplement_id_supplement_id_fk" FOREIGN KEY ("supplement_id") REFERENCES "public"."supplement"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_biomarker_user_idx" ON "user_biomarker" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_biomarker_type_idx" ON "user_biomarker" USING btree ("biomarker_type");