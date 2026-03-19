import type { HTMLAttributes } from "react";

type SkeletonVariant = "shimmer" | "pulse";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SkeletonVariant;
};

function joinClasses(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Skeleton({
  className,
  variant = "shimmer",
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={joinClasses(
        "skeleton rounded-xl",
        variant === "shimmer"
          ? "skeleton-shimmer"
          : "animate-pulse motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
