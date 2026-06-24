"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from "react";
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

function DownloadIcon() {
  return (
    <svg
      className="h-5 w-5"
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
  );
}

function UploadIcon() {
  return (
    <svg
      className="h-5 w-5"
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
  );
}

export function LocalDataSettings() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImportState | null>(
    null,
  );
  const [isImporting, setIsImporting] = useState(false);
  const storageAvailable = useSyncExternalStore(
    () => () => undefined,
    isLocalStorageAvailable,
    () => false,
  );

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
      toast.show(
        "تمت استعادة البيانات. ستتم إعادة تحميل الصفحة الآن.",
        "success",
      );
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

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 sm:text-3xl">
            النسخ الاحتياطـي المحلي
          </h1>
          <p className="mt-2 text-sm text-surface-600 dark:text-surface-400 sm:text-base">
            احفظ واستعد بياناتـك الدراسية المخزنة على جهازك
          </p>
        </header>

        <div className="space-y-4 sm:space-y-6">
          <section className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <button
              type="button"
              onClick={handleExport}
              disabled={!storageAvailable}
              className="group flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-5 text-right transition-all hover:border-primary-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-700 sm:p-6"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100 dark:bg-primary-950/50 dark:text-primary-400 dark:group-hover:bg-primary-950">
                <DownloadIcon />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50 sm:text-lg">
                  تصدير نسخة احتياطـية
                </h2>
                <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
                  نزّل ملفـاً يحتوي على بياناتك المحلية، بما فيها عمليات البحث الأخيرة
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!storageAvailable}
              className="group flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-5 text-right transition-all hover:border-primary-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-700 sm:p-6"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-50 text-surface-600 transition-colors group-hover:bg-surface-100 dark:bg-surface-800 dark:text-surface-400 dark:group-hover:bg-surface-750">
                <UploadIcon />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50 sm:text-lg">
                  استيراد نسخة محفوظـة
                </h2>
                <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
                  استعد بياناتـك من ملف سابق مع آخر عمليات البحث المحفوظة
                </p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
            />
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 sm:p-5">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              الاستـيراد يستبدل البيانات الحالية بالكامل. صدّر نسخة حديثة قبل
              الاستيراد إذا كنت تحتاج للعودة إليها.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50 sm:mb-4">
              البيانات المشمـولة
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {USER_DATA_BACKUP_SECTIONS.map((section, index) => (
                <div
                  key={section.id}
                  className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                        {section.title}
                      </h3>
                      <p className="mt-1 text-xs text-surface-600 dark:text-surface-400">
                        {section.description}
                      </p>
                    </div>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-100 text-xs font-medium text-surface-700 dark:bg-surface-800 dark:text-surface-300">
                      {index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={pendingImport !== null}
        title="استبدال البيـانات المحلية الحالية؟"
        description={
          pendingImport
            ? `سيتم استيراد الملف ${pendingImport.fileName} واستبدال بيانات هذا الجهاز الحالية. تم إنشاء النسخة في ${formatBackupDate(
                pendingImport.backup.exportedAt,
              )} وتحتوي على ${countBackupEntries(pendingImport.backup)} عنصر تخزين.`
            : ""
        }
        confirmLabel="استـيراد الآن"
        cancelLabel="إلغـاء"
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
