export type GradeScale = "jordan_standard" | "jordan_plus_minus";
export type GradeType = "letter" | "percentage" | "points";

type GradeEntry = { letter: string; points: number; minPercent: number };

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
  { letter: "A-", points: 3.7, minPercent: 85 },
  { letter: "B+", points: 3.3, minPercent: 80 },
  { letter: "B", points: 3.0, minPercent: 75 },
  { letter: "B-", points: 2.7, minPercent: 70 },
  { letter: "C+", points: 2.3, minPercent: 65 },
  { letter: "C", points: 2.0, minPercent: 60 },
  { letter: "D+", points: 1.3, minPercent: 55 },
  { letter: "D", points: 1.0, minPercent: 50 },
  { letter: "F", points: 0.0, minPercent: 0 },
];

export const GRADE_SCALES: Record<
  GradeScale,
  { label: string; grades: GradeEntry[] }
> = {
  jordan_standard: {
    label: "المعيارية (A, B+, B, C+, ...)",
    grades: JORDAN_STANDARD_GRADES,
  },
  jordan_plus_minus: {
    label: "المتقدمة (A, A-, B+, B, B-, ...)",
    grades: JORDAN_PLUS_MINUS_GRADES,
  },
};

export function getLetterGrades(scale: GradeScale): string[] {
  return GRADE_SCALES[scale].grades.map((g) => g.letter);
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
    return isNaN(pts) ? 0 : Math.min(4.0, Math.max(0, pts));
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
    gpa: Math.min(4, Math.round(gpa * 100) / 100),
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
  const semResult = calculateSemesterGpa(courses, scale);
  const prevGpa = previousGpa ?? 0;
  const prevCredits = previousCredits ?? 0;
  const totalCredits = semResult.totalCredits + prevCredits;
  const totalPoints = semResult.totalPoints + prevGpa * prevCredits;
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  return {
    gpa: Math.min(4, Math.round(gpa * 100) / 100),
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

export function getGpaLabel(gpa: number): string {
  if (gpa >= 3.5) return "ممتاز";
  if (gpa >= 3.0) return "جيد جداً";
  if (gpa >= 2.5) return "جيد";
  if (gpa >= 2.0) return "مقبول";
  return "راسب";
}
