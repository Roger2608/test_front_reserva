"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Toaster } from "sonner";
import { api, getStoredAccessToken, setAccessToken } from "@/shared/api/client";
import type { Session } from "@/shared/types/domain";

type TenantState = {
  tenantId: string;
  setTenantId: (value: string) => void;
  session: Session | null;
  ready: boolean;
  setAuth: (session: Session) => void;
  logout: () => void;
};
const TenantContext = createContext<TenantState | null>(null);
const SESSION_CACHE_KEY = "reservations.session";

function readCachedSession() {
  try {
    const value = sessionStorage.getItem(SESSION_CACHE_KEY);
    return value ? (JSON.parse(value) as Session) : null;
  } catch {
    return null;
  }
}

function cacheSession(value?: Session) {
  try {
    if (value) sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(SESSION_CACHE_KEY);
  } catch {}
}

export function hasCachedSession() {
  return typeof window !== "undefined" && readCachedSession() !== null;
}
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );
  const hydrationStarted = useRef(false);
  const [tenantId, setTenantIdState] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (hydrationStarted.current) return;
    hydrationStarted.current = true;
    queueMicrotask(async () => {
      const storedToken = getStoredAccessToken();
      if (storedToken) {
        setAccessToken(storedToken);
        const cached = readCachedSession();
        if (cached) {
          setSession({ ...cached, accessToken: storedToken });
          setTenantIdState(cached.tenant?.id ?? "");
          setReady(true);
          return;
        }
        try {
          const current = await api<Session>(
            "/api/v1/auth/me?validateSubscription=true",
            {
              noRefresh: true,
            },
          );
          cacheSession(current);
          setSession({ ...current, accessToken: storedToken });
          setTenantIdState(current.tenant?.id ?? "");
          setReady(true);
          return;
        } catch {
          setAccessToken();
        }
      }
      api<Session>("/api/v1/auth/refresh", { method: "POST", noRefresh: true })
        .then((value) => {
          setAccessToken(value.accessToken);
          cacheSession(value);
          setSession(value);
          setTenantIdState(value.tenant?.id ?? "");
        })
        .catch(() => {
          setAccessToken();
          setSession(null);
        })
        .finally(() => setReady(true));
    });
  }, []);
  const value = useMemo(
    () => ({
      tenantId,
      session,
      ready,
      setTenantId: (id: string) => setTenantIdState(id),
      setAuth: (next: Session) => {
        setAccessToken(next.accessToken);
        cacheSession(next);
        setTenantIdState(next.tenant?.id ?? "");
        setSession(next);
        setReady(true);
      },
      logout: () => {
        api("/api/v1/auth/logout", { method: "POST", noRefresh: true }).catch(
          () => undefined,
        );
        setAccessToken();
        cacheSession();
        setTenantIdState("");
        setSession(null);
      },
    }),
    [tenantId, session, ready],
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TenantContext.Provider value={value}>
        {children}
        <Toaster richColors position="top-right" />
      </TenantContext.Provider>
    </QueryClientProvider>
  );
}

export function useTenant() {
  const value = useContext(TenantContext);
  if (!value) throw new Error("useTenant debe usarse dentro de Providers");
  return value;
}
