import { v } from "convex/values";
import justEeCourses from "../seed-date/just-ee.json";
import type { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import {
  formatCourseSemesterLabel,
  normalizeCourseSemesterInput,
} from "../lib/course-semester";
import {
  buildCourseSearchToken,
  buildMajorSearchToken,
  buildUniversitySearchToken,
  normalize,
} from "./searchUtils";

const JUST_UNIVERSITY = {
  name: "جامعة العلوم والتكنولوجيا الأردنية",
  slug: "just",
  order: 4,
  quickLinks: [
    {
      title: "الجدول الدراسي",
      url: "https://services.just.edu.jo/courseschedule/",
    },
    {
      title: "خدمات الطالب",
      url: "https://services.just.edu.jo/stuservices/",
    },
    {
      title: "تسجيل المواد",
      url: "https://services.just.edu.jo/sturegistration/",
    },
  ],
} as const;

const JUST_EE_MAJOR = {
  name: "الهندسة الكهربائية",
  slug: "ee",
  alias: "electrical engineering",
  order: 0,
} as const;

const SEED_USER = {
  name: "Seed Import",
  email: "seed-import@aoun.jo",
  passwordHash: "$2b$12$GzB4y38S1bVV9M5b7ea2.OjsFs6Qc54gEMidMeBt.LflgYA15d7iu",
} as const;

type SeedItem = (typeof justEeCourses)[number];
type ResourceType = "link" | "richtext";
type ResourceCategory =
  | "notes"
  | "exams"
  | "videos"
  | "summaries"
  | "tips"
  | "course_intro"
  | "comprehensive_post"
  | "textbook"
  | "previous_years"
  | "explanations_notebooks"
  | "course_drive"
  | "other";

type ActiveCourse = {
  _id: Id<"courses">;
  name: string;
  slug: string;
  alias?: string;
  order: number;
  courseCode?: string;
  semesterId?: Id<"semesters">;
  semester?: string;
  searchToken?: string;
};

type ResourceSpec = {
  category: ResourceCategory;
  title: string;
  type: ResourceType;
  url?: string;
  content?: string;
  order: number;
};

function isActive<T extends { deletedAt?: number }>(
  doc: T,
): doc is T & { deletedAt?: undefined } {
  return doc.deletedAt === undefined;
}

function isNonZeroString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value !== "0";
}

function hasLatinLetters(value: string | undefined) {
  return value !== undefined && /[A-Za-z]/.test(value);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/["'`]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function selectSlugSource(item: SeedItem) {
  if (hasLatinLetters(item.alias)) {
    return item.alias;
  }
  if (hasLatinLetters(item.name)) {
    return item.name;
  }
  return item.alias || item.name;
}

function buildCourseSlug(item: SeedItem) {
  return slugify(selectSlugSource(item));
}

function getSeedCourseSlug(item: SeedItem) {
  return isNonZeroString(item.slug) ? item.slug : buildCourseSlug(item);
}

function getSeedCourseCode(item: SeedItem) {
  if (isNonZeroString(item.courseCode)) {
    return item.courseCode;
  }

  return isNonZeroString(item.courceCode) ? item.courceCode : undefined;
}

function getSeedCourseOrder(item: SeedItem, fallbackOrder: number) {
  return typeof item.order === "number" ? item.order : fallbackOrder;
}

function getSeedCourseSemester(item: SeedItem) {
  if (typeof item.semester === "number") {
    return String(item.semester);
  }

  if (typeof item.semester === "string") {
    return normalizeCourseSemesterInput(item.semester);
  }

  return undefined;
}

function getSeedCourseSemesterName(semester: string | undefined) {
  return semester ? formatCourseSemesterLabel(semester) ?? semester : undefined;
}

function getSeedCourseSemesterOrder(
  semester: string | undefined,
  fallbackOrder: number,
) {
  if (!semester || !/^\d+$/.test(semester)) {
    return fallbackOrder;
  }

  return Number.parseInt(semester, 10);
}

function getSeedCourseSearchToken(
  item: SeedItem,
  slug: string,
  courseCode: string | undefined,
) {
  if (isNonZeroString(item.searchToken)) {
    return item.searchToken;
  }

  return buildCourseSearchToken({
    name: item.name,
    slug,
    alias: item.alias,
    courseCode,
  });
}

function normalizeCourseKey(value: string | undefined) {
  if (!value) {
    return "";
  }

  return normalize(value)
    .split(" ")
    .map((segment) =>
      /^[a-z]+s$/.test(segment) ? segment.slice(0, -1) : segment,
    )
    .join(" ")
    .trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildRichTextNote(value: string) {
  return `<p>${escapeHtml(value)}</p>`;
}

function buildExplanationSpecs(
  value: unknown,
  startOrder: number,
): ResourceSpec[] {
  if (isNonZeroString(value)) {
    return [
      {
        category: "explanations_notebooks",
        title: "الشروحات والدفاتر",
        type: "richtext",
        content: buildRichTextNote(value),
        order: startOrder,
      },
    ];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  const specs: ResourceSpec[] = [];

  for (const [index, entry] of value.entries()) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }

    const explanation = entry as {
      name?: unknown;
      link?: unknown;
    };

    if (!isNonZeroString(explanation.name)) {
      continue;
    }

    const title = explanation.name.trim();
    const order = startOrder + index;

    if (isNonZeroString(explanation.link)) {
      specs.push({
        category: "explanations_notebooks",
        title,
        type: "link",
        url: explanation.link,
        order,
      });
      continue;
    }

    specs.push({
      category: "explanations_notebooks",
      title,
      type: "richtext",
      content: buildRichTextNote(title),
      order,
    });
  }

  return specs;
}

function buildResourceSpecs(item: SeedItem): ResourceSpec[] {
  const specs: ResourceSpec[] = [];

  const pushLink = (
    value: unknown,
    category: ResourceCategory,
    title: string,
    order: number,
  ) => {
    if (!isNonZeroString(value)) {
      return;
    }
    specs.push({ category, title, type: "link", url: value, order });
  };

  const pushRichText = (
    value: unknown,
    category: ResourceCategory,
    title: string,
    order: number,
    plainText = false,
  ) => {
    if (!isNonZeroString(value)) {
      return;
    }
    specs.push({
      category,
      title,
      type: "richtext",
      content: plainText ? buildRichTextNote(value) : value,
      order,
    });
  };

  pushRichText(item.aboutSubject, "course_intro", "التعريف بالمادة", 0);
  pushRichText(item.fullPost, "comprehensive_post", "البوست الشامل", 1);
  pushLink(item.book, "textbook", "الكتاب", 2);
  pushLink(item.manual, "textbook", "المانيول", 3);
  pushLink(item.prevYears, "previous_years", "السنوات السابقة", 4);
  pushLink(item.subjectLink, "course_drive", "درايف المادة", 5);

  const explanationSpecs = buildExplanationSpecs(item.explanations, 6);
  specs.push(...explanationSpecs);

  const trailingOrderStart = 6 + Math.max(explanationSpecs.length, 1);
  pushLink(
    item.slides,
    "explanations_notebooks",
    "السلايدات",
    trailingOrderStart,
  );
  pushLink(item.answers, "notes", "الإجابات", trailingOrderStart + 1);
  pushLink(item.exams, "exams", "الامتحانات", trailingOrderStart + 2);

  return specs;
}

function findMatchingCourse(
  courses: ActiveCourse[],
  item: SeedItem,
  slug: string,
) {
  const wantedKeys = new Set(
    [slug, item.name, item.alias, getSeedCourseCode(item)]
      .map((value) => normalizeCourseKey(value))
      .filter(Boolean),
  );

  return courses.find((course) => {
    if (course.slug === slug) {
      return true;
    }

    return [course.slug, course.name, course.alias, course.courseCode]
      .map((value) => normalizeCourseKey(value))
      .some((key) => wantedKeys.has(key));
  });
}

async function getOrCreateSeedUser(ctx: MutationCtx): Promise<Id<"users">> {
  const admins = (await ctx.db.query("users").collect()).filter(
    (user) => isActive(user) && user.role === "admin",
  );
  if (admins.length > 0) {
    return admins[0]._id;
  }

  const existingSeedUser = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", SEED_USER.email))
    .first();

  if (existingSeedUser && isActive(existingSeedUser)) {
    return existingSeedUser._id;
  }

  return await ctx.db.insert("users", {
    name: SEED_USER.name,
    email: SEED_USER.email,
    role: "admin",
    passwordHash: SEED_USER.passwordHash,
  });
}

async function getOrCreateJustUniversity(
  ctx: MutationCtx,
): Promise<Id<"universities">> {
  const existing = await ctx.db
    .query("universities")
    .withIndex("by_slug", (q) => q.eq("slug", JUST_UNIVERSITY.slug))
    .collect();

  const active = existing.find(isActive);
  if (active) {
    const searchToken = buildUniversitySearchToken({
      name: active.name,
      slug: active.slug,
      alias: active.alias,
    });

    const needsPatch =
      active.name !== JUST_UNIVERSITY.name ||
      active.order !== JUST_UNIVERSITY.order ||
      active.searchToken !== searchToken ||
      JSON.stringify(active.quickLinks ?? []) !==
        JSON.stringify(JUST_UNIVERSITY.quickLinks);

    if (needsPatch) {
      await ctx.db.patch("universities", active._id, {
        name: JUST_UNIVERSITY.name,
        order: JUST_UNIVERSITY.order,
        quickLinks: [...JUST_UNIVERSITY.quickLinks],
        searchToken: buildUniversitySearchToken({
          name: JUST_UNIVERSITY.name,
          slug: JUST_UNIVERSITY.slug,
          alias: active.alias,
        }),
      });
    }

    return active._id;
  }

  return await ctx.db.insert("universities", {
    name: JUST_UNIVERSITY.name,
    slug: JUST_UNIVERSITY.slug,
    order: JUST_UNIVERSITY.order,
    quickLinks: [...JUST_UNIVERSITY.quickLinks],
    searchToken: buildUniversitySearchToken({
      name: JUST_UNIVERSITY.name,
      slug: JUST_UNIVERSITY.slug,
    }),
  });
}

async function getOrCreateJustEeMajor(
  ctx: MutationCtx,
  universityId: Id<"universities">,
): Promise<Id<"majors">> {
  const existing = await ctx.db
    .query("majors")
    .withIndex("by_universityId_slug", (q) =>
      q.eq("universityId", universityId).eq("slug", JUST_EE_MAJOR.slug),
    )
    .collect();

  const active = existing.find(isActive);
  if (active) {
    const searchToken = buildMajorSearchToken({
      name: JUST_EE_MAJOR.name,
      slug: JUST_EE_MAJOR.slug,
      alias: JUST_EE_MAJOR.alias,
    });

    const needsPatch =
      active.name !== JUST_EE_MAJOR.name ||
      active.alias !== JUST_EE_MAJOR.alias ||
      active.order !== JUST_EE_MAJOR.order ||
      active.searchToken !== searchToken;

    if (needsPatch) {
      await ctx.db.patch("majors", active._id, {
        name: JUST_EE_MAJOR.name,
        alias: JUST_EE_MAJOR.alias,
        order: JUST_EE_MAJOR.order,
        searchToken,
      });
    }

    return active._id;
  }

  return await ctx.db.insert("majors", {
    universityId,
    name: JUST_EE_MAJOR.name,
    slug: JUST_EE_MAJOR.slug,
    order: JUST_EE_MAJOR.order,
    alias: JUST_EE_MAJOR.alias,
    searchToken: buildMajorSearchToken({
      name: JUST_EE_MAJOR.name,
      slug: JUST_EE_MAJOR.slug,
      alias: JUST_EE_MAJOR.alias,
    }),
  });
}

async function getOrCreateCourseSemester(
  ctx: MutationCtx,
  majorId: Id<"majors">,
  semester: string | undefined,
  fallbackOrder: number,
) {
  const name = getSeedCourseSemesterName(semester);
  if (!name) {
    return undefined;
  }

  const existing = await ctx.db
    .query("semesters")
    .withIndex("by_majorId_name", (q) =>
      q.eq("majorId", majorId).eq("name", name),
    )
    .collect();
  const active = existing.find(isActive);
  if (active) {
    return active._id;
  }

  return await ctx.db.insert("semesters", {
    majorId,
    name,
    order: getSeedCourseSemesterOrder(semester, fallbackOrder),
  });
}

export const seedFromJson = internalMutation({
  args: {},
  returns: v.object({
    universityId: v.id("universities"),
    majorId: v.id("majors"),
    createdCourses: v.number(),
    updatedCourses: v.number(),
    createdResources: v.number(),
    updatedResources: v.number(),
    processedCourses: v.number(),
  }),
  handler: async (ctx) => {
    const createdBy = await getOrCreateSeedUser(ctx);
    const universityId = await getOrCreateJustUniversity(ctx);
    const majorId = await getOrCreateJustEeMajor(ctx, universityId);

    const existingCourses = (
      await ctx.db
        .query("courses")
        .withIndex("by_majorId", (q) => q.eq("majorId", majorId))
        .collect()
    )
      .filter(isActive)
      .map((course) => ({
        _id: course._id,
        name: course.name,
        slug: course.slug,
        alias: course.alias,
        order: course.order,
        courseCode: course.courseCode,
        semesterId: course.semesterId,
        semester: course.semester,
        searchToken: course.searchToken,
      }));

    let createdCourses = 0;
    let updatedCourses = 0;
    let createdResources = 0;
    let updatedResources = 0;

    for (const [index, item] of justEeCourses.entries()) {
      const slug = getSeedCourseSlug(item);
      const order = getSeedCourseOrder(item, index + 1);
      const courseCode = getSeedCourseCode(item);
      const semester = getSeedCourseSemester(item);
      const semesterId = await getOrCreateCourseSemester(
        ctx,
        majorId,
        semester,
        index + 1,
      );
      const searchToken = getSeedCourseSearchToken(item, slug, courseCode);

      const matchingCourse = findMatchingCourse(existingCourses, item, slug);

      let courseId: Id<"courses">;
      if (matchingCourse) {
        courseId = matchingCourse._id;

        const needsPatch =
          matchingCourse.name !== item.name ||
          matchingCourse.slug !== slug ||
          matchingCourse.alias !== item.alias ||
          matchingCourse.courseCode !== courseCode ||
          matchingCourse.semesterId !== semesterId ||
          matchingCourse.semester !== undefined ||
          matchingCourse.order !== order ||
          matchingCourse.searchToken !== searchToken;

        if (needsPatch) {
          await ctx.db.patch("courses", matchingCourse._id, {
            name: item.name,
            slug,
            alias: item.alias,
            courseCode,
            semesterId,
            semester: undefined,
            order,
            searchToken,
          });

          matchingCourse.name = item.name;
          matchingCourse.slug = slug;
          matchingCourse.alias = item.alias;
          matchingCourse.courseCode = courseCode;
          matchingCourse.semesterId = semesterId;
          matchingCourse.semester = undefined;
          matchingCourse.order = order;
          matchingCourse.searchToken = searchToken;
          updatedCourses += 1;
        }
      } else {
        courseId = await ctx.db.insert("courses", {
          majorId,
          name: item.name,
          slug,
          alias: item.alias,
          courseCode,
          semesterId,
          credits: 3,
          order,
          searchToken,
        });

        existingCourses.push({
          _id: courseId,
          name: item.name,
          slug,
          alias: item.alias,
          order,
          courseCode,
          semesterId,
          semester: undefined,
          searchToken,
        });
        createdCourses += 1;
      }

      const existingResources = (
        await ctx.db
          .query("resources")
          .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
          .collect()
      )
        .filter(isActive)
        .map((resource) => ({
          _id: resource._id,
          category: resource.category,
          title: resource.title,
          type: resource.type,
          url: resource.url,
          content: resource.content,
          order: resource.order,
        }));

      for (const spec of buildResourceSpecs(item)) {
        const existing = existingResources.find(
          (resource) =>
            resource.category === spec.category &&
            resource.title === spec.title,
        );

        if (existing) {
          const needsPatch =
            existing.type !== spec.type ||
            existing.url !== spec.url ||
            existing.content !== spec.content ||
            existing.order !== spec.order;

          if (needsPatch) {
            await ctx.db.patch("resources", existing._id, {
              type: spec.type,
              url: spec.url,
              content: spec.content,
              order: spec.order,
              updatedAt: Date.now(),
            });

            existing.type = spec.type;
            existing.url = spec.url;
            existing.content = spec.content;
            existing.order = spec.order;
            updatedResources += 1;
          }

          continue;
        }

        const now = Date.now();
        const resourceId = await ctx.db.insert("resources", {
          courseId,
          category: spec.category,
          title: spec.title,
          type: spec.type,
          url: spec.url,
          content: spec.content,
          order: spec.order,
          createdBy,
          createdAt: now,
          updatedAt: now,
        });

        existingResources.push({
          _id: resourceId,
          category: spec.category,
          title: spec.title,
          type: spec.type,
          url: spec.url,
          content: spec.content,
          order: spec.order,
        });
        createdResources += 1;
      }
    }

    return {
      universityId,
      majorId,
      createdCourses,
      updatedCourses,
      createdResources,
      updatedResources,
      processedCourses: justEeCourses.length,
    };
  },
});
