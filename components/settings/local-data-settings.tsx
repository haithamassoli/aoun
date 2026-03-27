"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Toast, useToast } from "@/components/toast";
import {
  USER_DATA_BACKUP_SECTIONS,
  countBackupEntries,
  createUserLocalDataBackup,
  importUserLocalDataBackup,
  isLocalStorageAvailable,
  parseUserLocalDataBackup,
  serializeUserLocalDataBackup,
  type LocalDataBackupV1,
} from "@/lib/local-backup";

type PendingImportState = {
  fileName: string;
  backup: LocalDataBackupV1;
};

function formatBackupDate(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "غير معروف";
  }

  return new Intl.DateTimeFormat("ar-JO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function createBackupFileName() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    `${now.getMonth() + 1}`.padStart(2, "0"),
    `${now.getDate()}`.padStart(2, "0"),
  ].join("-");

  return `aoun-backup-${stamp}.json`;
}

export function LocalDataSettings() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImportState | null>(
    null,
  );
  const [isImporting, setIsImporting] = useState(false);
  const storageAvailable = useMemo(() => isLocalStorageAvailable(), []);

  const handleExport = () => {
    if (!storageAvailable) {
      toast.show("التخزين المحلي غير متاح على هذا المتصفح حالياً.", "error");
      return;
    }

    try {
      const backup = createUserLocalDataBackup(window.localStorage);
      const blob = new Blob([serializeUserLocalDataBackup(backup)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = createBackupFileName();
      anchor.click();

      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.show("تم تنزيل النسخة الاحتياطية بنجاح.", "success");
    } catch {
      toast.show("تعذر إنشاء النسخة الاحتياطية. حاول مرة أخرى.", "error");
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const backup = parseUserLocalDataBackup(text);
      setPendingImport({ fileName: file.name, backup });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "تعذر قراءة ملف النسخة الاحتياطية.";
      toast.show(message, "error");
    }
  };

  const handleImportConfirm = () => {
    if (!pendingImport) {
      return;
    }

    if (!storageAvailable) {
      toast.show("التخزين المحلي غير متاح على هذا المتصفح حالياً.", "error");
      return;
    }

    setIsImporting(true);

    try {
      importUserLocalDataBackup(pendingImport.backup, window.localStorage);
      toast.show("تمت استعادة البيانات. ستتم إعادة تحميل الصفحة الآن.", "success");
      setPendingImport(null);
      window.setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch {
      setIsImporting(false);
      toast.show("تعذر استيراد النسخة الاحتياطية. حاول مرة أخرى.", "error");
    }
  };

  return (
    <>
      <Toast toast={toast} />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-surface-200 bg-white shadow-[0_24px_80px_-36px_rgba(15,23,42,0.3)] dark:border-surface-700 dark:bg-surface-900">
          <div className="border-b border-surface-200 bg-[linear-gradient(135deg,rgba(37,99,235,0.08),rgba(37,99,235,0.02)_45%,rgba(15,23,42,0)_100%)] px-6 py-8 dark:border-surface-700 dark:bg-[linear-gradient(135deg,rgba(37,99,235,0.18),rgba(37,99,235,0.06)_45%,rgba(15,23,42,0)_100%)] sm:px-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
                <span className="h-2 w-2 rounded-full bg-primary-500" />
                بيانات الجهاز
              </span>
              <h1 className="mt-4 text-2xl font-bold text-surface-950 dark:text-surface-50 sm:text-3xl">
                الإعدادات والنسخ الاحتياطي المحلي
              </h1>
              <p className="mt-3 text-sm leading-7 text-surface-600 dark:text-surface-300">
                هذه الصفحة تحفظ وتستعيد البيانات المخزنة محلياً على جهازك، مثل
                تفضيلات السمة، سجل حاسبة المعدل، الخطة الدراسية، والمهام في
                التقويم الأكاديمي.
              </p>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="space-y-4">
              <div className="rounded-[1.5rem] border border-surface-200 bg-surface-50/70 p-5 dark:border-surface-700 dark:bg-surface-950/40">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  ما الذي سيتم حفظه؟
                </h2>
                <p className="mt-2 text-sm leading-7 text-surface-500 dark:text-surface-400">
                  سيتم تضمين بياناتك الدراسية وتفضيلاتك على هذا الجهاز فقط.
                  لن يتم تضمين مفاتيح التحليلات أو إعدادات لوحة التحكم الإدارية.
                </p>
              </div>

              <div className="grid gap-4">
                {USER_DATA_BACKUP_SECTIONS.map((section) => (
                  <article
                    key={section.id}
                    className="rounded-[1.5rem] border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900/80"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                          {section.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-surface-500 dark:text-surface-400">
                          {section.description}
                        </p>
                      </div>
                      <span className="inline-flex min-w-12 items-center justify-center rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs font-semibold text-surface-600 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
                        {section.keys.length}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="rounded-[1.5rem] border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900/80">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  تصدير نسخة احتياطية
                </h2>
                <p className="mt-2 text-sm leading-7 text-surface-500 dark:text-surface-400">
                  نزّل ملف JSON يحتوي على جميع بياناتك المحلية المدعومة، ثم
                  احتفظ به لاستعادته لاحقاً على هذا الجهاز أو جهاز آخر.
                </p>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={!storageAvailable}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v12m0 0 4-4m-4 4-4-4m-5 8h18"
                    />
                  </svg>
                  تنزيل النسخة الاحتياطية
                </button>
              </div>

              <div className="rounded-[1.5rem] border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900/80">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  استيراد نسخة محفوظة
                </h2>
                <p className="mt-2 text-sm leading-7 text-surface-500 dark:text-surface-400">
                  عند الاستيراد سيتم استبدال البيانات المحلية الحالية بالبيانات
                  الموجودة داخل الملف، ثم إعادة تحميل الصفحة لتطبيق التغييرات.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!storageAvailable}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-surface-300 bg-white px-4 py-3 text-sm font-semibold text-surface-700 transition-colors hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-200 dark:hover:border-primary-700 dark:hover:text-primary-300"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16V4m0 12 4-4m-4 4-4-4m-5 8h18"
                    />
                  </svg>
                  اختيار ملف للاستيراد
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
                <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  ملاحظة مهمة
                </h2>
                <p className="mt-2 text-sm leading-7 text-amber-700 dark:text-amber-300">
                  الاستيراد لا يدمج البيانات الحالية مع الملف. سيتم استخدام
                  محتوى الملف كما هو، لذلك صدّر نسخة حديثة قبل الاستبدال إذا
                  كنت تحتاج للعودة إليها لاحقاً.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingImport !== null}
        title="استبدال البيانات المحلية الحالية؟"
        description={
          pendingImport
            ? `سيتم استيراد الملف ${pendingImport.fileName} واستبدال بيانات هذا الجهاز الحالية. تم إنشاء النسخة في ${formatBackupDate(
                pendingImport.backup.exportedAt,
              )} وتحتوي على ${countBackupEntries(pendingImport.backup)} عنصر تخزين.`
            : ""
        }
        confirmLabel="استيراد الآن"
        cancelLabel="إلغاء"
        isLoading={isImporting}
        onConfirm={handleImportConfirm}
        onCancel={() => {
          if (isImporting) {
            return;
          }

          setPendingImport(null);
        }}
      />
    </>
  );
}
