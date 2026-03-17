export function decodeSlugParam(value: string): string {
  try {
    return decodeURIComponent(value).normalize("NFC");
  } catch {
    return value.normalize("NFC");
  }
}

export function normalizeSlugLookup(value: string): string {
  return decodeSlugParam(value).trim().toLowerCase();
}

export function isSameSlug(candidate: string, target: string): boolean {
  return normalizeSlugLookup(candidate) === normalizeSlugLookup(target);
}

export const normalizeSlug = (value: string) =>
  value
    .trim()
    .normalize("NFC")
    .replace(/[/?#%]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export const generateSlug = (name: string) => normalizeSlug(name);
