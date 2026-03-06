"use client";

import { useEffect, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { CourseStatusSelector } from "@/components/course-status-selector";
import {
  type CourseProgressStatus,
  getCourseStatus,
  setCourseStatus,
} from "@/lib/student-progress";

export function CourseStatusControl({
  courseId,
  courseName,
}: {
  courseId: Id<"courses">;
  courseName: string;
}) {
  const [status, setStatus] = useState<CourseProgressStatus>("none");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setStatus(getCourseStatus(courseId));
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [courseId]);

  const handleStatusChange = (nextStatus: CourseProgressStatus) => {
    setStatus(nextStatus);
    setCourseStatus(courseId, nextStatus);
  };

  return (
    <div className="mt-5 rounded-xl border border-surface-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-surface-700 dark:bg-surface-900/70">
      <p className="text-xs font-medium text-surface-500 dark:text-surface-400">
        تقدمك في المادة
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-surface-800 dark:text-surface-100">
        {courseName}
      </p>
      <div className="mt-3">
        <CourseStatusSelector
          ariaLabel={`حالة تقدمك في ${courseName}`}
          value={status}
          onChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
