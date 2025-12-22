#!/usr/bin/env bun
/**
 * Seed Knowledge Script
 *
 * Scrapes Examine.com pages for supplements with researchUrl set,
 * generates embeddings, and populates the supplement_knowledge table.
 *
 * Usage:
 *   bun run scripts/seed-knowledge.ts [--dry-run] [--supplement <name>]
 *
 * Options:
 *   --dry-run         Don't write to database, just show what would be done
 *   --supplement      Only process a specific supplement by name
 *   --force           Re-scrape even if knowledge already exists
 */

import { eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../src/server/db";
import { supplement, supplementKnowledge } from "../src/server/db/schema";
import { scrapeExaminePage } from "../src/server/services/examine-scraper";
import {
  generateEmbeddings,
  isEmbeddingsEnabled,
} from "../src/server/services/embeddings";

// ============================================================================
// Configuration
// ============================================================================

const DELAY_BETWEEN_REQUESTS_MS = 2000; // Be respectful to Examine.com
const BATCH_SIZE = 10; // Embeddings per batch

// ============================================================================
// CLI Argument Parsing
// ============================================================================

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const forceRescrape = args.includes("--force");
const supplementNameArg = args.includes("--supplement")
  ? args[args.indexOf("--supplement") + 1]
  : null;

// ============================================================================
// Main Script
// ============================================================================

async function main() {
  console.log("🧪 Supplement Knowledge Seeder");
  console.log("================================");

  if (dryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  }

  // Check if embeddings are enabled
  if (!isEmbeddingsEnabled()) {
    console.error(
      "❌ OPENAI_API_KEY is not configured. Cannot generate embeddings.",
    );
    process.exit(1);
  }

  // Get supplements with research URLs
  const supplementsQuery = db
    .select({
      id: supplement.id,
      name: supplement.name,
      researchUrl: supplement.researchUrl,
    })
    .from(supplement)
    .where(isNotNull(supplement.researchUrl));

  const supplements = await supplementsQuery;

  // Filter by name if specified
  const filteredSupplements = supplementNameArg
    ? supplements.filter((s) =>
        s.name.toLowerCase().includes(supplementNameArg.toLowerCase()),
      )
    : supplements;

  console.log(
    `📋 Found ${filteredSupplements.length} supplements with research URLs\n`,
  );

  if (filteredSupplements.length === 0) {
    console.log("No supplements to process.");
    return;
  }

  // Track statistics
  const stats = {
    processed: 0,
    skipped: 0,
    scraped: 0,
    chunks: 0,
    embeddings: 0,
    errors: 0,
  };

  for (const supp of filteredSupplements) {
    console.log(`\n📦 Processing: ${supp.name}`);
    console.log(`   URL: ${supp.researchUrl}`);

    // Check if we already have knowledge for this supplement
    if (!forceRescrape) {
      const existingCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(supplementKnowledge)
        .where(eq(supplementKnowledge.supplementId, supp.id));

      if ((existingCount[0]?.count ?? 0) > 0) {
        console.log(
          `   ⏭️  Skipping - already has ${existingCount[0]?.count} chunks`,
        );
        stats.skipped++;
        continue;
      }
    }

    // Scrape the page
    const scraped = await scrapeExaminePage(supp.researchUrl!, supp.name);

    if (!scraped || scraped.chunks.length === 0) {
      console.log("   ⚠️  No content scraped");
      stats.errors++;
      continue;
    }

    console.log(`   ✅ Scraped ${scraped.chunks.length} chunks`);
    stats.scraped++;

    if (dryRun) {
      // Show what would be inserted
      for (const chunk of scraped.chunks) {
        console.log(
          `      - [${chunk.chunkType}] ${chunk.title} (${chunk.content.length} chars)`,
        );
      }
      stats.chunks += scraped.chunks.length;
      stats.processed++;
      continue;
    }

    // Delete existing knowledge if force re-scraping
    if (forceRescrape) {
      await db
        .delete(supplementKnowledge)
        .where(eq(supplementKnowledge.supplementId, supp.id));
      console.log("   🗑️  Deleted existing knowledge");
    }

    // Generate embeddings in batches
    const chunksToEmbed = scraped.chunks.map((c) => c.content);
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < chunksToEmbed.length; i += BATCH_SIZE) {
      const batch = chunksToEmbed.slice(i, i + BATCH_SIZE);
      console.log(
        `   🔢 Generating embeddings batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunksToEmbed.length / BATCH_SIZE)}`,
      );

      try {
        const result = await generateEmbeddings(batch);
        allEmbeddings.push(...result.embeddings);
        stats.embeddings += result.embeddings.length;
      } catch (error) {
        console.error(
          `   ❌ Embedding error: ${error instanceof Error ? error.message : "Unknown"}`,
        );
        stats.errors++;
        continue;
      }
    }

    // Insert chunks with embeddings
    const insertValues = scraped.chunks.map((chunk, index) => ({
      supplementId: supp.id,
      chunkType: chunk.chunkType as
        | "overview"
        | "benefits"
        | "risks"
        | "dosing"
        | "timing"
        | "interactions"
        | "mechanism"
        | "faq",
      title: chunk.title,
      content: chunk.content,
      sourceUrl: scraped.sourceUrl,
      embedding: allEmbeddings[index] ?? null,
      metadata: chunk.metadata,
      chunkIndex: index,
    }));

    try {
      await db.insert(supplementKnowledge).values(insertValues);
      console.log(`   💾 Inserted ${insertValues.length} chunks`);
      stats.chunks += insertValues.length;
      stats.processed++;
    } catch (error) {
      console.error(
        `   ❌ Insert error: ${error instanceof Error ? error.message : "Unknown"}`,
      );
      stats.errors++;
    }

    // Rate limiting
    if (filteredSupplements.indexOf(supp) < filteredSupplements.length - 1) {
      console.log(
        `   ⏳ Waiting ${DELAY_BETWEEN_REQUESTS_MS / 1000}s before next request...`,
      );
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  // Print summary
  console.log("\n================================");
  console.log("📊 Summary");
  console.log("================================");
  console.log(`   Processed: ${stats.processed}`);
  console.log(`   Skipped:   ${stats.skipped}`);
  console.log(`   Scraped:   ${stats.scraped}`);
  console.log(`   Chunks:    ${stats.chunks}`);
  console.log(`   Embeddings: ${stats.embeddings}`);
  console.log(`   Errors:    ${stats.errors}`);

  if (dryRun) {
    console.log("\n🔍 This was a dry run. No changes were made.");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the script
main()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
