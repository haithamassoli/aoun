import { FOCUS_SOUND_PREFERENCES_STORAGE_KEY } from "@/lib/local-storage-keys";

export type FocusSoundIcon =
  | "rain"
  | "storm"
  | "waves"
  | "water"
  | "forest"
  | "wind"
  | "fire"
  | "coffee"
  | "city"
  | "travel"
  | "noise"
  | "night"
  | "space"
  | "machine";

type FocusSoundDefinition = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  accentColor: string;
  icon: FocusSoundIcon;
  categoryLabel: string;
  defaultVolume: number;
};

const FOCUS_SOUND_DEFINITIONS = [
  {
    id: "rain",
    label: "مطر هادئ",
    shortLabel: "مطر",
    description: "طبقة مطر ثابتة تخفف الضجيج حولك وتحافظ على إيقاع هادئ.",
    accentColor: "#2563eb",
    icon: "rain",
    categoryLabel: "مطر",
    defaultVolume: 0.72,
  },
  {
    id: "rainontent",
    label: "مطر على خيمة",
    shortLabel: "خيمة",
    description: "وقعات مطر أقرب وأكثر دفئاً كأنك تذاكر داخل مخيم هادئ.",
    accentColor: "#3b82f6",
    icon: "rain",
    categoryLabel: "مطر",
    defaultVolume: 0.66,
  },
  {
    id: "thunderstorm",
    label: "عاصفة رعدية",
    shortLabel: "عاصفة",
    description: "مطر عميق مع رعد بعيد يضيف طبقة جوية أثقل للتركيز.",
    accentColor: "#7c3aed",
    icon: "storm",
    categoryLabel: "عاصفة",
    defaultVolume: 0.48,
  },
  {
    id: "oceanwaves",
    label: "أمواج المحيط",
    shortLabel: "محيط",
    description: "مد وجزر متكرر يمنح الجلسة إيقاعاً واسعاً وغير حاد.",
    accentColor: "#0284c7",
    icon: "waves",
    categoryLabel: "ماء",
    defaultVolume: 0.56,
  },
  {
    id: "seaside",
    label: "شاطئ هادئ",
    shortLabel: "شاطئ",
    description: "أجواء بحرية أخف من الأمواج الكبيرة ومناسبة للدراسة الطويلة.",
    accentColor: "#0891b2",
    icon: "waves",
    categoryLabel: "ماء",
    defaultVolume: 0.54,
  },
  {
    id: "waterstream",
    label: "جدول ماء",
    shortLabel: "جدول",
    description: "جريان ماء قريب وواضح يملأ الخلفية من دون أن يطغى.",
    accentColor: "#06b6d4",
    icon: "water",
    categoryLabel: "ماء",
    defaultVolume: 0.52,
  },
  {
    id: "water",
    label: "خرير ماء",
    shortLabel: "ماء",
    description: "تدفق مائي بسيط ومريح يصلح كمشهد صوتي خفيف طوال الجلسة.",
    accentColor: "#0ea5e9",
    icon: "water",
    categoryLabel: "ماء",
    defaultVolume: 0.5,
  },
  {
    id: "underwater",
    label: "تحت الماء",
    shortLabel: "أعماق",
    description: "طبقة مائية مكتومة وعازلة تناسب من يفضّل أجواء أكثر عمقاً.",
    accentColor: "#0f766e",
    icon: "water",
    categoryLabel: "ماء",
    defaultVolume: 0.4,
  },
  {
    id: "forest",
    label: "غابة هادئة",
    shortLabel: "غابة",
    description: "خلفية طبيعية واسعة تساعدك على تقليل التوتر والبقاء حاضراً.",
    accentColor: "#15803d",
    icon: "forest",
    categoryLabel: "طبيعة",
    defaultVolume: 0.5,
  },
  {
    id: "leaves",
    label: "حفيف الأوراق",
    shortLabel: "أوراق",
    description: "حركة خفيفة ومنتظمة تمنح المشهد الطبيعي إحساساً رقيقاً.",
    accentColor: "#65a30d",
    icon: "forest",
    categoryLabel: "طبيعة",
    defaultVolume: 0.44,
  },
  {
    id: "wind",
    label: "هواء ناعم",
    shortLabel: "هواء",
    description: "تيار هوائي مستمر يخلق عزلة مريحة من دون تفاصيل كثيرة.",
    accentColor: "#14b8a6",
    icon: "wind",
    categoryLabel: "هواء",
    defaultVolume: 0.48,
  },
  {
    id: "cicadas",
    label: "صوت الزيز",
    shortLabel: "زيز",
    description: "مشهد صيفي ليلي طبيعي يضيف حياة خفيفة من دون إزعاج.",
    accentColor: "#84cc16",
    icon: "night",
    categoryLabel: "ليل",
    defaultVolume: 0.42,
  },
  {
    id: "summernight",
    label: "ليلة صيفية",
    shortLabel: "ليلة",
    description: "خلفية ليلية أكثر اتساعاً تجمع السكون مع حركة محيطة خفيفة.",
    accentColor: "#4f46e5",
    icon: "night",
    categoryLabel: "ليل",
    defaultVolume: 0.44,
  },
  {
    id: "bonfire",
    label: "نار مخيم",
    shortLabel: "مخيم",
    description: "خشخشة نار مفتوحة تضيف دفئاً واضحاً وإحساس جلسة خارجية هادئة.",
    accentColor: "#f97316",
    icon: "fire",
    categoryLabel: "دفء",
    defaultVolume: 0.54,
  },
  {
    id: "fireplace",
    label: "مدفأة خشبية",
    shortLabel: "مدفأة",
    description: "حضور دافئ ومغلق أكثر من نار المخيم، مناسب للمذاكرة الليلية.",
    accentColor: "#ea580c",
    icon: "fire",
    categoryLabel: "دفء",
    defaultVolume: 0.52,
  },
  {
    id: "coffeeshop",
    label: "مقهى هادئ",
    shortLabel: "مقهى",
    description: "ضجيج اجتماعي خفيف يشبه أجواء الدراسة في المقهى من دون فوضى.",
    accentColor: "#a16207",
    icon: "coffee",
    categoryLabel: "أجواء",
    defaultVolume: 0.46,
  },
  {
    id: "cityscape",
    label: "مشهد المدينة",
    shortLabel: "مدينة",
    description: "ضوضاء حضرية بعيدة تناسب من يركز أفضل مع حركة محيطة مألوفة.",
    accentColor: "#0f766e",
    icon: "city",
    categoryLabel: "مدينة",
    defaultVolume: 0.4,
  },
  {
    id: "train",
    label: "داخل القطار",
    shortLabel: "قطار",
    description: "اهتزاز وإيقاع سفر ثابت يمنح الجلسة إحساس حركة منتظمة.",
    accentColor: "#475569",
    icon: "travel",
    categoryLabel: "سفر",
    defaultVolume: 0.44,
  },
  {
    id: "airplane",
    label: "داخل الطائرة",
    shortLabel: "طائرة",
    description: "هدير سفر مرتفع نسبياً لكنه مستقر، مفيد لعزل المحيط الخارجي.",
    accentColor: "#64748b",
    icon: "travel",
    categoryLabel: "سفر",
    defaultVolume: 0.42,
  },
  {
    id: "fan",
    label: "مروحة ثابتة",
    shortLabel: "مروحة",
    description: "ضجيج تهوية بسيط ومتكرر يناسب الدراسة أو القراءة الطويلة.",
    accentColor: "#0f766e",
    icon: "wind",
    categoryLabel: "ثابت",
    defaultVolume: 0.42,
  },
  {
    id: "washingmachine",
    label: "غسالة هادئة",
    shortLabel: "غسالة",
    description: "دوران رتيب وثابت يصلح كبديل محايد لأصوات الضوضاء البيضاء.",
    accentColor: "#64748b",
    icon: "machine",
    categoryLabel: "ثابت",
    defaultVolume: 0.32,
  },
  {
    id: "whitenoise",
    label: "ضوضاء بيضاء",
    shortLabel: "بيضاء",
    description: "طبقة تغطية متوازنة لإخفاء الأصوات المتقطعة في المكان حولك.",
    accentColor: "#94a3b8",
    icon: "noise",
    categoryLabel: "تغطية",
    defaultVolume: 0.3,
  },
  {
    id: "pinknoise",
    label: "ضوضاء وردية",
    shortLabel: "وردية",
    description: "أكثر نعومة من البيضاء مع توازن يناسب الجلسات الطويلة.",
    accentColor: "#db2777",
    icon: "noise",
    categoryLabel: "تغطية",
    defaultVolume: 0.34,
  },
  {
    id: "brownnoise",
    label: "ضوضاء بنية",
    shortLabel: "بنية",
    description: "طبقة أعمق وأثقل تساعد على العزل التام عند الحاجة.",
    accentColor: "#7c3aed",
    icon: "noise",
    categoryLabel: "تغطية",
    defaultVolume: 0.34,
  },
  {
    id: "spaceengine",
    label: "هدير فضائي",
    shortLabel: "فضائي",
    description: "خلفية واسعة ومستقرة بنكهة خيالية لمن يفضّل مشهداً غير طبيعي.",
    accentColor: "#6366f1",
    icon: "space",
    categoryLabel: "خيال",
    defaultVolume: 0.36,
  },
] as const satisfies readonly FocusSoundDefinition[];

export type FocusSoundId = (typeof FOCUS_SOUND_DEFINITIONS)[number]["id"];

export type FocusSoundConfig = Omit<
  (typeof FOCUS_SOUND_DEFINITIONS)[number],
  "defaultVolume"
> & {
  assetPath: string;
};

export type FocusSoundPreferences = {
  version: 1;
  volumes: Record<FocusSoundId, number>;
  lastEnabledSoundIds: FocusSoundId[];
};

export const FOCUS_SOUND_IDS = FOCUS_SOUND_DEFINITIONS.map(
  (sound) => sound.id,
) as readonly FocusSoundId[];

const FOCUS_SOUND_ID_SET = new Set<FocusSoundId>(FOCUS_SOUND_IDS);

const DEFAULT_FOCUS_SOUND_VOLUMES = Object.fromEntries(
  FOCUS_SOUND_DEFINITIONS.map(({ defaultVolume, id }) => [id, defaultVolume]),
) as Record<FocusSoundId, number>;

export const DEFAULT_FOCUS_SOUND_PREFERENCES: FocusSoundPreferences = {
  version: 1,
  volumes: DEFAULT_FOCUS_SOUND_VOLUMES,
  lastEnabledSoundIds: [],
};

export const FOCUS_SOUND_CATALOG = Object.fromEntries(
  FOCUS_SOUND_DEFINITIONS.map((sound) => [
    sound.id,
    {
      id: sound.id,
      label: sound.label,
      shortLabel: sound.shortLabel,
      description: sound.description,
      accentColor: sound.accentColor,
      icon: sound.icon,
      categoryLabel: sound.categoryLabel,
      assetPath: `/sounds/focus/${sound.id}.mp3`,
    },
  ]),
) as Record<FocusSoundId, FocusSoundConfig>;

function clampVolume(value: unknown, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, value));
}

function normalizeSoundIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as FocusSoundId[];
  }

  return FOCUS_SOUND_IDS.filter((id) => value.includes(id));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function sanitizeFocusSoundPreferences(
  value: unknown,
): FocusSoundPreferences {
  if (!isRecord(value)) {
    return DEFAULT_FOCUS_SOUND_PREFERENCES;
  }

  const rawVolumes = isRecord(value.volumes) ? value.volumes : {};
  const volumes = Object.fromEntries(
    FOCUS_SOUND_DEFINITIONS.map(({ defaultVolume, id }) => [
      id,
      clampVolume(rawVolumes[id], defaultVolume),
    ]),
  ) as Record<FocusSoundId, number>;

  return {
    version: 1,
    volumes,
    lastEnabledSoundIds: normalizeSoundIds(value.lastEnabledSoundIds),
  };
}

export function loadFocusSoundPreferences() {
  if (typeof window === "undefined") {
    return DEFAULT_FOCUS_SOUND_PREFERENCES;
  }

  try {
    const rawValue = window.localStorage.getItem(
      FOCUS_SOUND_PREFERENCES_STORAGE_KEY,
    );

    if (!rawValue) {
      return DEFAULT_FOCUS_SOUND_PREFERENCES;
    }

    return sanitizeFocusSoundPreferences(JSON.parse(rawValue));
  } catch {
    return DEFAULT_FOCUS_SOUND_PREFERENCES;
  }
}

export function saveFocusSoundPreferences(preferences: FocusSoundPreferences) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      FOCUS_SOUND_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch {
    // Local storage may be blocked by the browser.
  }
}

export function isFocusSoundId(value: string): value is FocusSoundId {
  return FOCUS_SOUND_ID_SET.has(value as FocusSoundId);
}
