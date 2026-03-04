"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({
  children,
  sessionToken,
}: {
  children: ReactNode;
  sessionToken: string | null;
}) {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider sessionToken={sessionToken}>{children}</AuthProvider>
    </ConvexProvider>
  );
}
