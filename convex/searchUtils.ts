/**
 * Search normalization and token generation utilities.
 * Used to build searchToken fields for universities, majors, and courses.
 */

// Arabic diacritics Unicode range
const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g;

/**
 * Normalize Arabic text per PRD rules:
 * - Remove diacritics
 * - أ إ آ → ا
 * - ى ئ → ي
 * - ة → ه
 */
function normalizeArabic(text: string): string {
  return text
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ىئ]/g, "ي")
    .replace(/ة/g, "ه");
}

/**
 * Normalize English/general text per PRD rules:
 * - Lowercase
 * - Trim
 * - Collapse repeated spaces
 * - Replace separators (- _ /) with space
 * - Remove punctuation noise
 */
function normalizeGeneral(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-_/]/g, " ")
    .replace(/[^\w\s\u0600-\u06FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Full normalization pipeline: Arabic then general rules.
 */
export function normalize(text: string): string {
  return normalizeGeneral(normalizeArabic(text));
}

/**
 * Build searchToken for a university from name + slug + alias.
 */
export function buildUniversitySearchToken(fields: {
  name: string;
  slug: string;
  alias?: string;
}): string {
  return buildToken([fields.name, fields.slug, fields.alias]);
}

/**
 * Build searchToken for a major from name + slug + alias.
 */
export function buildMajorSearchToken(fields: {
  name: string;
  slug: string;
  alias?: string;
}): string {
  return buildToken([fields.name, fields.slug, fields.alias]);
}

/**
 * Build searchToken for a course from name + slug + alias + courseCode.
 */
export function buildCourseSearchToken(fields: {
  name: string;
  slug: string;
  alias?: string;
  courseCode?: string;
}): string {
  return buildToken([fields.name, fields.slug, fields.alias, fields.courseCode]);
}

/**
 * Token build rule per PRD:
 * 1. Collect source fields in order
 * 2. Drop null/empty values
 * 3. Normalize each value
 * 4. Join with single spaces
 */
function buildToken(values: (string | undefined | null)[]): string {
  return values
    .filter((v): v is string => !!v && v.trim().length > 0)
    .map(normalize)
    .join(" ");
}
