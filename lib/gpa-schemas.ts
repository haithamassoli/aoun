import { z } from "zod";

export function createGpaPlannerSchema(maxGpa: number) {
  const maxGpaLabel = maxGpa.toFixed(2);

  return z.object({
    currentGpa: z.coerce
      .number()
      .min(0, "يجب أن يكون 0 أو أكثر")
      .max(maxGpa, `الحد الأقصى ${maxGpaLabel}`),
    currentCreditHours: z.coerce
      .number()
      .min(0, "يجب أن يكون 0 أو أكثر"),
    targetGpa: z.coerce
      .number()
      .min(0, "يجب أن يكون 0 أو أكثر")
      .max(maxGpa, `الحد الأقصى ${maxGpaLabel}`),
    plannedCreditHours: z.coerce
      .number()
      .min(1, "أدخل الساعات المخططة"),
  });
}

export type CourseRowValues = {
  name?: string;
  creditHours: number;
  gradeType: "letter" | "percentage" | "points";
  grade: string;
};
