"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_GRADE_SCALE,
  GRADE_SCALES,
  getGpaLetter,
  getScaleMaxGpa,
  type GradeScale,
  type GpaResult,
} from "@/lib/gpa-utils";
import {
  loadSupports42ScalePreference,
  useGradeTypePreference,
  saveSupports42ScalePreference,
} from "@/lib/gpa-preferences";
import { GPA_CALCULATOR_HISTORY_STORAGE_KEY } from "@/lib/local-storage-keys";
import { SemesterGpaForm } from "./semester-gpa-form";
import { CumulativeGpaForm } from "./cumulative-gpa-form";
import { GpaPlannerForm, type PlannerResult } from "./gpa-planner-form";

type Tab = "semester" | "cumulative" | "planner";
type HistoryTone = "default" | "success" | "danger";
type HistoryEntry = {
  id: string;
  tab: Tab;
  label: string;
  value: string;
  details: string;
  createdAt: number;
  tone: HistoryTone;
};

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "semester", label: "معدل الفصل", icon: "📚" },
  { id: "cumulative", label: "المعدل التراكمي", icon: "📊" },
  { id: "planner", label: "مخطط المعدل", icon: "🎯" },
];
const MAX_HISTORY_ITEMS = 12;
const HISTORY_TONE_STYLES: Record<HistoryTone, string> = {
  default:
    "border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/50",
  success:
    "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
  danger:
    "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
};

function formatPercentRange(
  grades: (typeof GRADE_SCALES)[GradeScale]["grades"],
  index: number,
) {
  const current = grades[index];
  const upperBound = index === 0 ? 100 : grades[index - 1].minPercent - 1;

  if (current.minPercent === 0) {
    return `<${grades[index - 1].minPercent}`;
  }

  return `${current.minPercent}–${upperBound}`;
}

function isHistoryTone(value: unknown): value is HistoryTone {
  return value === "default" || value === "success" || value === "danger";
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<HistoryEntry>;

  return (
    (entry.tab === "semester" ||
      entry.tab === "cumulative" ||
      entry.tab === "planner") &&
    typeof entry.id === "string" &&
    typeof entry.label === "string" &&
    typeof entry.value === "string" &&
    typeof entry.details === "string" &&
    typeof entry.createdAt === "number" &&
    isHistoryTone(entry.tone)
  );
}

function formatHistoryDate(timestamp: number) {
  return new Intl.DateTimeFormat("ar-JO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function formatResultSummary(result: GpaResult, scale: GradeScale) {
  const maxGpa = getScaleMaxGpa(scale);
  const percentage = maxGpa > 0 ? (result.gpa / maxGpa) * 100 : 0;
  const letter = getGpaLetter(result.gpa, scale);

  return `${letter} • ${percentage.toFixed(1)}% • ${result.gpa.toFixed(2)}/${maxGpa.toFixed(2)}`;
}

export function GpaCalculatorTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("semester");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [hasLoadedScalePreference, setHasLoadedScalePreference] = useState(false);
  const [supports42Scale, setSupports42Scale] = useState(
    DEFAULT_GRADE_SCALE === "just",
  );
  const gradeTypePreference = useGradeTypePreference();
  const isPercentageGradeType = gradeTypePreference === "percentage";
  const effectiveSupports42Scale = supports42Scale && !isPercentageGradeType;
  const activeScale: GradeScale = effectiveSupports42Scale
    ? "just"
    : "jordan_plus_minus";
  const activeScaleInfo = GRADE_SCALES[activeScale];

  useEffect(() => {
    setSupports42Scale(loadSupports42ScalePreference());
    setHasLoadedScalePreference(true);
  }, []);

  useEffect(() => {
    try {
      const rawHistory = window.localStorage.getItem(
        GPA_CALCULATOR_HISTORY_STORAGE_KEY,
      );

      if (!rawHistory) {
        return;
      }

      const parsed = JSON.parse(rawHistory);
      if (!Array.isArray(parsed)) {
        return;
      }

      setHistory(parsed.filter(isHistoryEntry).slice(0, MAX_HISTORY_ITEMS));
    } catch {
      window.localStorage.removeItem(GPA_CALCULATOR_HISTORY_STORAGE_KEY);
    } finally {
      setHasLoadedHistory(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedScalePreference) {
      return;
    }

    saveSupports42ScalePreference(supports42Scale);
  }, [hasLoadedScalePreference, supports42Scale]);

  useEffect(() => {
    if (!hasLoadedHistory) {
      return;
    }

    if (history.length === 0) {
      window.localStorage.removeItem(GPA_CALCULATOR_HISTORY_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      GPA_CALCULATOR_HISTORY_STORAGE_KEY,
      JSON.stringify(history),
    );
  }, [hasLoadedHistory, history]);

  const addHistoryEntry = ({
    tab,
    label,
    value,
    details,
    tone = "default",
  }: Omit<HistoryEntry, "id" | "createdAt">) => {
    setHistory((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        tab,
        label,
        value,
        details,
        tone,
        createdAt: Date.now(),
      },
      ...current,
    ].slice(0, MAX_HISTORY_ITEMS));
  };

  const handleSemesterCalculated = (result: GpaResult) => {
    addHistoryEntry({
      tab: "semester",
      label: "معدل الفصل",
      value: formatResultSummary(result, activeScale),
      details: `${result.totalCredits} ساعة معتمدة • ${result.totalPoints.toFixed(2)} نقطة`,
      tone: result.gpa >= 2 ? "success" : "danger",
    });
  };

  const handleCumulativeCalculated = (result: GpaResult) => {
    addHistoryEntry({
      tab: "cumulative",
      label: "المعدل التراكمي",
      value: formatResultSummary(result, activeScale),
      details: `${result.totalCredits} ساعة معتمدة • ${result.totalPoints.toFixed(2)} نقطة`,
      tone: result.gpa >= 2 ? "success" : "danger",
    });
  };

  const handlePlannerCalculated = (result: PlannerResult) => {
    addHistoryEntry({
      tab: "planner",
      label: "المعدل المطلوب",
      value: result.requiredGpa.toFixed(2),
      details: result.message,
      tone: result.isAchievable ? "success" : "danger",
    });
  };

  const visibleHistory = history.filter((entry) => entry.tab === activeTab);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
          حاسبة المعدل
        </h1>
        <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
          احسب معدلك الفصلي والتراكمي أو خطط للفصل القادم
        </p>
      </div>

      {/* Grade Scale Info */}
      <div className="mb-6 rounded-xl border border-surface-200 bg-surface-50 p-4 text-xs text-surface-500 dark:border-surface-700 dark:bg-surface-800/50 dark:text-surface-400">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-medium text-surface-600 dark:text-surface-300">
              آلية الحساب
            </p>
            <p className="mt-1 max-w-xl leading-5">
              النتيجة تظهر كنسبة مئوية وبالنقاط معاً، ويمكنك التبديل بين
              سلم 4.2 وسلّم 4.0 حسب نظام جامعتك قبل إدخال المواد.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 self-start rounded-full border border-surface-200 bg-white px-3 py-1.5 text-[11px] font-medium text-surface-600 shadow-sm dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300">
            <input
              type="checkbox"
              checked={effectiveSupports42Scale}
              onChange={(event) => setSupports42Scale(event.target.checked)}
              disabled={isPercentageGradeType}
              className="h-3.5 w-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500 dark:border-surface-600"
            />
            جامعتي تعتمد نظام 4.2
          </label>
        </div>
        {isPercentageGradeType && (
          <p className="mt-2 text-[11px] text-surface-500 dark:text-surface-400">
            غير متاح مع اختيار الدرجة المئوية.
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex rounded-xl border border-surface-200 bg-surface-100 p-1 dark:border-surface-700 dark:bg-surface-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
              activeTab === tab.id
                ? "bg-white text-primary-600 shadow-sm dark:bg-surface-900 dark:text-primary-400"
                : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
            }`}
          >
            <span role="img" aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Container */}
      <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900 sm:p-6">
        {activeTab === "semester" && (
          <SemesterGpaForm
            key={`semester-${activeScale}`}
            onCalculated={handleSemesterCalculated}
            scale={activeScale}
          />
        )}
        {activeTab === "cumulative" && (
          <CumulativeGpaForm
            key={`cumulative-${activeScale}`}
            onCalculated={handleCumulativeCalculated}
            scale={activeScale}
          />
        )}
        {activeTab === "planner" && (
          <GpaPlannerForm onCalculated={handlePlannerCalculated} />
        )}
      </div>

      {/* History */}
      <section className="mt-6 rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
              السجل
            </h2>
            <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
              آخر العمليات محفوظة محلياً على هذا الجهاز.
            </p>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setHistory([])}
              className="rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-500 transition-colors hover:border-red-300 hover:text-red-600 dark:border-surface-700 dark:text-surface-400 dark:hover:border-red-800 dark:hover:text-red-400"
            >
              مسح السجل
            </button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {visibleHistory.length > 0 ? (
            visibleHistory.map((entry) => (
              <article
                key={entry.id}
                className={`rounded-xl border p-4 ${HISTORY_TONE_STYLES[entry.tone]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                      {entry.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-surface-500 dark:text-surface-400">
                      {entry.details}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold tabular-nums text-surface-900 dark:text-surface-50 sm:text-xl">
                      {entry.value}
                    </p>
                    <p className="mt-1 text-[11px] text-surface-500 dark:text-surface-400">
                      {formatHistoryDate(entry.createdAt)}
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-surface-200 px-4 py-5 text-center text-sm text-surface-500 dark:border-surface-700 dark:text-surface-400">
              لا توجد عمليات محفوظة لهذا القسم بعد.
            </p>
          )}
        </div>
      </section>

      {/* Grade Scale Reference */}
      <details className="mt-6 rounded-xl border border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/50">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200">
          جدول تحويل الدرجات
        </summary>
        <div className="px-4 pb-4 pt-2">
          <p className="mb-1 text-xs font-semibold text-surface-600 dark:text-surface-300">
            {activeScaleInfo.label}
          </p>
          <p className="mb-2 text-[11px] leading-5 text-surface-500 dark:text-surface-400">
            {activeScaleInfo.description}
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-surface-500 dark:text-surface-400">
                <th className="pb-1 text-right font-medium">الحرف</th>
                <th className="pb-1 text-center font-medium">%</th>
                <th className="pb-1 text-left font-medium">نقطة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
              {activeScaleInfo.grades.map((grade, index) => (
                <tr key={grade.letter} className="text-surface-700 dark:text-surface-300">
                  <td className="py-1 font-medium">{grade.letter}</td>
                  <td className="py-1 text-center text-surface-500 dark:text-surface-400">
                    {formatPercentRange(activeScaleInfo.grades, index)}
                  </td>
                  <td className="py-1 text-left">{grade.points.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 pb-4 text-[11px] leading-5 text-surface-500 dark:text-surface-400">
          تحويل النسبة المئوية هنا تقريبي للاستخدام العام. إذا كنت تعتمد حدوداً
          مختلفة في جامعتك، فاستخدم الإدخال بالحروف أو بالنقاط لأنه أدق.
        </p>
      </details>
    </div>
  );
}
