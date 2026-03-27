import {
  ACADEMIC_CALENDAR_STORAGE_KEY,
  COURSE_STATUS_FILTER_STORAGE_KEY,
  COURSE_STATUS_STORAGE_KEY,
  CUSTOM_COURSES_STORAGE_KEY,
  FOCUS_SOUND_PREFERENCES_STORAGE_KEY,
  GPA_CALCULATOR_HISTORY_STORAGE_KEY,
  GPA_GRADE_TYPE_STORAGE_KEY,
  GPA_SUPPORTS_42_SCALE_STORAGE_KEY,
  LAST_MAJOR_STORAGE_KEY,
  RECENT_GLOBAL_COURSE_SEARCHES_STORAGE_KEY,
  THEME_STORAGE_KEY,
  USER_DATA_LOCAL_STORAGE_KEYS,
  type UserDataLocalStorageKey,
} from "@/lib/local-storage-keys";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type LocalDataBackupV1 = {
  format: "aoun-local-backup";
  version: 1;
  scope: "user-data";
  exportedAt: string;
  entries: Partial<Record<UserDataLocalStorageKey, string>>;
};

export type BackupSection = {
  id: string;
  title: string;
  description: string;
  keys: readonly UserDataLocalStorageKey[];
};

const LOCAL_BACKUP_FORMAT = "aoun-local-backup";
const LOCAL_BACKUP_VERSION = 1;

export const USER_DATA_BACKUP_SECTIONS: readonly BackupSection[] = [
  {
    id: "theme",
    title: "المظهر",
    description: "سمة التطبيق المفضلة على هذا الجهاز.",
    keys: [THEME_STORAGE_KEY],
  },
  {
    id: "gpa",
    title: "المعدل",
    description: "تفضيلات الحاسبة وسجل نتائجها المحفوظ محلياً.",
    keys: [
      GPA_SUPPORTS_42_SCALE_STORAGE_KEY,
      GPA_GRADE_TYPE_STORAGE_KEY,
      GPA_CALCULATOR_HISTORY_STORAGE_KEY,
    ],
  },
  {
    id: "progress",
    title: "الخطة والتقدم",
    description:
      "حالات المواد، المواد الإضافية، فلاتر العرض، وعمليات البحث.",
    keys: [
      COURSE_STATUS_STORAGE_KEY,
      LAST_MAJOR_STORAGE_KEY,
      CUSTOM_COURSES_STORAGE_KEY,
      COURSE_STATUS_FILTER_STORAGE_KEY,
      RECENT_GLOBAL_COURSE_SEARCHES_STORAGE_KEY,
    ],
  },
  {
    id: "calendar",
    title: "التقويم الأكاديمي",
    description: "الأحداث والمواعيد التي أضفتها في التقويم المحلي.",
    keys: [ACADEMIC_CALENDAR_STORAGE_KEY],
  },
  {
    id: "focus",
    title: "أصوات التركيز",
    description: "مستويات الصوت وآخر الأصوات التي فعّلتها في جلسات التركيز.",
    keys: [FOCUS_SOUND_PREFERENCES_STORAGE_KEY],
  },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isLocalStorageAvailable() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const probeKey = "__aoun_local_backup_probe__";
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

export function createUserLocalDataBackup(
  storage: StorageLike,
): LocalDataBackupV1 {
  const entries: LocalDataBackupV1["entries"] = {};

  for (const key of USER_DATA_LOCAL_STORAGE_KEYS) {
    const value = storage.getItem(key);
    if (typeof value === "string") {
      entries[key] = value;
    }
  }

  return {
    format: LOCAL_BACKUP_FORMAT,
    version: LOCAL_BACKUP_VERSION,
    scope: "user-data",
    exportedAt: new Date().toISOString(),
    entries,
  };
}

export function serializeUserLocalDataBackup(backup: LocalDataBackupV1) {
  return JSON.stringify(backup, null, 2);
}

export function parseUserLocalDataBackup(text: string): LocalDataBackupV1 {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("ملف النسخة الاحتياطية ليس بصيغة JSON صالحة.");
  }

  if (!isRecord(parsed)) {
    throw new Error("هيكل ملف النسخة الاحتياطية غير صالح.");
  }

  if (parsed.format !== LOCAL_BACKUP_FORMAT || parsed.version !== LOCAL_BACKUP_VERSION) {
    throw new Error("إصدار ملف النسخة الاحتياطية غير مدعوم.");
  }

  if (parsed.scope !== "user-data" || typeof parsed.exportedAt !== "string") {
    throw new Error("بيانات النسخة الاحتياطية ناقصة أو غير صالحة.");
  }

  if (!isRecord(parsed.entries)) {
    throw new Error("محتوى النسخة الاحتياطية غير صالح.");
  }

  const entries: LocalDataBackupV1["entries"] = {};
  for (const [key, value] of Object.entries(parsed.entries)) {
    if (!USER_DATA_LOCAL_STORAGE_KEYS.includes(key as UserDataLocalStorageKey)) {
      continue;
    }

    if (typeof value !== "string") {
      throw new Error("أحد عناصر النسخة الاحتياطية يحتوي على قيمة غير مدعومة.");
    }

    entries[key as UserDataLocalStorageKey] = value;
  }

  return {
    format: LOCAL_BACKUP_FORMAT,
    version: LOCAL_BACKUP_VERSION,
    scope: "user-data",
    exportedAt: parsed.exportedAt,
    entries,
  };
}

export function importUserLocalDataBackup(
  backup: LocalDataBackupV1,
  storage: StorageLike,
) {
  for (const key of USER_DATA_LOCAL_STORAGE_KEYS) {
    storage.removeItem(key);
  }

  const restoredKeys: UserDataLocalStorageKey[] = [];

  for (const key of USER_DATA_LOCAL_STORAGE_KEYS) {
    const value = backup.entries[key];
    if (typeof value !== "string") {
      continue;
    }

    storage.setItem(key, value);
    restoredKeys.push(key);
  }

  return { restoredKeys };
}

export function countBackupEntries(backup: LocalDataBackupV1) {
  return Object.keys(backup.entries).length;
}
