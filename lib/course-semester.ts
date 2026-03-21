const numericSemesterLabels: Record<number, string> = {
  1: "المستوى الأول",
  2: "المستوى الثاني",
  3: "المستوى الثالث",
  4: "المستوى الرابع",
  5: "المستوى الخامس",
  6: "المستوى السادس",
  7: "المستوى السابع",
  8: "المستوى الثامن",
  9: "المستوى التاسع",
  10: "المستوى العاشر",
};

const numericSemesterPattern = /^\d+$/;

export function normalizeCourseSemesterInput(
  semester: string | null | undefined,
): string | undefined {
  return semester ? semester.toString()?.trim() : undefined;
}

export function formatCourseSemesterLabel(
  semester: string | null | undefined,
  options?: { emptyLabel?: string },
): string | undefined {
  const normalized = normalizeCourseSemesterInput(semester);
  if (!normalized) {
    return options?.emptyLabel;
  }

  if (!numericSemesterPattern.test(normalized)) {
    return normalized;
  }

  const numericSemester = Number.parseInt(normalized, 10);
  return numericSemesterLabels[numericSemester] ?? `المستوى ${numericSemester}`;
}

export function getCourseSemesterGroupKey(
  semester: string | null | undefined,
): string | null {
  return normalizeCourseSemesterInput(semester) ?? null;
}
