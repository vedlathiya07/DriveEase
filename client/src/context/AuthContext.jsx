/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import API from "../services/api";

const AuthContext = createContext(null);

const parseStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

const clearStoredSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => parseStoredUser());
  const [isBootstrapping, setIsBootstrapping] = useState(() =>
    Boolean(localStorage.getItem("token")),
  );

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser);

    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
      return;
    }

    localStorage.removeItem("user");
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setToken("");
    setUser(null);
    setIsBootstrapping(false);
  }, []);

  const login = useCallback((nextToken, nextUser) => {
    localStorage.setItem("token", nextToken);
    setToken(nextToken);
    applyUser(nextUser);
    setIsBootstrapping(false);
  }, [applyUser]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return null;
    }

    const response = await API.get("/users/me");
    applyUser(response.data.user);
    return response.data.user;
  }, [applyUser, token]);

  const toggleWishlist = useCallback(async (carId) => {
    const response = await API.put(`/users/wishlist/${carId}`);
    applyUser(response.data.user);
    return response.data.isWishlisted;
  }, [applyUser]);

  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener("driveease:auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("driveease:auth-expired", handleAuthExpired);
    };
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setIsBootstrapping(false);
      return;
    }

    let ignore = false;

    const syncUser = async () => {
      try {
        const latestUser = await refreshUser();

        if (!ignore && latestUser) {
          setIsBootstrapping(false);
        }
      } catch {
        if (!ignore) {
          logout();
        }
      } finally {
        if (!ignore) {
          setIsBootstrapping(false);
        }
      }
    };

    syncUser();

    return () => {
      ignore = true;
    };
  }, [logout, refreshUser, token]);

  return (
    <AuthContext.Provider
      value={{
        authLoading: isBootstrapping,
        isAuthenticated: Boolean(token),
        isBootstrapping,
        login,
        logout,
        refreshUser,
        token,
        toggleWishlist,
        updateUser: applyUser,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
