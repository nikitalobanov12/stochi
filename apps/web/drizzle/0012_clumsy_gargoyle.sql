-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."chunk_type" AS ENUM('overview', 'benefits', 'risks', 'dosing', 'timing', 'interactions', 'mechanism', 'faq');--> statement-breakpoint
CREATE TABLE "supplement_knowledge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplement_id" uuid NOT NULL,
	"chunk_type" "chunk_type" NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"metadata" text,
	"source_url" text,
	"scraped_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "supplement_knowledge" ADD CONSTRAINT "supplement_knowledge_supplement_id_supplement_id_fk" FOREIGN KEY ("supplement_id") REFERENCES "public"."supplement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "supplement_knowledge_supplement_idx" ON "supplement_knowledge" USING btree ("supplement_id");--> statement-breakpoint
CREATE INDEX "supplement_knowledge_chunk_type_idx" ON "supplement_knowledge" USING btree ("chunk_type");--> statement-breakpoint
-- HNSW index for fast vector similarity search (cosine distance)
CREATE INDEX "supplement_knowledge_embedding_idx" ON "supplement_knowledge" USING hnsw ("embedding" vector_cosine_ops);
