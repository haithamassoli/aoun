"use client";

import { useEffect, useMemo, useState } from "react";
import {
  isPublicSearchQueryEmpty,
  normalizePublicSearchQuery,
  PUBLIC_SEARCH_CONTRACT,
} from "@/lib/public-search";

export function useDebouncedPublicSearch() {
  const [input, setInput] = useState("");
  const normalizedInput = useMemo(
    () => normalizePublicSearchQuery(input),
    [input],
  );
  const [query, setQuery] = useState(normalizedInput);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isPublicSearchQueryEmpty(normalizedInput)) {
        setQuery("");
        return;
      }

      setQuery(normalizedInput);
    }, isPublicSearchQueryEmpty(normalizedInput) ? 0 : PUBLIC_SEARCH_CONTRACT.debounceMs);

    return () => clearTimeout(timeout);
  }, [normalizedInput]);

  const isDebouncing =
    !isPublicSearchQueryEmpty(normalizedInput) && normalizedInput !== query;

  return {
    input,
    setInput,
    query,
    isEmpty: query.length === 0,
    isDebouncing,
  };
}
