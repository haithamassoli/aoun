"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import arLocale from "@fullcalendar/core/locales/ar";
import type { EventClickArg, EventContentArg, EventInput } from "@fullcalendar/core";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Toast, useToast } from "@/components/toast";
import {
  AcademicCalendarForm,
  type AcademicCalendarFormValues,
} from "./academic-calendar-form";
import {
  loadAcademicCalendarEvents,
  saveAcademicCalendarEvents,
  type AcademicCalendarCategory,
  type AcademicCalendarEvent,
  type AcademicCalendarStorageState,
} from "./academic-calendar-storage";
import styles from "./academic-calendar.module.css";

type PlannerView = "dayGridMonth" | "timeGridWeek";
type PlannerDialogState =
  | { open: false }
  | {
      open: true;
      mode: "create" | "edit";
      eventId?: string;
      values: AcademicCalendarFormValues;
    };

const CATEGORY_META: Record<
  AcademicCalendarCategory,
  {
    label: string;
    chipClassName: string;
    softClassName: string;
  }
> = {
  exam: {
    label: "امتحان",
    chipClassName:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
    softClassName:
      "from-red-500/15 via-orange-500/10 to-transparent text-red-700 dark:text-red-300",
  },
  registration: {
    label: "تسجيل",
    chipClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
    softClassName:
      "from-sky-500/15 via-blue-500/10 to-transparent text-sky-700 dark:text-sky-300",
  },
  add_drop: {
    label: "سحب وإضافة",
    chipClassName:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300",
    softClassName:
      "from-violet-500/15 via-fuchsia-500/10 to-transparent text-violet-700 dark:text-violet-300",
  },
  project: {
    label: "مشروع",
    chipClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    softClassName:
      "from-emerald-500/15 via-teal-500/10 to-transparent text-emerald-700 dark:text-emerald-300",
  },
};

const EMPTY_FORM_VALUES: AcademicCalendarFormValues = {
  title: "",
  category: "exam",
  date: "",
  hasTime: false,
  startTime: "",
  endTime: "",
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTimeInput(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addHours(date: Date, hours: number) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

function createEventId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toFormValues(event: AcademicCalendarEvent): AcademicCalendarFormValues {
  if (event.allDay) {
    return {
      title: event.title,
      category: event.category,
      date: event.start,
      hasTime: false,
      startTime: "",
      endTime: "",
    };
  }

  const startDate = new Date(event.start);
  const endDate = event.end ? new Date(event.end) : null;

  return {
    title: event.title,
    category: event.category,
    date: formatDateInput(startDate),
    hasTime: true,
    startTime: formatTimeInput(startDate),
    endTime:
      endDate && !Number.isNaN(endDate.getTime()) ? formatTimeInput(endDate) : "",
  };
}

function buildFormValuesFromDateClick(arg: DateClickArg): AcademicCalendarFormValues {
  if (arg.allDay) {
    return {
      ...EMPTY_FORM_VALUES,
      date: arg.dateStr.slice(0, 10),
    };
  }

  const start = arg.date;
  const end = addHours(start, 1);

  return {
    ...EMPTY_FORM_VALUES,
    date: formatDateInput(start),
    hasTime: true,
    startTime: formatTimeInput(start),
    endTime: formatTimeInput(end),
  };
}

function combineDateAndTime(date: string, time: string) {
  return `${date}T${time}:00`;
}

function toCalendarInput(event: AcademicCalendarEvent): EventInput {
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    classNames: [`planner-event--${event.category}`],
    extendedProps: {
      category: event.category,
    },
  };
}

function renderEventContent(content: EventContentArg) {
  const category = content.event.extendedProps.category as AcademicCalendarCategory;

  return (
    <div className={styles.eventCard}>
      {content.timeText ? (
        <span className={styles.eventTime}>{content.timeText}</span>
      ) : null}
      <span className={styles.eventTitle}>{content.event.title}</span>
      <span className={styles.eventCategory}>{CATEGORY_META[category].label}</span>
    </div>
  );
}

export function AcademicCalendar() {
  const calendarRef = useRef<FullCalendar | null>(null);
  const toast = useToast();
  const showToast = toast.show;
  const [events, setEvents] = useState<AcademicCalendarEvent[]>([]);
  const [storageState, setStorageState] =
    useState<AcademicCalendarStorageState>("ready");
  const [currentView, setCurrentView] = useState<PlannerView>("dayGridMonth");
  const [currentRangeLabel, setCurrentRangeLabel] = useState("هذا الشهر");
  const [dialogState, setDialogState] = useState<PlannerDialogState>({
    open: false,
  });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const snapshot = loadAcademicCalendarEvents();
      setEvents(snapshot.events);
      setStorageState(snapshot.state);

      if (snapshot.state === "corrupt") {
        showToast("تمت إعادة ضبط البيانات المحلية غير الصالحة.", "error");
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [showToast]);

  const persistEvents = (
    nextEvents: AcademicCalendarEvent[],
    successMessage: string,
  ) => {
    setEvents(nextEvents);

    const result = saveAcademicCalendarEvents(nextEvents);
    setStorageState(result.state);

    if (result.ok) {
      showToast(successMessage);
      return;
    }

    showToast(
      "تم تحديث الواجهة، لكن التخزين المحلي غير متاح على هذا المتصفح حالياً.",
      "error",
    );
  };

  const openCreateDialog = (values: AcademicCalendarFormValues = EMPTY_FORM_VALUES) => {
    setDialogState({
      open: true,
      mode: "create",
      values,
    });
  };

  const openEditDialog = (event: AcademicCalendarEvent) => {
    setDialogState({
      open: true,
      mode: "edit",
      eventId: event.id,
      values: toFormValues(event),
    });
  };

  const closeDialog = () => {
    setDialogState({ open: false });
    setDeleteTargetId(null);
  };

  const handleDateClick = (arg: DateClickArg) => {
    openCreateDialog(buildFormValuesFromDateClick(arg));
  };

  const handleEventClick = (arg: EventClickArg) => {
    const clickedEvent = events.find((event) => event.id === arg.event.id);

    if (!clickedEvent) {
      return;
    }

    openEditDialog(clickedEvent);
  };

  const handleSubmit = (values: AcademicCalendarFormValues) => {
    const eventRecord: AcademicCalendarEvent = values.hasTime
      ? {
          id:
            dialogState.open && dialogState.mode === "edit" && dialogState.eventId
              ? dialogState.eventId
              : createEventId(),
          title: values.title,
          category: values.category,
          start: combineDateAndTime(values.date, values.startTime),
          end: values.endTime
            ? combineDateAndTime(values.date, values.endTime)
            : undefined,
          allDay: false,
        }
      : {
          id:
            dialogState.open && dialogState.mode === "edit" && dialogState.eventId
              ? dialogState.eventId
              : createEventId(),
          title: values.title,
          category: values.category,
          start: values.date,
          allDay: true,
        };

    if (dialogState.open && dialogState.mode === "edit" && dialogState.eventId) {
      const nextEvents = events.map((event) =>
        event.id === dialogState.eventId ? eventRecord : event,
      );

      persistEvents(nextEvents, "تم تحديث الموعد الأكاديمي.");
    } else {
      persistEvents([...events, eventRecord], "تمت إضافة الموعد إلى التقويم.");
    }

    closeDialog();
  };

  const handleDeleteConfirmed = () => {
    if (!deleteTargetId) {
      return;
    }

    persistEvents(
      events.filter((event) => event.id !== deleteTargetId),
      "تم حذف الموعد من التقويم.",
    );
    closeDialog();
  };

  const navigateCalendar = (action: "today" | "prev" | "next") => {
    const api = calendarRef.current?.getApi();

    if (!api) {
      return;
    }

    if (action === "today") {
      api.today();
      return;
    }

    if (action === "prev") {
      api.prev();
      return;
    }

    api.next();
  };

  const changeView = (view: PlannerView) => {
    const api = calendarRef.current?.getApi();

    if (!api) {
      return;
    }

    startTransition(() => {
      setCurrentView(view);
    });
    api.changeView(view);
  };

  const categoryCounts = {
    exam: events.filter((event) => event.category === "exam").length,
    registration: events.filter((event) => event.category === "registration").length,
    add_drop: events.filter((event) => event.category === "add_drop").length,
    project: events.filter((event) => event.category === "project").length,
  } satisfies Record<AcademicCalendarCategory, number>;

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-[32px] border border-primary-100 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(239,246,255,0.85))] p-6 shadow-[0_28px_90px_-52px_rgba(37,99,235,0.55)] dark:border-primary-900/40 dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.2),transparent_42%),linear-gradient(180deg,rgba(2,6,23,0.95),rgba(15,23,42,0.92))]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-primary-700 uppercase shadow-sm dark:border-primary-800/50 dark:bg-primary-950/40 dark:text-primary-200">
                مخطط أكاديمي محلي
              </div>
              <h2 className="mt-4 text-2xl font-bold text-surface-950 dark:text-surface-50 sm:text-3xl">
                رتّب الامتحانات والمشاريع ومواعيد التسجيل في مساحة واحدة
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-8 text-surface-600 dark:text-surface-300">
                كل المواعيد تُحفظ محلياً على نفس الجهاز والمتصفح. اضغط على أي
                يوم لإضافة موعد جديد، أو افتح الحدث لتعديله وحذفه.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[26rem]">
              {(Object.entries(CATEGORY_META) as [
                AcademicCalendarCategory,
                (typeof CATEGORY_META)[AcademicCalendarCategory],
              ][]).map(([category, meta]) => (
                <div
                  key={category}
                  className={`rounded-2xl border border-white/70 bg-linear-to-br ${meta.softClassName} border-surface-200/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-surface-700/80`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{meta.label}</span>
                    <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs font-bold text-surface-900 dark:bg-surface-900/85 dark:text-surface-50">
                      {categoryCounts[category]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-surface-200 bg-white/85 px-3 py-1.5 text-xs font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-900/85 dark:text-surface-300">
              عرض شهري سريع للمواعيد الكثيفة
            </span>
            <span className="rounded-full border border-surface-200 bg-white/85 px-3 py-1.5 text-xs font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-900/85 dark:text-surface-300">
              عرض أسبوعي قابل للتمرير للأوقات الدقيقة
            </span>
            <span className="rounded-full border border-surface-200 bg-white/85 px-3 py-1.5 text-xs font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-900/85 dark:text-surface-300">
              حفظ محلي بدون تسجيل دخول
            </span>
          </div>
        </div>

        {storageState !== "ready" ? (
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            {storageState === "blocked"
              ? "التخزين المحلي غير متاح الآن. يمكنك استخدام التقويم مؤقتاً، لكن التغييرات قد لا تبقى بعد إعادة التحميل."
              : "تم العثور على بيانات محلية غير صالحة وتم تجاهلها لحماية الصفحة من التعطل."}
          </div>
        ) : null}

        <div className="rounded-[32px] border border-surface-200 bg-white/90 p-4 shadow-[0_26px_90px_-56px_rgba(15,23,42,0.45)] backdrop-blur-sm dark:border-surface-700 dark:bg-surface-900/85">
          <div className="flex flex-col gap-4 border-b border-surface-100 px-2 pb-4 dark:border-surface-800 sm:px-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-surface-400 uppercase dark:text-surface-500">
                  نافذة العرض
                </p>
                <h3 className="mt-1 text-xl font-bold text-surface-950 dark:text-surface-50">
                  {currentRangeLabel}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-surface-200 bg-surface-50 p-1 dark:border-surface-700 dark:bg-surface-800">
                  <button
                    type="button"
                    onClick={() => changeView("dayGridMonth")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      currentView === "dayGridMonth"
                        ? "bg-white text-primary-600 shadow-sm dark:bg-surface-900 dark:text-primary-300"
                        : "text-surface-500 hover:text-surface-800 dark:text-surface-300 dark:hover:text-surface-100"
                    }`}
                  >
                    شهري
                  </button>
                  <button
                    type="button"
                    onClick={() => changeView("timeGridWeek")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      currentView === "timeGridWeek"
                        ? "bg-white text-primary-600 shadow-sm dark:bg-surface-900 dark:text-primary-300"
                        : "text-surface-500 hover:text-surface-800 dark:text-surface-300 dark:hover:text-surface-100"
                    }`}
                  >
                    أسبوعي
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openCreateDialog()}
                  className="inline-flex items-center justify-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400"
                >
                  إضافة موعد
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigateCalendar("prev")}
                className="rounded-full border border-surface-200 px-3 py-1.5 text-sm font-medium text-surface-600 transition hover:bg-surface-50 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={() => navigateCalendar("today")}
                className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition hover:bg-primary-100 dark:border-primary-900/50 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-950/70"
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => navigateCalendar("next")}
                className="rounded-full border border-surface-200 px-3 py-1.5 text-sm font-medium text-surface-600 transition hover:bg-surface-50 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
              >
                التالي
              </button>
              <span className="ms-auto text-xs text-surface-400 dark:text-surface-500">
                اضغط على أي خانة فارغة لإضافة موعد بسرعة
              </span>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="mx-2 mt-6 rounded-[28px] border border-dashed border-surface-200 bg-surface-50 px-6 py-8 text-center dark:border-surface-700 dark:bg-surface-800/60">
              <p className="text-lg font-semibold text-surface-800 dark:text-surface-100">
                لا توجد مواعيد بعد
              </p>
              <p className="mt-2 text-sm leading-7 text-surface-500 dark:text-surface-400">
                ابدأ بإضافة أول امتحان أو موعد تسجيل، ثم بدّل بين العرض الشهري
                والأسبوعي لترى الخطة كاملة.
              </p>
              <button
                type="button"
                onClick={() => openCreateDialog()}
                className="mt-5 inline-flex items-center justify-center rounded-full bg-surface-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-surface-800 dark:bg-surface-100 dark:text-surface-950 dark:hover:bg-white"
              >
                أضف أول موعد
              </button>
            </div>
          ) : null}

          <div className="mt-6 overflow-x-auto px-2 pb-2 sm:px-3">
            <div
              className={`${styles.planner} ${
                currentView === "timeGridWeek" ? "min-w-[860px]" : "min-w-full"
              }`}
            >
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={arLocale}
                direction="rtl"
                firstDay={0}
                height={currentView === "timeGridWeek" ? 720 : "auto"}
                editable={false}
                selectable={false}
                eventDisplay="block"
                dayMaxEventRows={3}
                weekends
                nowIndicator
                allDaySlot
                headerToolbar={false}
                moreLinkText={(count) => `+${count} مواعيد`}
                dayHeaderFormat={{ weekday: "short" }}
                eventTimeFormat={{
                  hour: "numeric",
                  minute: "2-digit",
                  meridiem: "short",
                }}
                slotLabelFormat={{
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }}
                slotMinTime="08:00:00"
                slotMaxTime="22:00:00"
                scrollTime="08:00:00"
                scrollTimeReset
                eventContent={renderEventContent}
                datesSet={(arg) => {
                  setCurrentRangeLabel(arg.view.title);
                  setCurrentView(arg.view.type as PlannerView);
                }}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                events={events.map(toCalendarInput)}
              />
            </div>
          </div>
        </div>
      </section>

      <AcademicCalendarForm
        key={
          dialogState.open
            ? `${dialogState.mode}-${dialogState.eventId ?? dialogState.values.date}`
            : "closed"
        }
        open={dialogState.open}
        mode={dialogState.open ? dialogState.mode : "create"}
        initialValues={dialogState.open ? dialogState.values : EMPTY_FORM_VALUES}
        onClose={closeDialog}
        onDelete={
          dialogState.open && dialogState.mode === "edit" && dialogState.eventId
            ? () => setDeleteTargetId(dialogState.eventId)
            : undefined
        }
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="حذف الموعد؟"
        description="سيتم حذف هذا الموعد من التقويم المحلي نهائياً على هذا الجهاز."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirmed}
      />

      <Toast toast={toast} />
    </>
  );
}
