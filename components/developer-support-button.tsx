"use client";

import { Toast, useToast } from "@/components/toast";

export function DeveloperSupportButton() {
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("ASSOLI5545");
      toast.show("تم نسخ معرف كليك بنجاح", "success");
    } catch {
      toast.show("فشل النسخ", "error");
    }
  };

  return (
    <>
      <Toast toast={toast} />
      <button
        onClick={handleCopy}
        className="text-sm text-surface-500 transition-colors hover:text-primary-600 dark:text-surface-400 dark:hover:text-primary-400"
      >
        لدعم المطور على كليك: ASSOLI5545
      </button>
    </>
  );
}
