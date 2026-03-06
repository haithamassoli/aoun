export const PUBLIC_SEARCH_CONTRACT = {
  debounceMs: 300,
  emptyBehavior: "default_list_order",
} as const;

const ARABIC_DIACRITICS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g;

function normalizeArabic(text: string): string {
  return text
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ىئ]/g, "ي")
    .replace(/ة/g, "ه");
}

function normalizeGeneral(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-_/]/g, " ")
    .replace(/[^\w\s\u0600-\u06FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePublicSearchQuery(query: string): string {
  return normalizeGeneral(normalizeArabic(query));
}

export function isPublicSearchQueryEmpty(query: string): boolean {
  return normalizePublicSearchQuery(query).length === 0;
}
