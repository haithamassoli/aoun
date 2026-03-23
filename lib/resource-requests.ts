export const RESOURCE_REQUEST_KINDS = [
  "missing_resource",
  "resource_suggestion",
] as const;

export type RequestKind = (typeof RESOURCE_REQUEST_KINDS)[number];

export const RESOURCE_REQUEST_STATUSES = ["open", "fulfilled"] as const;

export type RequestStatus = (typeof RESOURCE_REQUEST_STATUSES)[number];

export const REQUEST_KIND_LABELS: Record<RequestKind, string> = {
  missing_resource: "طلب مصدر",
  resource_suggestion: "اقتراح مصدر",
};

export const REQUEST_KIND_OPTIONS = [
  { value: "missing_resource", label: "أحتاج مصدراً لهذه المادة" },
  { value: "resource_suggestion", label: "أقترح مصدراً جديداً" },
] as const;
