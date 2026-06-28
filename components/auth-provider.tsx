"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getSessionToken, logoutAction } from "@/app/actions/auth";

type User = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "contributor";
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  sessionToken: string | null;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  sessionToken: null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getSessionToken().then((token) => {
      if (!isMounted) return;
      setSessionToken(token);
      setHasLoadedSession(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentUser = useQuery(
    api.auth.getCurrentUser,
    sessionToken ? { token: sessionToken } : "skip",
  );

  const isLoading =
    !hasLoadedSession || Boolean(sessionToken && currentUser === undefined);
  const user = sessionToken ? (currentUser as User | null) : null;

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    await logoutAction();
    router.replace("/login");
  }, [router]);

  // Auto-logout when session is invalid (token exists but user is null)
  useEffect(() => {
    if (sessionToken && currentUser === null && !isLoggingOut) {
      logoutAction().then(() => {
        router.replace("/login");
      });
    }
  }, [sessionToken, currentUser, isLoggingOut, router]);

  return (
    <AuthContext.Provider
      value={{
        user: isLoggingOut ? null : user,
        isLoading: isLoggingOut ? false : isLoading,
        sessionToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
