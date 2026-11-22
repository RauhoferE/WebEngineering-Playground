import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { PublicUser } from './auth-models';
import { fetchMe, logout as logoutRequest } from './auth.api';

interface AuthContextValue {
  // null = not logged in (only meaningful once loading is false)
  user: PublicUser | null;
  // true until the first /api/auth/me has answered, so the UI does not flash "Log in"
  loading: boolean;
  // Called by the login form with the user the API returned
  setUser: (user: PublicUser | null) => void;
  // Revokes the token on the server, then forgets the user; throws if the API call fails
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('Auth components must be used inside <AuthProvider>');
  }
  return context;
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  // The token cookie is HttpOnly: JavaScript cannot read it, so asking the API
  // is the only way to learn who is logged in (e.g. after a page reload)
  useEffect(() => {
    const controller = new AbortController();
    fetchMe(controller.signal)
      .then((me) => {
        setUser(me);
      })
      .catch(() => {
        // Network error or 500: show the logged-out UI; the API still enforces auth
        if (!controller.signal.aborted) setUser(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    // Only forget the user once the server has revoked the token;
    // if this throws, the UI keeps showing the user and the caller shows an error
    await logoutRequest();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, setUser, logout }),
    [user, loading, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
