import styles from "./home-hero.module.css";

export function HomeHero({ visitorsTotal }: { visitorsTotal: number | null }) {
  return (
    <section className={`${styles.hero} relative overflow-hidden border-b border-surface-200/60 bg-surface-50 px-4 py-12 text-surface-900 dark:border-surface-800 dark:bg-surface-950 dark:text-surface-50 sm:px-6 sm:py-16`}>
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-6 w-64 text-primary-600 dark:text-primary-400 sm:w-80" aria-hidden="true">
          <svg viewBox="0 0 360 190" fill="none" className="block w-full" focusable="false" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="174" cy="169" rx="98" ry="8" fill="currentColor" opacity=".06" stroke="none" />
            <path className={styles.trail} d="M88 88C34 83 27 37 64 32C111 25 110 85 162 65S233 11 285 43" strokeDasharray="4 7" opacity=".35" />
            <g className={styles.book}>
              <path d="M76 98Q125 78 174 103Q223 78 272 98L267 155Q218 140 174 163Q130 140 81 155Z" fill="currentColor" fillOpacity=".12" />
              <path d="M85 87Q134 75 174 99Q214 75 263 87V146Q213 135 174 158Q135 135 85 146Z" className={styles.paper} />
              <path d="M174 100V157" opacity=".5" />
              <g opacity=".4">
                <path d="M99 105Q127 101 154 113M99 118Q127 114 154 126M99 131Q119 128 138 134" />
                <path d="M194 113Q222 101 249 105M194 126Q222 114 249 118M210 134Q230 128 249 131" />
              </g>
              <path className={styles.page} d="M174 99Q197 66 239 65L250 124Q205 130 174 158Z" fill="currentColor" fillOpacity=".08" />
              <path d="M222 139V158L215 153L208 164V143" fill="currentColor" stroke="none" />
            </g>
            <g className={styles.note}>
              <rect x="51" y="58" width="37" height="46" rx="5" className={styles.paper} />
              <path d="M60 70H78M60 78H73" opacity=".4" />
              <path className={styles.check} pathLength="1" d="M61 89L66 94L77 84" />
            </g>
            <g className={styles.plane}>
              <path d="M279 45L326 24L306 71L298 51Z" className={styles.paper} />
              <path d="M298 51L326 24M298 51L296 64L303 59" />
              <path d="M279 45L298 51L326 24Z" fill="currentColor" fillOpacity=".12" />
            </g>
            <g className={styles.spark} opacity=".6">
              <path d="M121 34V46M115 40H127M292 106V116M287 111H297" />
              <circle cx="39" cy="125" r="3" />
              <circle cx="246" cy="30" r="2" fill="currentColor" stroke="none" />
            </g>
          </svg>
        </div>
        <p className={`${styles.reveal} text-sm font-medium text-primary-600 dark:text-primary-400`}>
          المنصة الأكاديمية الأولــى
        </p>
        <h1 className={`${styles.reveal} ${styles.title} mt-4 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl`}>
          <span className="relative inline-block pb-4">
            عـــــون
            <svg aria-hidden="true" focusable="false" viewBox="0 0 200 16" fill="none" className="absolute bottom-0 left-0 w-full text-primary-500/60">
              <path className={styles.underline} pathLength="1" d="M5 11Q80 0 195 7M43 14Q109 7 167 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </span>
        </h1>
        <p className={`${styles.reveal} ${styles.description} mx-auto mt-5 max-w-xl text-lg leading-relaxed text-surface-600 dark:text-surface-300 sm:text-xl`}>
          منصة مجانية تجمع الملخصات، الامتحانات، والمصـادر الأكاديمية لطلاب الجامعات الأردنية
        </p>
        <a href="#universities" className={`${styles.reveal} ${styles.action} mt-7 inline-flex min-h-11 items-center gap-3 rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600`}>
          اختر جامعتك وابدأ
          <svg aria-hidden="true" focusable="false" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4V20M6 14L12 20L18 14" />
          </svg>
        </a>
        {visitorsTotal !== null && (
          <p className={`${styles.reveal} ${styles.visitors} mt-5 text-xs text-surface-500 dark:text-surface-400`}>
            <span className="font-semibold tabular-nums text-surface-700 dark:text-surface-200">{visitorsTotal.toLocaleString()}</span>
            {" "}إجمـالي الزوار
          </p>
        )}
      </div>
    </section>
  );
}
