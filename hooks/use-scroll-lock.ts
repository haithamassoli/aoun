"use client";

import { useEffect } from "react";

type ScrollLockStyles = Partial<
  Pick<
    CSSStyleDeclaration,
    "overflow" | "overflowX" | "overscrollBehavior" | "width"
  >
>;

type ScrollLockTarget = "body" | "documentElement";

type ScrollLockOptions = {
  body?: ScrollLockStyles;
  documentElement?: ScrollLockStyles;
};

const DEFAULT_SCROLL_LOCK_OPTIONS: ScrollLockOptions = {
  body: {
    overflow: "hidden",
  },
};

function applyStyleLock(
  element: HTMLElement,
  styles: ScrollLockStyles,
): () => void {
  const previousStyles = Object.fromEntries(
    Object.keys(styles).map((property) => [
      property,
      element.style[property as keyof ScrollLockStyles],
    ]),
  ) as Partial<Record<keyof ScrollLockStyles, string>>;

  for (const [property, value] of Object.entries(styles)) {
    if (value !== undefined) {
      element.style[property as keyof ScrollLockStyles] = value;
    }
  }

  return () => {
    for (const [property, value] of Object.entries(previousStyles)) {
      element.style[property as keyof ScrollLockStyles] = value ?? "";
    }
  };
}

function resolveTarget(target: ScrollLockTarget) {
  return target === "body" ? document.body : document.documentElement;
}

export function useScrollLock(
  locked: boolean,
  options: ScrollLockOptions = DEFAULT_SCROLL_LOCK_OPTIONS,
) {
  useEffect(() => {
    if (!locked) {
      return;
    }

    const cleanups = (Object.entries(options) as [
      ScrollLockTarget,
      ScrollLockStyles | undefined,
    ][])
      .filter(([, styles]) => styles && Object.keys(styles).length > 0)
      .map(([target, styles]) =>
        applyStyleLock(resolveTarget(target), styles ?? {}),
      );

    return () => {
      for (const cleanup of cleanups.reverse()) {
        cleanup();
      }
    };
  }, [locked, options]);
}
