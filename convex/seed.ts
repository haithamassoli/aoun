import { internalMutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  formatCourseSemesterLabel,
  normalizeCourseSemesterInput,
} from "../lib/course-semester";

// ── Seed all data: universities, majors, courses ─────────────────────
export const seedAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("universities").first();
    if (existing) return "Already seeded — skipping";

    // ── Universities ──────────────────────────────────────────────────
    const universities = [
      { name: "الجامعة الأردنية", slug: "ju", order: 1 },
      { name: "جامعة اليرموك", slug: "yu", order: 2 },
      { name: "الجامعة الهاشمية", slug: "hu", order: 3 },
      { name: "جامعة العلوم والتكنولوجيا الأردنية", slug: "just", order: 4 },
    ];

    const uniIds: Record<string, Id<"universities">> = {};
    for (const uni of universities) {
      const universityId = await ctx.db.insert("universities", uni);
      uniIds[uni.slug] = universityId;
    }

    // ── Majors per university ─────────────────────────────────────────
    type MajorDef = {
      name: string;
      slug: string;
      order: number;
      courses: {
        name: string;
        slug: string;
        courseCode?: string;
        semester?: number | string;
        order: number;
      }[];
    };

    const universityMajors: Record<string, MajorDef[]> = {
      // ═══════════════════════════════════════════════════════════════
      // الجامعة الأردنية — University of Jordan
      // ═══════════════════════════════════════════════════════════════
      ju: [
        {
          name: "الهندسة الكهربائية",
          slug: "ee",
          order: 1,
          courses: [
            { name: "تحليل دوائر كهربائية 1", slug: "circuits-1", courseCode: "EE301", semester: 1, order: 1 },
            { name: "إلكترونيات 1", slug: "electronics-1", courseCode: "EE311", semester: 1, order: 2 },
            { name: "رياضيات هندسية", slug: "eng-math", courseCode: "EE201", semester: 1, order: 3 },
            { name: "برمجة الحاسوب", slug: "programming", courseCode: "EE161", semester: 1, order: 4 },
            { name: "تحليل دوائر كهربائية 2", slug: "circuits-2", courseCode: "EE302", semester: 2, order: 1 },
            { name: "إلكترونيات 2", slug: "electronics-2", courseCode: "EE312", semester: 2, order: 2 },
            { name: "إشارات وأنظمة", slug: "signals", courseCode: "EE321", semester: 2, order: 3 },
            { name: "الحقول الكهرومغناطيسية", slug: "emf", courseCode: "EE331", semester: 3, order: 1 },
            { name: "أنظمة التحكم", slug: "control", courseCode: "EE341", semester: 3, order: 2 },
            { name: "الاتصالات الرقمية", slug: "digital-comm", courseCode: "EE421", semester: 3, order: 3 },
            { name: "أنظمة القدرة الكهربائية", slug: "power", courseCode: "EE451", semester: 4, order: 1 },
            { name: "معالجة الإشارات الرقمية", slug: "dsp", courseCode: "EE422", semester: 4, order: 2 },
          ],
        },
        {
          name: "علم الحاسوب",
          slug: "cs",
          order: 2,
          courses: [
            { name: "مقدمة في علم الحاسوب", slug: "intro-cs", courseCode: "CS116", semester: 1, order: 1 },
            { name: "برمجة 1", slug: "prog-1", courseCode: "CS117", semester: 1, order: 2 },
            { name: "رياضيات متقطعة", slug: "discrete-math", courseCode: "CS120", semester: 1, order: 3 },
            { name: "برمجة 2", slug: "prog-2", courseCode: "CS218", semester: 2, order: 1 },
            { name: "هياكل البيانات", slug: "data-structures", courseCode: "CS220", semester: 2, order: 2 },
            { name: "تنظيم الحاسوب", slug: "computer-org", courseCode: "CS230", semester: 2, order: 3 },
            { name: "الخوارزميات", slug: "algorithms", courseCode: "CS320", semester: 3, order: 1 },
            { name: "قواعد البيانات", slug: "databases", courseCode: "CS342", semester: 3, order: 2 },
            { name: "أنظمة التشغيل", slug: "os", courseCode: "CS340", semester: 3, order: 3 },
            { name: "شبكات الحاسوب", slug: "networks", courseCode: "CS345", semester: 4, order: 1 },
            { name: "هندسة البرمجيات", slug: "software-eng", courseCode: "CS350", semester: 4, order: 2 },
            { name: "الذكاء الاصطناعي", slug: "ai", courseCode: "CS460", semester: 4, order: 3 },
          ],
        },
        {
          name: "الطب البشري",
          slug: "med",
          order: 3,
          courses: [
            { name: "التشريح 1", slug: "anatomy-1", courseCode: "MED201", semester: 1, order: 1 },
            { name: "الكيمياء الحيوية", slug: "biochemistry", courseCode: "MED202", semester: 1, order: 2 },
            { name: "الأنسجة", slug: "histology", courseCode: "MED203", semester: 1, order: 3 },
            { name: "التشريح 2", slug: "anatomy-2", courseCode: "MED204", semester: 2, order: 1 },
            { name: "الفسيولوجيا 1", slug: "physiology-1", courseCode: "MED301", semester: 2, order: 2 },
            { name: "الفسيولوجيا 2", slug: "physiology-2", courseCode: "MED302", semester: 3, order: 1 },
            { name: "علم الأمراض", slug: "pathology", courseCode: "MED401", semester: 3, order: 2 },
            { name: "علم الأدوية", slug: "pharmacology", courseCode: "MED402", semester: 3, order: 3 },
            { name: "الأحياء الدقيقة", slug: "microbiology", courseCode: "MED303", semester: 4, order: 1 },
            { name: "الباطنية", slug: "internal-med", courseCode: "MED501", semester: 4, order: 2 },
            { name: "الجراحة العامة", slug: "surgery", courseCode: "MED502", semester: 5, order: 1 },
            { name: "طب الأطفال", slug: "pediatrics", courseCode: "MED503", semester: 5, order: 2 },
          ],
        },
        {
          name: "الصيدلة",
          slug: "pharm",
          order: 4,
          courses: [
            { name: "الكيمياء العامة", slug: "gen-chem", courseCode: "PH101", semester: 1, order: 1 },
            { name: "الأحياء العامة", slug: "gen-bio", courseCode: "PH102", semester: 1, order: 2 },
            { name: "الكيمياء العضوية", slug: "organic-chem", courseCode: "PH201", semester: 2, order: 1 },
            { name: "الكيمياء التحليلية", slug: "analytical-chem", courseCode: "PH202", semester: 2, order: 2 },
            { name: "علم الأدوية 1", slug: "pharma-1", courseCode: "PH301", semester: 3, order: 1 },
            { name: "الكيمياء الصيدلانية", slug: "pharma-chem", courseCode: "PH302", semester: 3, order: 2 },
            { name: "علم الأدوية 2", slug: "pharma-2", courseCode: "PH401", semester: 4, order: 1 },
            { name: "الصيدلانيات", slug: "pharmaceutics", courseCode: "PH402", semester: 4, order: 2 },
            { name: "الصيدلة السريرية", slug: "clinical-pharm", courseCode: "PH501", semester: 5, order: 1 },
          ],
        },
      ],

      // ═══════════════════════════════════════════════════════════════
      // جامعة اليرموك — Yarmouk University
      // ═══════════════════════════════════════════════════════════════
      yu: [
        {
          name: "اللغة الإنجليزية وآدابها",
          slug: "english",
          order: 1,
          courses: [
            { name: "مهارات الاتصال", slug: "comm-skills", courseCode: "ENG101", semester: 1, order: 1 },
            { name: "مقدمة في الأدب", slug: "intro-lit", courseCode: "ENG102", semester: 1, order: 2 },
            { name: "القواعد والتركيب", slug: "grammar", courseCode: "ENG103", semester: 1, order: 3 },
            { name: "الكتابة الأكاديمية", slug: "academic-writing", courseCode: "ENG201", semester: 2, order: 1 },
            { name: "علم اللغة", slug: "linguistics", courseCode: "ENG210", semester: 2, order: 2 },
            { name: "الشعر الإنجليزي", slug: "poetry", courseCode: "ENG301", semester: 3, order: 1 },
            { name: "الرواية الإنجليزية", slug: "novel", courseCode: "ENG302", semester: 3, order: 2 },
            { name: "الترجمة", slug: "translation", courseCode: "ENG320", semester: 4, order: 1 },
            { name: "الأدب الأمريكي", slug: "american-lit", courseCode: "ENG401", semester: 4, order: 2 },
          ],
        },
        {
          name: "المحاسبة",
          slug: "accounting",
          order: 2,
          courses: [
            { name: "مبادئ المحاسبة 1", slug: "acc-1", courseCode: "ACC101", semester: 1, order: 1 },
            { name: "مبادئ الإدارة", slug: "mgmt-principles", courseCode: "MGT101", semester: 1, order: 2 },
            { name: "مبادئ المحاسبة 2", slug: "acc-2", courseCode: "ACC102", semester: 2, order: 1 },
            { name: "مبادئ الاقتصاد الجزئي", slug: "micro-econ", courseCode: "ECO101", semester: 2, order: 2 },
            { name: "محاسبة التكاليف", slug: "cost-acc", courseCode: "ACC201", semester: 3, order: 1 },
            { name: "المحاسبة المتوسطة 1", slug: "intermediate-1", courseCode: "ACC202", semester: 3, order: 2 },
            { name: "المحاسبة المتوسطة 2", slug: "intermediate-2", courseCode: "ACC301", semester: 4, order: 1 },
            { name: "المحاسبة الضريبية", slug: "tax-acc", courseCode: "ACC302", semester: 4, order: 2 },
            { name: "تدقيق الحسابات", slug: "auditing", courseCode: "ACC401", semester: 5, order: 1 },
          ],
        },
        {
          name: "الشريعة الإسلامية",
          slug: "sharia",
          order: 3,
          courses: [
            { name: "علوم القرآن", slug: "quran-sciences", courseCode: "SHR101", semester: 1, order: 1 },
            { name: "مصطلح الحديث", slug: "hadith-terms", courseCode: "SHR102", semester: 1, order: 2 },
            { name: "أصول الفقه 1", slug: "usul-fiqh-1", courseCode: "SHR201", semester: 2, order: 1 },
            { name: "الفقه الإسلامي 1", slug: "fiqh-1", courseCode: "SHR202", semester: 2, order: 2 },
            { name: "أصول الفقه 2", slug: "usul-fiqh-2", courseCode: "SHR301", semester: 3, order: 1 },
            { name: "الفقه الإسلامي 2", slug: "fiqh-2", courseCode: "SHR302", semester: 3, order: 2 },
            { name: "فقه المعاملات", slug: "fiqh-transactions", courseCode: "SHR401", semester: 4, order: 1 },
            { name: "فقه الأحوال الشخصية", slug: "family-law", courseCode: "SHR402", semester: 4, order: 2 },
          ],
        },
        {
          name: "التربية الخاصة",
          slug: "special-ed",
          order: 4,
          courses: [
            { name: "مقدمة في التربية الخاصة", slug: "intro-sped", courseCode: "SPED101", semester: 1, order: 1 },
            { name: "علم نفس النمو", slug: "dev-psych", courseCode: "SPED102", semester: 1, order: 2 },
            { name: "صعوبات التعلم", slug: "learning-diff", courseCode: "SPED201", semester: 2, order: 1 },
            { name: "الإعاقة العقلية", slug: "intellectual", courseCode: "SPED202", semester: 2, order: 2 },
            { name: "اضطرابات النطق واللغة", slug: "speech", courseCode: "SPED301", semester: 3, order: 1 },
            { name: "التقييم والتشخيص", slug: "assessment", courseCode: "SPED302", semester: 3, order: 2 },
            { name: "تعديل السلوك", slug: "behavior-mod", courseCode: "SPED401", semester: 4, order: 1 },
            { name: "التدخل المبكر", slug: "early-intervention", courseCode: "SPED402", semester: 4, order: 2 },
          ],
        },
      ],

      // ═══════════════════════════════════════════════════════════════
      // الجامعة الهاشمية — Hashemite University
      // ═══════════════════════════════════════════════════════════════
      hu: [
        {
          name: "هندسة البرمجيات",
          slug: "se",
          order: 1,
          courses: [
            { name: "مقدمة في البرمجة", slug: "intro-prog", courseCode: "SE110", semester: 1, order: 1 },
            { name: "رياضيات متقطعة", slug: "discrete-math", courseCode: "SE120", semester: 1, order: 2 },
            { name: "البرمجة الكائنية", slug: "oop", courseCode: "SE210", semester: 2, order: 1 },
            { name: "هياكل البيانات", slug: "data-structures", courseCode: "SE220", semester: 2, order: 2 },
            { name: "هندسة البرمجيات 1", slug: "se-1", courseCode: "SE310", semester: 3, order: 1 },
            { name: "قواعد البيانات", slug: "databases", courseCode: "SE320", semester: 3, order: 2 },
            { name: "تطوير تطبيقات الويب", slug: "web-dev", courseCode: "SE330", semester: 3, order: 3 },
            { name: "هندسة البرمجيات 2", slug: "se-2", courseCode: "SE410", semester: 4, order: 1 },
            { name: "اختبار البرمجيات", slug: "testing", courseCode: "SE420", semester: 4, order: 2 },
            { name: "مشروع التخرج", slug: "capstone", courseCode: "SE490", semester: 5, order: 1 },
          ],
        },
        {
          name: "التمريض",
          slug: "nursing",
          order: 2,
          courses: [
            { name: "أساسيات التمريض", slug: "fundamentals", courseCode: "NUR101", semester: 1, order: 1 },
            { name: "التشريح وعلم وظائف الأعضاء", slug: "anatomy-physio", courseCode: "NUR102", semester: 1, order: 2 },
            { name: "تمريض صحة البالغين 1", slug: "adult-health-1", courseCode: "NUR201", semester: 2, order: 1 },
            { name: "علم الأدوية التمريضي", slug: "pharma", courseCode: "NUR202", semester: 2, order: 2 },
            { name: "تمريض صحة البالغين 2", slug: "adult-health-2", courseCode: "NUR301", semester: 3, order: 1 },
            { name: "تمريض صحة الأم والوليد", slug: "maternal", courseCode: "NUR302", semester: 3, order: 2 },
            { name: "تمريض صحة الطفل", slug: "pediatric-nursing", courseCode: "NUR401", semester: 4, order: 1 },
            { name: "تمريض الصحة النفسية", slug: "psych-nursing", courseCode: "NUR402", semester: 4, order: 2 },
            { name: "تمريض صحة المجتمع", slug: "community", courseCode: "NUR501", semester: 5, order: 1 },
          ],
        },
        {
          name: "إدارة الأعمال",
          slug: "ba",
          order: 3,
          courses: [
            { name: "مبادئ الإدارة", slug: "mgmt-principles", courseCode: "BA101", semester: 1, order: 1 },
            { name: "مبادئ التسويق", slug: "marketing", courseCode: "BA102", semester: 1, order: 2 },
            { name: "السلوك التنظيمي", slug: "org-behavior", courseCode: "BA201", semester: 2, order: 1 },
            { name: "إدارة الموارد البشرية", slug: "hr", courseCode: "BA202", semester: 2, order: 2 },
            { name: "الإدارة الاستراتيجية", slug: "strategy", courseCode: "BA301", semester: 3, order: 1 },
            { name: "إدارة العمليات", slug: "operations", courseCode: "BA302", semester: 3, order: 2 },
            { name: "إدارة المشاريع", slug: "project-mgmt", courseCode: "BA401", semester: 4, order: 1 },
            { name: "ريادة الأعمال", slug: "entrepreneurship", courseCode: "BA402", semester: 4, order: 2 },
          ],
        },
        {
          name: "العلوم المالية والمصرفية",
          slug: "finance",
          order: 4,
          courses: [
            { name: "مبادئ التمويل", slug: "finance-principles", courseCode: "FIN101", semester: 1, order: 1 },
            { name: "مبادئ المحاسبة", slug: "acc-principles", courseCode: "FIN102", semester: 1, order: 2 },
            { name: "الإدارة المالية", slug: "financial-mgmt", courseCode: "FIN201", semester: 2, order: 1 },
            { name: "الأسواق المالية", slug: "markets", courseCode: "FIN202", semester: 2, order: 2 },
            { name: "إدارة المحافظ الاستثمارية", slug: "portfolio", courseCode: "FIN301", semester: 3, order: 1 },
            { name: "التمويل الدولي", slug: "intl-finance", courseCode: "FIN302", semester: 3, order: 2 },
            { name: "إدارة البنوك", slug: "banking", courseCode: "FIN401", semester: 4, order: 1 },
            { name: "التأمين وإدارة المخاطر", slug: "insurance-risk", courseCode: "FIN402", semester: 4, order: 2 },
          ],
        },
      ],

      // ═══════════════════════════════════════════════════════════════
      // جامعة العلوم والتكنولوجيا — JUST
      // ═══════════════════════════════════════════════════════════════
      just: [
        {
          name: "هندسة الحاسوب",
          slug: "cpe",
          order: 1,
          courses: [
            { name: "مقدمة في هندسة الحاسوب", slug: "intro-cpe", courseCode: "CPE200", semester: 1, order: 1 },
            { name: "البرمجة بلغة C", slug: "c-programming", courseCode: "CPE210", semester: 1, order: 2 },
            { name: "الدوائر المنطقية", slug: "logic-circuits", courseCode: "CPE220", semester: 1, order: 3 },
            { name: "هياكل البيانات", slug: "data-structures", courseCode: "CPE230", semester: 2, order: 1 },
            { name: "معمارية الحاسوب", slug: "architecture", courseCode: "CPE310", semester: 2, order: 2 },
            { name: "أنظمة التشغيل", slug: "os", courseCode: "CPE320", semester: 3, order: 1 },
            { name: "شبكات الحاسوب", slug: "networks", courseCode: "CPE330", semester: 3, order: 2 },
            { name: "الأنظمة المضمنة", slug: "embedded", courseCode: "CPE410", semester: 4, order: 1 },
            { name: "أمن المعلومات", slug: "security", courseCode: "CPE420", semester: 4, order: 2 },
            { name: "مشروع التخرج", slug: "capstone", courseCode: "CPE490", semester: 5, order: 1 },
          ],
        },
        {
          name: "الهندسة المدنية",
          slug: "ce",
          order: 2,
          courses: [
            { name: "ميكانيكا هندسية — استاتيكا", slug: "statics", courseCode: "CE201", semester: 1, order: 1 },
            { name: "مقاومة المواد", slug: "materials", courseCode: "CE202", semester: 1, order: 2 },
            { name: "ميكانيكا هندسية — ديناميكا", slug: "dynamics", courseCode: "CE210", semester: 2, order: 1 },
            { name: "ميكانيكا التربة", slug: "soil-mechanics", courseCode: "CE301", semester: 2, order: 2 },
            { name: "التحليل الإنشائي", slug: "structural-analysis", courseCode: "CE310", semester: 3, order: 1 },
            { name: "الهيدروليكا", slug: "hydraulics", courseCode: "CE320", semester: 3, order: 2 },
            { name: "تصميم الخرسانة المسلحة", slug: "rc-design", courseCode: "CE410", semester: 4, order: 1 },
            { name: "هندسة الطرق", slug: "highways", courseCode: "CE420", semester: 4, order: 2 },
            { name: "إدارة المشاريع الهندسية", slug: "eng-project-mgmt", courseCode: "CE430", semester: 5, order: 1 },
          ],
        },
        {
          name: "الهندسة الميكانيكية",
          slug: "me",
          order: 3,
          courses: [
            { name: "الديناميكا الحرارية 1", slug: "thermo-1", courseCode: "ME201", semester: 1, order: 1 },
            { name: "استاتيكا", slug: "statics", courseCode: "ME202", semester: 1, order: 2 },
            { name: "الديناميكا الحرارية 2", slug: "thermo-2", courseCode: "ME301", semester: 2, order: 1 },
            { name: "ميكانيكا الموائع", slug: "fluid-mechanics", courseCode: "ME302", semester: 2, order: 2 },
            { name: "ديناميكا", slug: "dynamics", courseCode: "ME303", semester: 2, order: 3 },
            { name: "انتقال الحرارة", slug: "heat-transfer", courseCode: "ME401", semester: 3, order: 1 },
            { name: "تصميم عناصر الآلات", slug: "machine-design", courseCode: "ME402", semester: 3, order: 2 },
            { name: "أنظمة التحكم", slug: "control-systems", courseCode: "ME410", semester: 4, order: 1 },
            { name: "تصنيع وإنتاج", slug: "manufacturing", courseCode: "ME420", semester: 4, order: 2 },
          ],
        },
        {
          name: "الطب البيطري",
          slug: "vet",
          order: 4,
          courses: [
            { name: "التشريح البيطري 1", slug: "vet-anatomy-1", courseCode: "VET201", semester: 1, order: 1 },
            { name: "الكيمياء الحيوية البيطرية", slug: "vet-biochem", courseCode: "VET202", semester: 1, order: 2 },
            { name: "التشريح البيطري 2", slug: "vet-anatomy-2", courseCode: "VET203", semester: 2, order: 1 },
            { name: "الفسيولوجيا البيطرية", slug: "vet-physiology", courseCode: "VET204", semester: 2, order: 2 },
            { name: "علم الأمراض البيطري", slug: "vet-pathology", courseCode: "VET301", semester: 3, order: 1 },
            { name: "الأحياء الدقيقة البيطرية", slug: "vet-micro", courseCode: "VET302", semester: 3, order: 2 },
            { name: "الأدوية البيطرية", slug: "vet-pharma", courseCode: "VET401", semester: 4, order: 1 },
            { name: "الجراحة البيطرية", slug: "vet-surgery", courseCode: "VET402", semester: 4, order: 2 },
            { name: "طب الحيوانات الكبيرة", slug: "large-animal", courseCode: "VET501", semester: 5, order: 1 },
          ],
        },
      ],
    };

    // ── Insert majors and courses ─────────────────────────────────────
    for (const [uniSlug, majors] of Object.entries(universityMajors)) {
      const universityId = uniIds[uniSlug];
      for (const major of majors) {
        const majorId = await ctx.db.insert("majors", {
          name: major.name,
          slug: major.slug,
          universityId,
          order: major.order,
        });
        const semesterIdsByValue = new Map<string, Id<"semesters">>();

        const getSemesterId = async (semester: number | string | undefined) => {
          if (semester === undefined) {
            return undefined;
          }

          const value = normalizeCourseSemesterInput(String(semester));
          if (!value) {
            return undefined;
          }

          const existingSemesterId = semesterIdsByValue.get(value);
          if (existingSemesterId) {
            return existingSemesterId;
          }

          const order = /^\d+$/.test(value)
            ? Number.parseInt(value, 10)
            : semesterIdsByValue.size + 1;
          const semesterId = await ctx.db.insert("semesters", {
            majorId,
            name: formatCourseSemesterLabel(value) ?? value,
            order,
          });
          semesterIdsByValue.set(value, semesterId);
          return semesterId;
        };

        for (const course of major.courses) {
          const semesterId = await getSemesterId(course.semester);
          await ctx.db.insert("courses", {
            name: course.name,
            slug: course.slug,
            courseCode: course.courseCode,
            semesterId,
            majorId,
            credits: 3,
            order: course.order,
          });
        }
      }
    }

    return "Seeded 4 universities, 16 majors, and all courses successfully";
  },
});

// ── Assign permissions for a contributor to all majors in a university ──
export const assignContributorPermissions = internalMutation({
  args: {
    userId: v.id("users"),
    universitySlug: v.string(),
  },
  handler: async (ctx, { userId, universitySlug }) => {
    const university = await ctx.db
      .query("universities")
      .withIndex("by_slug", (q) => q.eq("slug", universitySlug))
      .first();

    if (!university) throw new ConvexError({ code: "UNIVERSITY_NOT_FOUND", universitySlug });

    const majors = await ctx.db
      .query("majors")
      .withIndex("by_universityId", (q) =>
        q.eq("universityId", university._id)
      )
      .collect();

    for (const major of majors) {
      await ctx.db.insert("permissions", {
        userId,
        majorId: major._id,
      });
    }

    return `Assigned ${majors.length} major permissions for university ${universitySlug}`;
  },
});

// ── Clear all data (for re-seeding in development) ────────────────────
export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "resources",
      "permissions",
      "sessions",
      "courses",
      "semesters",
      "majors",
      "universities",
      "users",
    ] as const;

    let total = 0;
    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(table, doc._id);
      }
      total += docs.length;
    }

    return `Cleared ${total} documents across all tables`;
  },
});
