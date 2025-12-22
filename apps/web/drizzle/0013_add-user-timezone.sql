-- Add timezone column to user_preference table for timezone-aware timing suggestions
ALTER TABLE "user_preference" ADD COLUMN "timezone" text;
