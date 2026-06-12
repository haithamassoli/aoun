export type StudentToolNavItem = {
  href: string;
  label: string;
  description: string;
};

export const STUDENT_TOOL_NAV_ITEMS: readonly StudentToolNavItem[] = [
  {
    href: "/courses",
    label: "بحث المــواد",
    description: "ابحث عن أي مادة عبر الجامعات الأردنية من صفحة واحدة.",
  },
  {
    href: "/gpa-calculator",
    label: "حاسبة المعــدل",
    description: "احسب معدلك الفصلي والتراكمي واحفظ النتائج محلياً.",
  },
  {
    href: "/academic-planner",
    label: "التقويــم",
    description: "رتّب الاختبارات والمشاريع ومواعيد التسجيل في مكان واحد.",
  },
  {
    href: "/focus",
    label: "التركيــز",
    description:
      "استخدم مؤقت بومودورو وامزج المطر والطبيعة والضوضاء الهادئة خلال المذاكرة والتنقل.",
  },
] as const;
