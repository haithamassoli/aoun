"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { logoutAction } from "@/app/actions/auth";

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

export function AuthProvider({
  children,
  sessionToken,
}: {
  children: ReactNode;
  sessionToken: string | null;
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const currentUser = useQuery(api.auth.getCurrentUser, {
    token: sessionToken ?? undefined,
  });

  const isLoading = currentUser === undefined;
  const user = currentUser as User | null;

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    await logoutAction();
    window.location.href = "/login";
  }, []);

  // Auto-logout when session is invalid (token exists but user is null)
  useEffect(() => {
    if (sessionToken && currentUser === null && !isLoggingOut) {
      logoutAction().then(() => {
        window.location.href = "/login";
      });
    }
  }, [sessionToken, currentUser, isLoggingOut]);

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
