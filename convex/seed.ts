import { internalMutation } from "./_generated/server";

export const seedUniversities = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("universities").first();
    if (existing) return "Already seeded";

    const universities = [
      { name: "الجامعة الأردنية", slug: "ju", order: 1 },
      { name: "جامعة اليرموك", slug: "yu", order: 2 },
      { name: "الجامعة الهاشمية", slug: "hu", order: 3 },
      {
        name: "جامعة العلوم والتكنولوجيا",
        slug: "just",
        order: 4,
      },
    ];

    for (const uni of universities) {
      const uniId = await ctx.db.insert("universities", uni);

      // Add sample majors for first university
      if (uni.slug === "ju") {
        const majors = [
          { name: "الهندسة الكهربائية", slug: "ee", order: 1 },
          { name: "علم الحاسوب", slug: "cs", order: 2 },
          { name: "الطب البشري", slug: "med", order: 3 },
          { name: "الصيدلة", slug: "pharm", order: 4 },
        ];

        for (const major of majors) {
          const majorId = await ctx.db.insert("majors", {
            ...major,
            universityId: uniId,
          });

          // Add sample courses for the first major (Electrical Engineering)
          if (major.slug === "ee") {
            const courses = [
              {
                name: "تحليل دوائر كهربائية 1",
                slug: "circuits-1",
                courseCode: "EE301",
                semester: 1,
                order: 1,
              },
              {
                name: "إلكترونيات 1",
                slug: "electronics-1",
                courseCode: "EE311",
                semester: 1,
                order: 2,
              },
              {
                name: "رياضيات هندسية",
                slug: "eng-math",
                courseCode: "EE201",
                semester: 1,
                order: 3,
              },
              {
                name: "تحليل دوائر كهربائية 2",
                slug: "circuits-2",
                courseCode: "EE302",
                semester: 2,
                order: 1,
              },
              {
                name: "إلكترونيات 2",
                slug: "electronics-2",
                courseCode: "EE312",
                semester: 2,
                order: 2,
              },
              {
                name: "إشارات وأنظمة",
                slug: "signals",
                courseCode: "EE321",
                semester: 2,
                order: 3,
              },
            ];

            for (const course of courses) {
              await ctx.db.insert("courses", {
                ...course,
                majorId,
              });
            }
          }
        }
      }
    }

    return "Seeded successfully";
  },
});
