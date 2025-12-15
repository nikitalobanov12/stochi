"use client";

/**
 * React Hook for Semantic Search
 *
 * Manages the Web Worker lifecycle and provides a clean API for
 * searching supplements using vector similarity.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { getSupplementsWithAliases } from "./command-parser";

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
  const searchIdCounter = useRef(0);

  // Initialize worker
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") {
      return;
    }

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
          worker.postMessage({ type: "init" });
          break;

        case "progress":
          setLoadProgress(event.data.progress);
          break;

        case "ready":
          setStatus("ready");
          setLoadProgress(100);
          break;

        case "searchResults": {
          const { id, results } = event.data;
          const callback = pendingSearches.current.get(id);
          if (callback) {
            callback(results);
            pendingSearches.current.delete(id);
          }
          break;
        }

        case "precomputeComplete":
          setIsPrecomputed(true);
          break;

        case "error":
          console.error("Semantic search worker error:", event.data.error);
          setStatus("error");
          break;
      }
    };

    worker.onerror = (error) => {
      console.error("Worker error:", error);
      setStatus("error");
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Precompute embeddings when ready and supplements change
  useEffect(() => {
    if (status !== "ready" || !workerRef.current || supplements.length === 0) {
      return;
    }

    const supplementsWithAliases = getSupplementsWithAliases(supplements);
    const id = `precompute-${Date.now()}`;

    workerRef.current.postMessage({
      type: "precompute",
      id,
      supplements: supplementsWithAliases,
    });
  }, [status, supplements]);

  // Search function
  const search = useCallback(
    async (query: string): Promise<SearchResult[]> => {
      if (status !== "ready" || !workerRef.current || !query.trim()) {
        return [];
      }

      const id = `search-${searchIdCounter.current++}`;
      const supplementsWithAliases = getSupplementsWithAliases(supplements);

      return new Promise((resolve) => {
        pendingSearches.current.set(id, resolve);
        workerRef.current!.postMessage({
          type: "search",
          id,
          query: query.trim(),
          candidates: supplementsWithAliases,
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          if (pendingSearches.current.has(id)) {
            pendingSearches.current.delete(id);
            resolve([]);
          }
        }, 5000);
      });
    },
    [status, supplements]
  );

  return {
    search,
    status,
    loadProgress,
    isReady: status === "ready",
    isPrecomputed,
  };
}
