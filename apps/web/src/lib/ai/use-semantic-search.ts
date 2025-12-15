"use client";

/**
 * React Hook for Semantic Search
 *
 * Manages the Web Worker lifecycle and provides a clean API for
 * searching supplements using vector similarity.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { getSupplementsWithAliases } from "./command-parser";
import { logger } from "~/lib/logger";

export type SearchResult = {
  id: string;
  name: string;
  form: string | null;
  score: number;
};

type WorkerStatus = "idle" | "loading" | "ready" | "error";

type WorkerResponse =
  | { type: "loaded" }
  | { type: "progress"; progress: number }
  | { type: "ready" }
  | { type: "searchResults"; id: string; results: SearchResult[] }
  | { type: "precomputeComplete"; id: string }
  | { type: "error"; error: string };

type SupplementCandidate = {
  id: string;
  name: string;
  form: string | null;
  aliases?: string[];
};

export function useSemanticSearch(supplements: SupplementCandidate[]) {
  const workerRef = useRef<Worker | null>(null);
  // Initialize as "loading" to avoid a synchronous setState in the effect
  const [status, setStatus] = useState<WorkerStatus>("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const [isPrecomputed, setIsPrecomputed] = useState(false);
  const pendingSearches = useRef<
    Map<string, (results: SearchResult[]) => void>
  >(new Map());
  const pendingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const searchIdCounter = useRef(0);

  // Memoize supplements with aliases to avoid recalculating on every search
  const supplementsWithAliases = useMemo(
    () => getSupplementsWithAliases(supplements),
    [supplements]
  );

  // Initialize worker
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") {
      return;
    }

    // Capture refs for cleanup
    const timeouts = pendingTimeouts.current;
    const searches = pendingSearches.current;

    // Create worker
    const worker = new Worker(
      new URL("~/workers/semantic-search.worker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current = worker;

    // Handle messages from worker
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type } = event.data;

      switch (type) {
        case "loaded":
          // Worker script loaded, initialize the model
          logger.info("Worker loaded, initializing model...", { context: "SemanticSearch" });
          worker.postMessage({ type: "init" });
          break;

        case "progress":
          setLoadProgress(event.data.progress);
          if (event.data.progress % 25 === 0) {
            logger.debug(`Model loading: ${event.data.progress}%`, { context: "SemanticSearch" });
          }
          break;

        case "ready":
          setStatus("ready");
          setLoadProgress(100);
          logger.info("AI semantic search ready", { context: "SemanticSearch" });
          break;

        case "searchResults": {
          const { id, results } = event.data;
          // Clear the timeout for this search
          const timeout = timeouts.get(id);
          if (timeout) {
            clearTimeout(timeout);
            timeouts.delete(id);
          }
          const callback = searches.get(id);
          if (callback) {
            callback(results);
            searches.delete(id);
          }
          logger.debug(`Search completed: ${results.length} results`, { context: "SemanticSearch" });
          break;
        }

        case "precomputeComplete":
          setIsPrecomputed(true);
          logger.info("Supplement embeddings precomputed", { context: "SemanticSearch" });
          break;

        case "error":
          logger.error("Semantic search worker error", { context: "SemanticSearch", data: event.data.error });
          setStatus("error");
          break;
      }
    };

    worker.onerror = (error) => {
      logger.error("Worker initialization error", { context: "SemanticSearch", data: error.message });
      setStatus("error");
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      // Clear all pending timeouts on unmount
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
      searches.clear();
    };
  }, []);

  // Precompute embeddings when ready and supplements change
  useEffect(() => {
    if (status !== "ready" || !workerRef.current || supplements.length === 0) {
      return;
    }

    const id = `precompute-${Date.now()}`;

    workerRef.current.postMessage({
      type: "precompute",
      id,
      supplements: supplementsWithAliases,
    });
  }, [status, supplements.length, supplementsWithAliases]);

  // Search function
  const search = useCallback(
    async (query: string): Promise<SearchResult[]> => {
      const worker = workerRef.current;
      if (status !== "ready" || !worker || !query.trim()) {
        return [];
      }

      const id = `search-${searchIdCounter.current++}`;

      return new Promise((resolve) => {
        pendingSearches.current.set(id, resolve);
        worker.postMessage({
          type: "search",
          id,
          query: query.trim(),
          candidates: supplementsWithAliases,
        });

        // Timeout after 5 seconds - tracked for cleanup
        const timeout = setTimeout(() => {
          pendingTimeouts.current.delete(id);
          if (pendingSearches.current.has(id)) {
            pendingSearches.current.delete(id);
            resolve([]);
          }
        }, 5000);
        pendingTimeouts.current.set(id, timeout);
      });
    },
    [status, supplementsWithAliases]
  );

  return {
    search,
    status,
    loadProgress,
    isReady: status === "ready",
    isPrecomputed,
  };
}
