-- Smart suggestion quality filtering feature
-- Controls which supplements are suggested based on user context

-- Synergy strength enum (for interaction table)
CREATE TYPE "public"."synergy_strength" AS ENUM('critical', 'strong', 'moderate', 'weak');--> statement-breakpoint

-- Experience level enum (for user preferences)
CREATE TYPE "public"."experience_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint

-- Suggestion filter level enum (for user preferences)
CREATE TYPE "public"."suggestion_filter_level" AS ENUM('critical_only', 'strong', 'moderate', 'all');--> statement-breakpoint

-- Add suggestion profile JSONB column to supplement table
-- Contains: requiresDeficiency, relevantBiomarkers, deficiencyWarning, chronicUseRisk, chronicUseWarning, minExperienceLevel
ALTER TABLE "supplement" ADD COLUMN "suggestion_profile" jsonb;--> statement-breakpoint

-- Add synergy strength to interaction table (only applies to type='synergy')
ALTER TABLE "interaction" ADD COLUMN "synergy_strength" "synergy_strength";--> statement-breakpoint

-- Add smart suggestion preferences to user_preference table
ALTER TABLE "user_preference" ADD COLUMN "experience_level" "experience_level" DEFAULT 'beginner';--> statement-breakpoint
ALTER TABLE "user_preference" ADD COLUMN "suggestion_filter_level" "suggestion_filter_level" DEFAULT 'strong';--> statement-breakpoint
ALTER TABLE "user_preference" ADD COLUMN "show_conditional_supplements" boolean DEFAULT false NOT NULL;
