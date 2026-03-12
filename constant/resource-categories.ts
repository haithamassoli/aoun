export const CATEGORIES = [
  { value: "course_intro", label: "التعريف بالمادة" },
  { value: "comprehensive_post", label: "البوست الشامل" },
  { value: "textbook", label: "الكتاب" },
  { value: "previous_years", label: "السنوات السابقة" },
  { value: "explanations_notebooks", label: "الشروحات والدفاتر" },
  { value: "course_drive", label: "درايف المادة" },
  { value: "summaries", label: "ملخصات" },
  { value: "notes", label: "ملاحظات" },
  { value: "exams", label: "امتحانات" },
  { value: "videos", label: "فيديوهات" },
  { value: "tips", label: "نصائح" },
  { value: "other", label: "أخرى" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];
