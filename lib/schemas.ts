import { z } from "zod";

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
  treeDiagramUrl: z.union([z.literal(""), z.string().url("رابط غير صالح")]),
});

export const courseSchema = z.object({
  majorId: z.string().min(1, "يجب اختيار التخصص"),
  name: z.string().min(1, "اسم المادة مطلوب"),
  slug: z.string().min(1, "الرابط مطلوب"),
  courseCode: z.string(),
  semester: z.string(),
  order: z.string(),
  alias: z.string(),
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
  courseCode: z.string(),
  semester: z.string(),
  order: z.string(),
  alias: z.string(),
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
