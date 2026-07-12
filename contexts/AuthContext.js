import { createContext, useContext, useEffect, useState } from "react";

import {
  clearStoredToken,
  getMe,
  getStoredToken,
  loginUser,
  logoutUser,
  registerUser,
  saveToken,
} from "../services/mercattoApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isBooting, setIsBooting] = useState(true);

  const clearSession = async () => {
    await clearStoredToken();
    setToken(null);
    setProfile(null);
  };

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const storedToken = await getStoredToken();

        if (!mounted) {
          return;
        }

        if (!storedToken) {
          setToken(null);
          setProfile(null);
          return;
        }

        const currentProfile = await getMe();

        if (!mounted) {
          return;
        }

        setToken(storedToken);
        setProfile(currentProfile);
      } catch {
        if (mounted) {
          await clearSession();
        }
      } finally {
        if (mounted) {
          setIsBooting(false);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const persistSession = async (response) => {
    const nextToken = response?.token;
    const nextProfile = response?.user ?? null;

    if (nextToken) {
      await saveToken(nextToken);
      setToken(nextToken);
    }

    if (nextProfile) {
      setProfile(nextProfile);
    }

    return response;
  };

  const login = async (payload) => {
    const response = await loginUser(payload);
    return persistSession(response);
  };

  const register = async (payload) => {
    const response = await registerUser(payload);
    return persistSession(response);
  };

  const logout = async () => {
    if (token) {
      await logoutUser(token).catch(() => null);
    }

    await clearSession();
  };

  const value = {
    isBooting,
    token,
    profile,
    login,
    register,
    logout,
    refreshProfile: async () => {
      if (!token) {
        return null;
      }
      try {
        const currentProfile = await getMe();
        setProfile(currentProfile);
        return currentProfile;
      } catch (error) {
        if (error?.status === 401) {
          await clearSession();
        }
        throw error;
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
