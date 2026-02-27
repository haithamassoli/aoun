import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function Home() {
  let universities: Awaited<ReturnType<typeof fetchQuery<typeof api.universities.list>>> = [];
  try {
    universities = await fetchQuery(api.universities.list);
  } catch {
    // Convex may not have data yet
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-900 px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            عون
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-primary-100 sm:text-xl">
            منصة مجانية تجمع الملخصات، الامتحانات، والمصادر الأكاديمية لطلاب
            الجامعات الأردنية. كل شي بمكان واحد.
          </p>
          <p className="mt-2 text-base text-primary-200">
            اختر جامعتك وابدأ بتصفح المواد
          </p>
        </div>
      </section>

      {/* Universities Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-surface-800 sm:text-3xl">
          الجامعات
        </h2>

        {universities.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {universities
              .sort((a, b) => a.order - b.order)
              .map((uni) => (
                <a
                  key={uni._id}
                  href={`/${uni.slug}`}
                  className="group flex flex-col items-center gap-4 rounded-2xl border border-surface-200 bg-white p-8 shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
                >
                  {uni.logoUrl && (
                    <img
                      src={uni.logoUrl}
                      alt={uni.name}
                      className="h-20 w-20 rounded-xl object-contain"
                    />
                  )}
                  {!uni.logoUrl && (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary-100 text-3xl font-bold text-primary-600">
                      {uni.name.charAt(0)}
                    </div>
                  )}
                  <h3 className="text-center text-lg font-semibold text-surface-800 group-hover:text-primary-600">
                    {uni.name}
                  </h3>
                </a>
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "الجامعة الأردنية",
              "جامعة اليرموك",
              "الجامعة الهاشمية",
              "جامعة العلوم والتكنولوجيا",
            ].map((name) => (
              <div
                key={name}
                className="flex flex-col items-center gap-4 rounded-2xl border border-surface-200 bg-white p-8 shadow-sm"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary-100 text-3xl font-bold text-primary-600">
                  {name.charAt(0)}
                </div>
                <h3 className="text-center text-lg font-semibold text-surface-800">
                  {name}
                </h3>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
