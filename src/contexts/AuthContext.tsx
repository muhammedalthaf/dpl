import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Simple hardcoded credentials - in production, use proper backend auth
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "cvcl@2025";

// Helper to check localStorage (runs synchronously on initial load)
const getInitialAuthState = (): boolean => {
  try {
    return localStorage.getItem("cvcl-admin-auth") === "true";
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize directly from localStorage - no useEffect delay
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getInitialAuthState);
  const [isLoading] = useState<boolean>(false);

  const login = (username: string, password: string): boolean => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("cvcl-admin-auth", "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("cvcl-admin-auth");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

