import { z } from "zod";

export const courseRowSchema = z.object({
  name: z.string().optional(),
  creditHours: z.coerce
    .number()
    .min(1, "الحد الأدنى ساعة واحدة")
    .max(6, "الحد الأقصى 6 ساعات"),
  gradeType: z.enum(["letter", "percentage", "points"]),
  grade: z.string().min(1, "الدرجة مطلوبة"),
});

export const semesterGpaSchema = z.object({
  gradeScale: z.enum(["jordan_standard", "jordan_plus_minus"]),
  courses: z.array(courseRowSchema).min(1, "أضف مادة واحدة على الأقل"),
});

export const cumulativeGpaSchema = z.object({
  gradeScale: z.enum(["jordan_standard", "jordan_plus_minus"]),
  previousGpa: z.coerce
    .number()
    .min(0, "يجب أن يكون المعدل 0 أو أكثر")
    .max(4, "الحد الأقصى للمعدل 4.0")
    .optional(),
  previousCreditHours: z.coerce
    .number()
    .min(0, "يجب أن يكون 0 أو أكثر")
    .optional(),
  courses: z.array(courseRowSchema).min(1, "أضف مادة واحدة على الأقل"),
});

export const gpaPlannerSchema = z.object({
  currentGpa: z.coerce
    .number()
    .min(0, "يجب أن يكون 0 أو أكثر")
    .max(4, "الحد الأقصى 4.0"),
  currentCreditHours: z.coerce
    .number()
    .min(0, "يجب أن يكون 0 أو أكثر"),
  targetGpa: z.coerce
    .number()
    .min(0, "يجب أن يكون 0 أو أكثر")
    .max(4, "الحد الأقصى 4.0"),
  plannedCreditHours: z.coerce
    .number()
    .min(1, "أدخل الساعات المخططة"),
});

export type SemesterGpaValues = z.infer<typeof semesterGpaSchema>;
export type CumulativeGpaValues = z.infer<typeof cumulativeGpaSchema>;
export type GpaPlannerValues = z.infer<typeof gpaPlannerSchema>;
export type CourseRowValues = z.infer<typeof courseRowSchema>;
