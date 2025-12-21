CREATE TABLE "dismissed_suggestion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"suggestion_key" text NOT NULL,
	"dismissed_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"show_add_suggestions" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_preference_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "dismissed_suggestion" ADD CONSTRAINT "dismissed_suggestion_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dismissed_suggestion_user_idx" ON "dismissed_suggestion" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dismissed_suggestion_key_idx" ON "dismissed_suggestion" USING btree ("user_id","suggestion_key");