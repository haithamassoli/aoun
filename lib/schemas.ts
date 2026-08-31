import { z } from "zod";
import { CATEGORY_VALUES } from "@/constant/resource-categories";
import { RESOURCE_REQUEST_KINDS } from "@/lib/resource-requests";

const quickLinkSchema = z
  .object({
    title: z.string(),
    url: z.string(),
  })
  .superRefine((value, ctx) => {
    const title = value.title.trim();
    const url = value.url.trim();

    if (!title && !url) {
      return;
    }

    if (!title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["title"],
        message: "عنوان الرابط مطلوب",
      });
    }

    if (!url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "الرابط مطلوب",
      });
      return;
    }

    if (!z.string().url().safeParse(url).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "رابط غير صالح",
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

const optionalUrlField = z.union([
  z.literal(""),
  z.string().url("رابط غير صالح"),
]);
const creditsStringField = z
  .string()
  .regex(/^[1-9]\d*$/, "عدد الساعات يجب أن يكون رقماً صحيحاً موجباً");

export const universitySchema = z.object({
  name: z.string().min(1, "اسم الجامعة مطلوب"),
  slug: z.string().min(1, "الرابط مطلوب"),
  logoUrl: z.union([z.literal(""), z.string().url("رابط الشعار غير صالح")]),
  order: z.string(),
  alias: z.string(),
  quickLinks: z.array(quickLinkSchema),
});

export const majorSchema = z.object({
  universityId: z.string().min(1, "يجب اختيار الجامعة"),
  name: z.string().min(1, "اسم التخصص مطلوب"),
  slug: z.string().min(1, "الرابط مطلوب"),
  order: z.string(),
  alias: z.string(),
  treeDiagramUrl: optionalUrlField,
  instagram: optionalUrlField,
  facebook: optionalUrlField,
  facebookGroup: optionalUrlField,
  faculty: optionalUrlField,
  telegram: optionalUrlField,
});

export const courseSchema = z.object({
  majorId: z.string().min(1, "يجب اختيار التخصص"),
  name: z.string().min(1, "اسم المادة مطلوب"),
  slug: z.string().min(1, "الرابط مطلوب"),
  credits: creditsStringField,
  deliveryMode: z.enum(["in_person", "online"]),
  courseCode: z.string(),
  semesterId: z.string(),
  order: z.string(),
  alias: z.string(),
});

export const semesterSchema = z.object({
  name: z.string().min(1, "اسم الفصل مطلوب"),
  order: z.string(),
});

export const resourceSchema = z
  .object({
    courseId: z.string().min(1, "يجب اختيار المادة"),
    title: z.string().min(1, "عنوان المصدر مطلوب"),
    category: z.string().min(1, "التصنيف مطلوب"),
    type: z.enum(["link", "richtext"]),
    url: z.string(),
    content: z.string(),
    order: z.string(),
  })
  .refine((data) => data.type !== "link" || data.url.trim().length > 0, {
    message: "الرابط مطلوب",
    path: ["url"],
  })
  .refine(
    (data) => data.type !== "richtext" || data.content.trim().length > 0,
    { message: "المحتوى مطلوب", path: ["content"] },
  );

export const contributorCourseSchema = z.object({
  name: z.string().min(1, "اسم المادة مطلوب"),
  slug: z.string().min(1, "الرابط مطلوب"),
  credits: creditsStringField,
  deliveryMode: z.enum(["in_person", "online"]),
  courseCode: z.string(),
  semesterId: z.string(),
  order: z.string(),
  alias: z.string(),
});

export const contributorMajorSchema = z.object({
  treeDiagramUrl: optionalUrlField,
  instagram: optionalUrlField,
  facebook: optionalUrlField,
  facebookGroup: optionalUrlField,
  faculty: optionalUrlField,
  telegram: optionalUrlField,
});

export const contributorResourceSchema = z
  .object({
    title: z.string().min(1, "عنوان المصدر مطلوب"),
    category: z.string().min(1, "التصنيف مطلوب"),
    type: z.enum(["link", "richtext"]),
    url: z.string(),
    content: z.string(),
    order: z.string(),
  })
  .refine((data) => data.type !== "link" || data.url.trim().length > 0, {
    message: "الرابط مطلوب",
    path: ["url"],
  })
  .refine(
    (data) => data.type !== "richtext" || data.content.trim().length > 0,
    { message: "المحتوى مطلوب", path: ["content"] },
  );

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const publicResourceRequestSchema = z
  .object({
    kind: z.enum(RESOURCE_REQUEST_KINDS, {
      message: "نوع الطلب مطلوب",
    }),
    category: z.union([z.literal(""), z.enum(CATEGORY_VALUES)]),
    note: z.string().trim().min(1, "التفاصيل مطلوبة"),
    suggestedUrl: z.string(),
  })
  .superRefine((value, ctx) => {
    const suggestedUrl = value.suggestedUrl.trim();

    if (value.kind === "resource_suggestion" && suggestedUrl && !isHttpUrl(suggestedUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["suggestedUrl"],
        message: "رابط غير صالح",
      });
    }
  });

export const createUserSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  role: z.enum(["admin", "contributor"]),
});

export const editUserSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  role: z.enum(["admin", "contributor"]),
});

export const newsSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  content: z.string().min(1, "المحتوى مطلوب"),
});
