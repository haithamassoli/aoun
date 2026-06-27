import type { Metadata } from "next";
import { PartnersGrid } from "@/components/partners-grid";
import * as motion from "motion/react-client";
import { getCachedPartners } from "@/lib/cached-public-data";

export const metadata: Metadata = {
  title: "الشركاء والداعمون",
  description: "الجهات الداعمة والشريكة لمنصة عون",
  alternates: {
    canonical: "/partners",
  },
};

export default async function PartnersPage() {
  const partners = await getCachedPartners().catch(() => []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <PartnersGrid initialPartners={partners} />
    </motion.div>
  );
}
