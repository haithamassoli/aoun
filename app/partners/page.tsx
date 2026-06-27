import type { Metadata } from "next";
import { PartnersGrid } from "@/components/partners-grid";
import * as motion from "motion/react-client";

export const instant = {
  unstable_samples: [{ cookies: [{ name: "aoun_session", value: null }] }],
};

export const metadata: Metadata = {
  title: "الشركاء والداعمون",
  description: "الجهات الداعمة والشريكة لمنصة عون",
  alternates: {
    canonical: "/partners",
  },
};

export default function PartnersPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <PartnersGrid />
    </motion.div>
  );
}
