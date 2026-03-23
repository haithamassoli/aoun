export type GradeScale = "jordan_standard" | "jordan_plus_minus" | "just";
export type GradeType = "letter" | "percentage" | "points";

export const DEFAULT_GRADE_SCALE: GradeScale = "just";

export const GRADE_TYPE_LABELS: Record<GradeType, string> = {
  letter: "حرف",
  percentage: "نسبة مئوية",
  points: "نقاط",
};

type GradeEntry = { letter: string; points: number; minPercent: number };
type GradeClassification = { minGpa: number; label: string };
type GradeScaleInfo = {
  label: string;
  description: string;
  maxGpa: number;
  grades: GradeEntry[];
  classifications: GradeClassification[];
};

const JORDAN_STANDARD_GRADES: GradeEntry[] = [
  { letter: "A", points: 4.0, minPercent: 90 },
  { letter: "B+", points: 3.5, minPercent: 85 },
  { letter: "B", points: 3.0, minPercent: 80 },
  { letter: "C+", points: 2.5, minPercent: 75 },
  { letter: "C", points: 2.0, minPercent: 70 },
  { letter: "D+", points: 1.5, minPercent: 65 },
  { letter: "D", points: 1.0, minPercent: 60 },
  { letter: "F", points: 0.0, minPercent: 0 },
];

const JORDAN_PLUS_MINUS_GRADES: GradeEntry[] = [
  { letter: "A", points: 4.0, minPercent: 90 },
  { letter: "A-", points: 3.75, minPercent: 85 },
  { letter: "B+", points: 3.5, minPercent: 80 },
  { letter: "B", points: 3.0, minPercent: 75 },
  { letter: "B-", points: 2.75, minPercent: 70 },
  { letter: "C+", points: 2.5, minPercent: 65 },
  { letter: "C", points: 2.0, minPercent: 60 },
  { letter: "C-", points: 1.75, minPercent: 55 },
  { letter: "D+", points: 1.5, minPercent: 50 },
  { letter: "D", points: 1.0, minPercent: 45 },
  { letter: "D-", points: 0.75, minPercent: 40 },
  { letter: "F", points: 0.0, minPercent: 0 },
];

const JUST_GRADES: GradeEntry[] = [
  { letter: "A+", points: 4.2, minPercent: 95 },
  { letter: "A", points: 4.0, minPercent: 85 },
  { letter: "A-", points: 3.75, minPercent: 80 },
  { letter: "B+", points: 3.5, minPercent: 77 },
  { letter: "B", points: 3.25, minPercent: 73 },
  { letter: "B-", points: 3.0, minPercent: 70 },
  { letter: "C+", points: 2.75, minPercent: 67 },
  { letter: "C", points: 2.5, minPercent: 63 },
  { letter: "C-", points: 2.25, minPercent: 60 },
  { letter: "D+", points: 2.0, minPercent: 57 },
  { letter: "D", points: 1.75, minPercent: 53 },
  { letter: "D-", points: 1.5, minPercent: 50 },
  { letter: "F", points: 0.5, minPercent: 0 },
];

const JORDAN_CLASSIFICATIONS: GradeClassification[] = [
  { minGpa: 3.65, label: "ممتاز" },
  { minGpa: 3.0, label: "جيد جداً" },
  { minGpa: 2.5, label: "جيد" },
  { minGpa: 2.0, label: "مقبول" },
  { minGpa: 0, label: "ضعيف" },
];

const JUST_CLASSIFICATIONS: GradeClassification[] = [
  { minGpa: 4.0, label: "امتياز" },
  { minGpa: 3.5, label: "ممتاز" },
  { minGpa: 3.0, label: "جيد جداً" },
  { minGpa: 2.5, label: "جيد" },
  { minGpa: 2.0, label: "مقبول" },
  { minGpa: 0, label: "راسب" },
];

export const GRADE_SCALES: Record<
  GradeScale,
  GradeScaleInfo
> = {
  jordan_standard: {
    label: "نظام 4.0 المبسّط (A, B+, B, C+, ...)",
    description: "نموذج 4.0 مبسّط شائع في بعض الخطط التي لا تستخدم A- أو B- أو C- أو D-.",
    maxGpa: 4,
    grades: JORDAN_STANDARD_GRADES,
    classifications: JORDAN_CLASSIFICATIONS,
  },
  jordan_plus_minus: {
    label: "نظام 4.0 مع +/- (A, A-, B+, B, B-, ...)",
    description:
      "أقرب إلى السلم الحرفي المستخدم في الجامعة الأردنية وبعض الخطط التي تعتمد +/- على 4.0.",
    maxGpa: 4,
    grades: JORDAN_PLUS_MINUS_GRADES,
    classifications: JORDAN_CLASSIFICATIONS,
  },
  just: {
    label: "نظام JUST الرسمي (A+ إلى F على 4.2)",
    description:
      "سلم جامعة العلوم والتكنولوجيا الأردنية الرسمي، ويشمل A+ بحد أقصى 4.2 وتحويلات النسب المعتمدة في JUST.",
    maxGpa: 4.2,
    grades: JUST_GRADES,
    classifications: JUST_CLASSIFICATIONS,
  },
};

export function getLetterGrades(scale: GradeScale): string[] {
  return GRADE_SCALES[scale].grades.map((g) => g.letter);
}

export function getScaleMaxGpa(scale: GradeScale): number {
  return GRADE_SCALES[scale].maxGpa;
}

export function getGpaLetter(gpa: number, scale: GradeScale): string {
  const grades = GRADE_SCALES[scale].grades;
  const found = [...grades].find((grade) => gpa >= grade.points);

  return found ? found.letter : grades[grades.length - 1]?.letter ?? "-";
}

export function gradeToPoints(
  grade: string,
  gradeType: GradeType,
  scale: GradeScale,
): number {
  const grades = GRADE_SCALES[scale].grades;

  if (gradeType === "letter") {
    const found = grades.find((g) => g.letter === grade);
    return found ? found.points : 0;
  }

  if (gradeType === "percentage") {
    const pct = parseFloat(grade);
    if (isNaN(pct)) return 0;
    const found = [...grades].find((g) => pct >= g.minPercent);
    return found ? found.points : 0;
  }

  if (gradeType === "points") {
    const pts = parseFloat(grade);
    return isNaN(pts) ? 0 : Math.min(getScaleMaxGpa(scale), Math.max(0, pts));
  }

  return 0;
}

export type CourseInput = {
  name?: string;
  creditHours: number;
  gradeType: GradeType;
  grade: string;
};

export type GpaResult = {
  gpa: number;
  totalCredits: number;
  totalPoints: number;
};

export function calculateSemesterGpa(
  courses: CourseInput[],
  scale: GradeScale,
): GpaResult {
  const maxGpa = getScaleMaxGpa(scale);
  let totalPoints = 0;
  let totalCredits = 0;

  for (const course of courses) {
    const credits = Number(course.creditHours) || 0;
    const points = gradeToPoints(course.grade, course.gradeType, scale);
    totalPoints += points * credits;
    totalCredits += credits;
  }

  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  return {
    gpa: Math.min(maxGpa, Math.round(gpa * 100) / 100),
    totalCredits,
    totalPoints: Math.round(totalPoints * 100) / 100,
  };
}

export function calculateCumulativeGpa(
  courses: CourseInput[],
  scale: GradeScale,
  previousGpa?: number,
  previousCredits?: number,
): GpaResult {
  const maxGpa = getScaleMaxGpa(scale);
  const semResult = calculateSemesterGpa(courses, scale);
  const prevGpa = previousGpa ?? 0;
  const prevCredits = previousCredits ?? 0;
  const totalCredits = semResult.totalCredits + prevCredits;
  const totalPoints = semResult.totalPoints + prevGpa * prevCredits;
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  return {
    gpa: Math.min(maxGpa, Math.round(gpa * 100) / 100),
    totalCredits,
    totalPoints: Math.round(totalPoints * 100) / 100,
  };
}

export function calculateRequiredGpa(
  currentGpa: number,
  currentCredits: number,
  targetGpa: number,
  plannedCredits: number,
): number {
  const needed =
    targetGpa * (currentCredits + plannedCredits) - currentGpa * currentCredits;
  const required = needed / plannedCredits;
  return Math.round(required * 100) / 100;
}

export function getGpaColors(gpa: number): {
  text: string;
  bg: string;
  border: string;
} {
  if (gpa >= 3.5)
    return {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800",
    };
  if (gpa >= 3.0)
    return {
      text: "text-primary-600 dark:text-primary-400",
      bg: "bg-primary-50 dark:bg-primary-950/30",
      border: "border-primary-200 dark:border-primary-800",
    };
  if (gpa >= 2.5)
    return {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
    };
  if (gpa >= 2.0)
    return {
      text: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-200 dark:border-orange-800",
    };
  return {
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
  };
}

export function getGpaLabel(rate: number): string {
  if (rate >= 4) {
    return "متميز";
  }
  if (rate >= 3.5) {
    return "ممتاز";
  }
  if (rate >= 3) {
    return "جيد جدا";
  }
  if (rate >= 2.5) {
    return "جيد";
  }
  if (rate >= 2) {
    return "مقبول";
  }
  if (rate >= 1.5) {
    return "انذار";
  }
  if (rate === 0) {
    return "لا يوجد بيانات";
  }
  return "راسب";
}
