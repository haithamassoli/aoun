import type { Doc } from "@/convex/_generated/dataModel";

export type NewsWithAuthor = Doc<"news"> & {
  authorName: string;
};
