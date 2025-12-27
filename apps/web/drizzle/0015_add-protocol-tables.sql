-- Protocol feature enums
CREATE TYPE "public"."time_slot" AS ENUM('morning', 'afternoon', 'evening', 'bedtime');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('daily', 'specific_days', 'as_needed');--> statement-breakpoint

-- Protocol table (one per user)
CREATE TABLE "protocol" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'My Protocol' NOT NULL,
	"auto_log_enabled" boolean DEFAULT false NOT NULL,
	"morning_time" text DEFAULT '08:00' NOT NULL,
	"afternoon_time" text DEFAULT '12:00' NOT NULL,
	"evening_time" text DEFAULT '18:00' NOT NULL,
	"bedtime_time" text DEFAULT '22:00' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "protocol_user_id_unique" UNIQUE("user_id")
);--> statement-breakpoint

-- Protocol item table (supplements in protocol)
CREATE TABLE "protocol_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" uuid NOT NULL,
	"supplement_id" uuid NOT NULL,
	"dosage" real NOT NULL,
	"unit" "dosage_unit" NOT NULL,
	"time_slot" "time_slot" NOT NULL,
	"frequency" "frequency" DEFAULT 'daily' NOT NULL,
	"days_of_week" text[],
	"group_name" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);--> statement-breakpoint

-- Add frequency fields to supplement table
ALTER TABLE "supplement" ADD COLUMN "suggested_frequency" "frequency";--> statement-breakpoint
ALTER TABLE "supplement" ADD COLUMN "frequency_notes" text;--> statement-breakpoint

-- Foreign keys
ALTER TABLE "protocol" ADD CONSTRAINT "protocol_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_item" ADD CONSTRAINT "protocol_item_protocol_id_protocol_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocol"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_item" ADD CONSTRAINT "protocol_item_supplement_id_supplement_id_fk" FOREIGN KEY ("supplement_id") REFERENCES "public"."supplement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Indexes
CREATE INDEX "protocol_item_protocol_idx" ON "protocol_item" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "protocol_item_time_slot_idx" ON "protocol_item" USING btree ("protocol_id","time_slot");
