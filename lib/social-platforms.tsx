export const socialPlatforms = [
  {
    key: "instagram",
    label: "Instagram",
    className:
      "border-pink-200 bg-pink-50/80 text-pink-700 hover:border-pink-300 hover:bg-pink-100 dark:border-pink-900/70 dark:bg-pink-950/30 dark:text-pink-200 dark:hover:border-pink-800 dark:hover:bg-pink-950/50",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 7.5h.01M8 3.75h8A4.25 4.25 0 0 1 20.25 8v8A4.25 4.25 0 0 1 16 20.25H8A4.25 4.25 0 0 1 3.75 16V8A4.25 4.25 0 0 1 8 3.75Zm4 4.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"
      />
    ),
  },
  {
    key: "telegram",
    label: "Telegram",
    className:
      "border-cyan-200 bg-cyan-50/80 text-cyan-700 hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-900/70 dark:bg-cyan-950/30 dark:text-cyan-200 dark:hover:border-cyan-800 dark:hover:bg-cyan-950/50",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 4.5-3.75 15-5.485-4.238a1.5 1.5 0 0 0-1.728-.08L7.5 16.5l.948-4.265a1.5 1.5 0 0 1 .642-.925L17.25 5.25 7.485 10.322a1.5 1.5 0 0 1-1.119.114L3 9.375 21 4.5Z"
      />
    ),
  },
  {
    key: "facebook",
    label: "Facebook Page",
    className:
      "border-sky-200 bg-sky-50/80 text-sky-700 hover:border-sky-300 hover:bg-sky-100 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-200 dark:hover:border-sky-800 dark:hover:bg-sky-950/50",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.5 20.25v-6h2.25l.75-3h-3V9.5c0-.966.784-1.75 1.75-1.75H18V4.875A16.8 16.8 0 0 0 15.75 4.5 4.5 4.5 0 0 0 11.25 9v2.25H9v3h2.25v6"
      />
    ),
  },
  {
    key: "facebookGroup",
    label: "Facebook Group",
    className:
      "border-blue-200 bg-blue-50/80 text-blue-700 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-200 dark:hover:border-blue-800 dark:hover:bg-blue-950/50",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
      />
    ),
  },
  {
    key: "faculty",
    label: "Faculty",
    className:
      "border-emerald-200 bg-emerald-50/80 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/50",
    icon: (
      <>
        <circle cx="12" cy="7.75" r="3.1" fill="none" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.25 19.5a6.75 6.75 0 0 1 13.5 0"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 10.75v2.5l-1.5 1.5 1.5 4.75 1.5-4.75-1.5-1.5v-2.5"
        />
      </>
    ),
  },
] as const;

export type SocialPlatform = (typeof socialPlatforms)[number];
