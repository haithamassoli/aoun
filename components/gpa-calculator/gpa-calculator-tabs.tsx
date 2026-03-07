"use client";

import { useState } from "react";
import { SemesterGpaForm } from "./semester-gpa-form";
import { CumulativeGpaForm } from "./cumulative-gpa-form";
import { GpaPlannerForm } from "./gpa-planner-form";

type Tab = "semester" | "cumulative" | "planner";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "semester", label: "معدل الفصل", icon: "📚" },
  { id: "cumulative", label: "المعدل التراكمي", icon: "📊" },
  { id: "planner", label: "مخطط المعدل", icon: "🎯" },
];

export function GpaCalculatorTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("semester");

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
        <p className="font-medium text-surface-600 dark:text-surface-300">
          الجامعات الأردنية المدعومة
        </p>
        <p className="mt-1">
          <span className="font-medium text-surface-700 dark:text-surface-200">المعيارية:</span>{" "}
          الأردنية، اليرموك، الهاشمية، البلقاء، مؤتة وغيرها
          &nbsp;|&nbsp;
          <span className="font-medium text-surface-700 dark:text-surface-200">المتقدمة:</span>{" "}
          جامعة العلوم والتكنولوجيا (JUST) وبعض الجامعات الخاصة
        </p>
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
        {activeTab === "semester" && <SemesterGpaForm />}
        {activeTab === "cumulative" && <CumulativeGpaForm />}
        {activeTab === "planner" && <GpaPlannerForm />}
      </div>

      {/* Grade Scale Reference */}
      <details className="mt-6 rounded-xl border border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/50">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200">
          جدول تحويل الدرجات
        </summary>
        <div className="grid grid-cols-2 gap-4 px-4 pb-4 pt-2 sm:grid-cols-2">
          {/* Jordan Standard */}
          <div>
            <p className="mb-2 text-xs font-semibold text-surface-600 dark:text-surface-300">
              المعيارية (A, B+, B, ...)
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
                {[
                  ["A", "90–100", "4.0"],
                  ["B+", "85–89", "3.5"],
                  ["B", "80–84", "3.0"],
                  ["C+", "75–79", "2.5"],
                  ["C", "70–74", "2.0"],
                  ["D+", "65–69", "1.5"],
                  ["D", "60–64", "1.0"],
                  ["F", "<60", "0.0"],
                ].map(([letter, pct, pts]) => (
                  <tr key={letter} className="text-surface-700 dark:text-surface-300">
                    <td className="py-1 font-medium">{letter}</td>
                    <td className="py-1 text-center text-surface-500 dark:text-surface-400">{pct}</td>
                    <td className="py-1 text-left">{pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Jordan Plus/Minus */}
          <div>
            <p className="mb-2 text-xs font-semibold text-surface-600 dark:text-surface-300">
              المتقدمة (A, A-, B+, ...)
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
                {[
                  ["A", "90–100", "4.0"],
                  ["A-", "85–89", "3.7"],
                  ["B+", "80–84", "3.3"],
                  ["B", "75–79", "3.0"],
                  ["B-", "70–74", "2.7"],
                  ["C+", "65–69", "2.3"],
                  ["C", "60–64", "2.0"],
                  ["D+", "55–59", "1.3"],
                  ["D", "50–54", "1.0"],
                  ["F", "<50", "0.0"],
                ].map(([letter, pct, pts]) => (
                  <tr key={letter} className="text-surface-700 dark:text-surface-300">
                    <td className="py-1 font-medium">{letter}</td>
                    <td className="py-1 text-center text-surface-500 dark:text-surface-400">{pct}</td>
                    <td className="py-1 text-left">{pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
}
