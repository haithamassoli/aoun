const ALIAS_SEPARATORS = /[.,،\-_\/]+/g;

export function normalizeAlias(value: string): string {
  return value
    .trim()
    .normalize("NFC")
    .replace(ALIAS_SEPARATORS, " ")
    .replace(/\s+/g, " ")
    .trim();
}
