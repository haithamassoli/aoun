import { query } from "./_generated/server";

export const getAllPublicUrls = query({
  args: {},
  handler: async (ctx) => {
    const universities = await ctx.db.query("universities").collect();
    const majors = await ctx.db.query("majors").collect();
    const courses = await ctx.db.query("courses").collect();

    // Build lookup maps
    const uniMap = new Map(universities.map((u) => [u._id, u]));
    const majorMap = new Map(majors.map((m) => [m._id, m]));

    const urls: { path: string }[] = [{ path: "/" }];

    for (const uni of universities) {
      urls.push({ path: `/${uni.slug}` });
    }

    for (const major of majors) {
      const uni = uniMap.get(major.universityId);
      if (!uni) continue;
      urls.push({ path: `/${uni.slug}/${major.slug}` });
    }

    for (const course of courses) {
      const major = majorMap.get(course.majorId);
      if (!major) continue;
      const uni = uniMap.get(major.universityId);
      if (!uni) continue;
      urls.push({ path: `/${uni.slug}/${major.slug}/${course.slug}` });
    }

    return urls;
  },
});
