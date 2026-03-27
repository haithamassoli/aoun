import type { CourseProgressStatus } from "@/lib/student-progress";
import { CUSTOM_COURSES_STORAGE_KEY } from "@/lib/local-storage-keys";

export type CustomCourse = {
  id: string;
  name: string;
  note?: string;
  credits: number;
  status: CourseProgressStatus;
  createdAt: number;
  updatedAt: number;
};

type CustomCourseStore = Record<string, CustomCourse[]>;

let cachedCustomCourseStore: CustomCourseStore | null = null;

function canUseStorage() {
  return typeof window !== "undefined";
}

function generateLocalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeStatus(value: unknown): CourseProgressStatus | null {
  if (
    value === "completed" ||
    value === "in_progress" ||
    value === "hidden" ||
    value === "none"
  ) {
    return value;
  }

  return null;
}

function normalizeCustomCourse(value: unknown): CustomCourse | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const id = candidate.id;
  const name = candidate.name;
  const status = normalizeStatus(candidate.status);
  const createdAt = candidate.createdAt;
  const updatedAt = candidate.updatedAt;

  if (
    typeof id !== "string" ||
    !id ||
    typeof name !== "string" ||
    !name.trim() ||
    !status ||
    typeof createdAt !== "number" ||
    typeof updatedAt !== "number"
  ) {
    return null;
  }

  const note =
    typeof candidate.note === "string" && candidate.note.trim()
      ? candidate.note.trim()
      : undefined;

  const credits =
    typeof candidate.credits === "number" &&
    candidate.credits >= 1 &&
    candidate.credits <= 12
      ? candidate.credits
      : undefined;

  return {
    id,
    name: name.trim(),
    note,
    credits,
    status,
    createdAt,
    updatedAt,
  };
}

function parseCustomCourseStore(raw: string | null): CustomCourseStore {
  if (!raw) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const sanitized: CustomCourseStore = {};
    for (const [majorId, courses] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (typeof majorId !== "string" || !majorId || !Array.isArray(courses)) {
        continue;
      }

      const normalizedCourses = courses
        .map((course) => normalizeCustomCourse(course))
        .filter((course): course is CustomCourse => course !== null)
        .toSorted((left, right) => {
          const statusOrder: Record<CourseProgressStatus, number> = {
            in_progress: 0,
            none: 1,
            completed: 2,
            hidden: 3,
          };

          const statusDelta =
            statusOrder[left.status] - statusOrder[right.status];
          if (statusDelta !== 0) {
            return statusDelta;
          }

          return right.updatedAt - left.updatedAt;
        });

      if (normalizedCourses.length > 0) {
        sanitized[majorId] = normalizedCourses;
      }
    }

    return sanitized;
  } catch {
    return {};
  }
}

function loadCustomCourseStore(): CustomCourseStore {
  if (cachedCustomCourseStore !== null) {
    return cachedCustomCourseStore;
  }

  if (!canUseStorage()) {
    cachedCustomCourseStore = {};
    return cachedCustomCourseStore;
  }

  cachedCustomCourseStore = parseCustomCourseStore(
    window.localStorage.getItem(CUSTOM_COURSES_STORAGE_KEY),
  );
  return cachedCustomCourseStore;
}

function persistCustomCourseStore(store: CustomCourseStore) {
  if (!canUseStorage()) {
    return;
  }

  try {
    if (Object.keys(store).length === 0) {
      window.localStorage.removeItem(CUSTOM_COURSES_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      CUSTOM_COURSES_STORAGE_KEY,
      JSON.stringify(store),
    );
  } catch {
    // Local storage may be blocked by the browser.
  }
}

function sortCustomCourses(courses: CustomCourse[]) {
  const statusOrder: Record<CourseProgressStatus, number> = {
    in_progress: 0,
    none: 1,
    completed: 2,
    hidden: 3,
  };

  return courses.toSorted((left, right) => {
    const statusDelta = statusOrder[left.status] - statusOrder[right.status];
    if (statusDelta !== 0) {
      return statusDelta;
    }

    return right.updatedAt - left.updatedAt;
  });
}

function persistMajorCourses(majorId: string, courses: CustomCourse[]) {
  const nextStore = { ...loadCustomCourseStore() };
  const nextCourses = sortCustomCourses(courses);

  if (nextCourses.length === 0) {
    delete nextStore[majorId];
  } else {
    nextStore[majorId] = nextCourses;
  }

  cachedCustomCourseStore = nextStore;
  persistCustomCourseStore(nextStore);
  return nextCourses;
}

export function loadCustomCourses(majorId: string) {
  return [...(loadCustomCourseStore()[majorId] ?? [])];
}

export function createCustomCourse(
  majorId: string,
  input: {
    name: string;
    credits?: number;
    status?: CourseProgressStatus;
  },
) {
  const now = Date.now();
  const course: CustomCourse = {
    id: generateLocalId(),
    name: input.name.trim(),
    credits: input.credits,
    status: input.status ?? "none",
    createdAt: now,
    updatedAt: now,
  };

  return persistMajorCourses(majorId, [course, ...loadCustomCourses(majorId)]);
}

export function updateCustomCourse(
  majorId: string,
  courseId: string,
  patch: Partial<Pick<CustomCourse, "name" | "credits" | "status">>,
) {
  const courses = loadCustomCourses(majorId);
  const nextCourses = courses.map((course) =>
    course.id !== courseId
      ? course
      : {
          ...course,
          name: patch.name !== undefined ? patch.name.trim() : course.name,
          credits: patch.credits !== undefined ? patch.credits : course.credits,
          status: patch.status ?? course.status,
          updatedAt: Date.now(),
        },
  );

  return persistMajorCourses(majorId, nextCourses);
}

export function removeCustomCourse(majorId: string, courseId: string) {
  const nextCourses = loadCustomCourses(majorId).filter(
    (course) => course.id !== courseId,
  );
  return persistMajorCourses(majorId, nextCourses);
}

export function setCustomCourseStatus(
  majorId: string,
  courseId: string,
  status: CourseProgressStatus,
) {
  return updateCustomCourse(majorId, courseId, { status });
}
