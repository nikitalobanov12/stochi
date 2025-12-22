/**
 * Examine.com Scraper Service
 *
 * Scrapes and parses supplement research pages from Examine.com
 * to populate the RAG knowledge base.
 */

import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { logger } from "~/lib/logger";

// ============================================================================
// Types
// ============================================================================

export type ChunkType =
  | "overview"
  | "benefits"
  | "risks"
  | "dosing"
  | "timing"
  | "interactions"
  | "mechanism"
  | "faq";

export type ScrapedChunk = {
  chunkType: ChunkType;
  title: string;
  content: string;
  metadata: {
    evidenceRating?: string;
    studyCount?: number;
    tokenCount?: number;
    overlapPrev?: boolean;
  };
};

export type ScrapedSupplement = {
  name: string;
  sourceUrl: string;
  chunks: ScrapedChunk[];
  scrapedAt: Date;
};

// ============================================================================
// Configuration
// ============================================================================

const USER_AGENT =
  "Mozilla/5.0 (compatible; StochiBot/1.0; +https://stochi.app)";
const REQUEST_TIMEOUT_MS = 15000;
const CHUNK_SIZE = 800; // Target tokens per chunk (~3200 chars)
const CHUNK_OVERLAP = 200; // Overlap tokens (~800 chars)

// Section selectors based on Examine.com's HTML structure
// These may need updating if Examine changes their layout
const SECTION_MAPPINGS: Record<
  string,
  { selector: string; chunkType: ChunkType }[]
> = {
  // Main summary section
  summary: [
    { selector: ".summary-text", chunkType: "overview" },
    { selector: '[data-testid="summary"]', chunkType: "overview" },
    { selector: "#summary", chunkType: "overview" },
    { selector: ".supplement-summary", chunkType: "overview" },
  ],
  // Benefits/effects sections
  benefits: [
    { selector: ".outcomes-section", chunkType: "benefits" },
    { selector: '[data-testid="benefits"]', chunkType: "benefits" },
    { selector: "#benefits", chunkType: "benefits" },
    { selector: ".effect-matrix", chunkType: "benefits" },
  ],
  // Dosage information
  dosing: [
    { selector: ".dosage-section", chunkType: "dosing" },
    { selector: '[data-testid="dosage"]', chunkType: "dosing" },
    { selector: "#how-to-take", chunkType: "dosing" },
    { selector: ".dosage-info", chunkType: "dosing" },
  ],
  // Safety/side effects
  risks: [
    { selector: ".safety-section", chunkType: "risks" },
    { selector: '[data-testid="safety"]', chunkType: "risks" },
    { selector: "#safety", chunkType: "risks" },
    { selector: ".side-effects", chunkType: "risks" },
  ],
  // Drug interactions
  interactions: [
    { selector: ".interactions-section", chunkType: "interactions" },
    { selector: '[data-testid="interactions"]', chunkType: "interactions" },
    { selector: "#drug-interactions", chunkType: "interactions" },
  ],
  // Mechanism of action
  mechanism: [
    { selector: ".mechanism-section", chunkType: "mechanism" },
    { selector: '[data-testid="mechanism"]', chunkType: "mechanism" },
    { selector: "#mechanism", chunkType: "mechanism" },
    { selector: ".pharmacology", chunkType: "mechanism" },
  ],
  // FAQ section
  faq: [
    { selector: ".faq-section", chunkType: "faq" },
    { selector: '[data-testid="faq"]', chunkType: "faq" },
    { selector: "#faq", chunkType: "faq" },
    { selector: ".frequently-asked", chunkType: "faq" },
  ],
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Scrape a supplement page from Examine.com.
 *
 * @param url - The Examine.com URL to scrape
 * @param supplementName - Name of the supplement (for metadata)
 * @returns Scraped content organized by section
 */
export async function scrapeExaminePage(
  url: string,
  supplementName: string,
): Promise<ScrapedSupplement | null> {
  try {
    logger.info(`Scraping Examine.com page for ${supplementName}: ${url}`);

    const html = await fetchPage(url);
    if (!html) {
      logger.warn(`Failed to fetch page for ${supplementName}`);
      return null;
    }

    const $ = cheerio.load(html);
    const chunks = parsePageContent($, supplementName);

    if (chunks.length === 0) {
      logger.warn(`No content found for ${supplementName}, using fallback`);
      // Try fallback parsing
      const fallbackChunks = fallbackParsing($, supplementName);
      if (fallbackChunks.length === 0) {
        return null;
      }
      return {
        name: supplementName,
        sourceUrl: url,
        chunks: fallbackChunks,
        scrapedAt: new Date(),
      };
    }

    logger.info(`Scraped ${chunks.length} chunks for ${supplementName}`);

    return {
      name: supplementName,
      sourceUrl: url,
      chunks,
      scrapedAt: new Date(),
    };
  } catch (error) {
    logger.error(
      `Error scraping ${supplementName}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return null;
  }
}

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Fetch the HTML content of a page.
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      logger.warn(`HTTP ${response.status} for ${url}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        logger.warn(`Timeout fetching ${url}`);
      } else {
        logger.error(`Fetch error for ${url}: ${error.message}`);
      }
    }
    return null;
  }
}

/**
 * Parse the page content and extract sections.
 */
function parsePageContent(
  $: cheerio.CheerioAPI,
  _supplementName: string,
): ScrapedChunk[] {
  const chunks: ScrapedChunk[] = [];

  // Try each section mapping
  for (const [, mappings] of Object.entries(SECTION_MAPPINGS)) {
    for (const mapping of mappings) {
      const elements = $(mapping.selector);
      if (elements.length > 0) {
        elements.each((_index, element) => {
          const content = extractTextContent($, element);
          if (content && content.length > 50) {
            // Skip very short content
            const sectionChunks = chunkContent(
              content,
              mapping.chunkType,
              getSectionTitle($, element, mapping.chunkType),
            );
            chunks.push(...sectionChunks);
          }
        });
        break; // Found content for this section type, move to next
      }
    }
  }

  return chunks;
}

/**
 * Fallback parsing when specific selectors don't match.
 * Extracts main content from common article containers.
 */
function fallbackParsing(
  $: cheerio.CheerioAPI,
  _supplementName: string,
): ScrapedChunk[] {
  const chunks: ScrapedChunk[] = [];

  // Try common content containers
  const contentSelectors = [
    "article",
    "main",
    ".content",
    ".article-content",
    ".post-content",
    '[role="main"]',
  ];

  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      const content = extractTextContent($, element.get(0)!);
      if (content && content.length > 200) {
        // Parse the content into logical sections based on headings
        const parsedSections = parseContentBySections($, element.get(0)!);
        for (const section of parsedSections) {
          chunks.push(...section);
        }
        if (chunks.length > 0) break;
      }
    }
  }

  // If still no content, just grab all paragraphs
  if (chunks.length === 0) {
    const paragraphs: string[] = [];
    $("p").each((_i, el) => {
      const text = $(el).text().trim();
      if (text.length > 50) {
        paragraphs.push(text);
      }
    });

    if (paragraphs.length > 0) {
      const content = paragraphs.join("\n\n");
      chunks.push(...chunkContent(content, "overview", "General Information"));
    }
  }

  return chunks;
}

/**
 * Parse content by finding headings and grouping text under them.
 */
function parseContentBySections(
  $: cheerio.CheerioAPI,
  container: AnyNode,
): ScrapedChunk[][] {
  const sections: ScrapedChunk[][] = [];
  const $container = $(container);

  // Find all headings
  const headings = $container.find("h1, h2, h3, h4");

  headings.each((_i, heading) => {
    const $heading = $(heading);
    const title = $heading.text().trim();
    const chunkType = inferChunkTypeFromTitle(title);

    // Get content until next heading
    const contentParts: string[] = [];
    let $current = $heading.next();

    while ($current.length > 0 && !$current.is("h1, h2, h3, h4")) {
      const text = $current.text().trim();
      if (text.length > 20) {
        contentParts.push(text);
      }
      $current = $current.next();
    }

    if (contentParts.length > 0) {
      const content = contentParts.join("\n\n");
      sections.push(chunkContent(content, chunkType, title));
    }
  });

  return sections;
}

/**
 * Infer chunk type from section title.
 */
function inferChunkTypeFromTitle(title: string): ChunkType {
  const lowerTitle = title.toLowerCase();

  if (
    lowerTitle.includes("summary") ||
    lowerTitle.includes("overview") ||
    lowerTitle.includes("what is")
  ) {
    return "overview";
  }
  if (
    lowerTitle.includes("benefit") ||
    lowerTitle.includes("effect") ||
    lowerTitle.includes("research")
  ) {
    return "benefits";
  }
  if (
    lowerTitle.includes("dosage") ||
    lowerTitle.includes("dose") ||
    lowerTitle.includes("how much")
  ) {
    return "dosing";
  }
  if (
    lowerTitle.includes("safety") ||
    lowerTitle.includes("side effect") ||
    lowerTitle.includes("risk") ||
    lowerTitle.includes("caution")
  ) {
    return "risks";
  }
  if (
    lowerTitle.includes("interaction") ||
    lowerTitle.includes("drug") ||
    lowerTitle.includes("medication")
  ) {
    return "interactions";
  }
  if (
    lowerTitle.includes("mechanism") ||
    lowerTitle.includes("how it works") ||
    lowerTitle.includes("pharmacology")
  ) {
    return "mechanism";
  }
  if (lowerTitle.includes("faq") || lowerTitle.includes("question")) {
    return "faq";
  }
  if (
    lowerTitle.includes("when") ||
    lowerTitle.includes("timing") ||
    lowerTitle.includes("take")
  ) {
    return "timing";
  }

  return "overview"; // Default
}

/**
 * Extract clean text content from an element.
 */
function extractTextContent($: cheerio.CheerioAPI, element: AnyNode): string {
  const $el = $(element);

  // Remove script, style, and nav elements
  $el.find("script, style, nav, header, footer, .sidebar, .ad").remove();

  // Get text and clean it up
  let text = $el.text();

  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Remove common boilerplate patterns
  text = text.replace(
    /Read more\.\.\.|Click to expand|Show more|Subscribe to.*|Sign up for.*/gi,
    "",
  );

  return text;
}

/**
 * Get a section title from context.
 */
function getSectionTitle(
  $: cheerio.CheerioAPI,
  element: AnyNode,
  chunkType: ChunkType,
): string {
  const $el = $(element);

  // Try to find a heading within or before the element
  const heading =
    $el.find("h1, h2, h3, h4").first().text().trim() ||
    $el.prev("h1, h2, h3, h4").text().trim();

  if (heading) {
    return heading;
  }

  // Fallback to default titles
  const defaultTitles: Record<ChunkType, string> = {
    overview: "Overview",
    benefits: "Benefits & Effects",
    risks: "Safety & Side Effects",
    dosing: "Dosage Information",
    timing: "When to Take",
    interactions: "Interactions",
    mechanism: "How It Works",
    faq: "Frequently Asked Questions",
  };

  return defaultTitles[chunkType];
}

/**
 * Split content into overlapping chunks.
 */
function chunkContent(
  content: string,
  chunkType: ChunkType,
  title: string,
): ScrapedChunk[] {
  const chunks: ScrapedChunk[] = [];

  // Approximate tokens as characters / 4
  const charsPerToken = 4;
  const targetChars = CHUNK_SIZE * charsPerToken;
  const overlapChars = CHUNK_OVERLAP * charsPerToken;

  // If content is short enough, return as single chunk
  if (content.length <= targetChars) {
    chunks.push({
      chunkType,
      title,
      content,
      metadata: {
        tokenCount: Math.ceil(content.length / charsPerToken),
        overlapPrev: false,
      },
    });
    return chunks;
  }

  // Split into sentences for better chunk boundaries
  const sentences = content.match(/[^.!?]+[.!?]+/g) ?? [content];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const potentialChunk = currentChunk + sentence;

    if (potentialChunk.length > targetChars && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        chunkType,
        title: chunkIndex === 0 ? title : `${title} (continued)`,
        content: currentChunk.trim(),
        metadata: {
          tokenCount: Math.ceil(currentChunk.length / charsPerToken),
          overlapPrev: chunkIndex > 0,
        },
      });

      // Start new chunk with overlap from end of previous
      const overlapStart = Math.max(0, currentChunk.length - overlapChars);
      currentChunk = currentChunk.slice(overlapStart) + sentence;
      chunkIndex++;
    } else {
      currentChunk = potentialChunk;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      chunkType,
      title: chunkIndex === 0 ? title : `${title} (continued)`,
      content: currentChunk.trim(),
      metadata: {
        tokenCount: Math.ceil(currentChunk.length / charsPerToken),
        overlapPrev: chunkIndex > 0,
      },
    });
  }

  return chunks;
}

// ============================================================================
// Evidence Rating Extraction (Examine.com specific)
// ============================================================================

/**
 * Extract evidence ratings from Examine.com's grading system.
 * These appear as letter grades (A, B, C, D) next to claims.
 */
export function extractEvidenceRatings(
  $: cheerio.CheerioAPI,
): Map<string, string> {
  const ratings = new Map<string, string>();

  // Examine.com uses various patterns for evidence ratings
  const ratingSelectors = [
    ".evidence-grade",
    ".grade-badge",
    "[data-grade]",
    ".rating",
  ];

  for (const selector of ratingSelectors) {
    $(selector).each((_i, el) => {
      const $el = $(el);
      const grade =
        $el.attr("data-grade") ??
        $el
          .text()
          .trim()
          .match(/^[A-D]$/)?.[0];
      const claim =
        $el.closest(".claim, .outcome, .effect").text().trim() ||
        $el.parent().text().trim();

      if (grade && claim) {
        ratings.set(claim.slice(0, 100), grade); // Truncate claim for map key
      }
    });
  }

  return ratings;
}
