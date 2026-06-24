export type StudentToolNavItem = {
  href: string;
  label: string;
  description: string;
};

export const STUDENT_TOOL_NAV_ITEMS: readonly StudentToolNavItem[] = [
  {
    href: "/courses",
    label: "بحث المـواد",
    description: "ابحث عن أي مـادة عبر الجامعات الأردنية من صفحة واحدة.",
  },
  {
    href: "/gpa-calculator",
    label: "حاسبة المعـدل",
    description: "احسب معـدلك الفصلي والتراكمي واحفظ النتائج محلياً.",
  },
  {
    href: "/academic-planner",
    label: "التقويـم",
    description: "رتّب الاختبـارات والمشاريع ومواعيد التسجيل في مكان واحد.",
  },
  {
    href: "/focus",
    label: "التركـيز",
    description:
      "استخدم مؤقـت بومودورو وامزج المطر والطبيعة والضوضاء الهادئة خلال المذاكرة والتنقل.",
  },
] as const;
