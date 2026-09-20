import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, loginApi, registerApi, getMeApi, loginWithGithubApi } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGithub: () => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('scilens_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('scilens_token');
      if (storedToken) {
        try {
          const profile = await getMeApi(storedToken);
          setUser(profile);
          setToken(storedToken);
        } catch {
          // In offline / GitHub deployment mode, preserve local user profile if present
          try {
            const cached = localStorage.getItem('scilens_current_user');
            if (cached) {
              const localUser = JSON.parse(cached);
              setUser(localUser);
              setToken(storedToken);
              setIsLoading(false);
              return;
            }
          } catch (e) {}

          localStorage.removeItem('scilens_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, password: string) => {
    const res = await loginApi({ email, password });
    localStorage.setItem('scilens_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await registerApi({ name, email, password });
    localStorage.setItem('scilens_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  const loginWithGithub = async () => {
    const res = await loginWithGithubApi();
    localStorage.setItem('scilens_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  const loginAsDemo = async () => {
    const res = await loginApi({ email: 'demo@scilens.ai', password: 'password123' });
    localStorage.setItem('scilens_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('scilens_token');
    localStorage.removeItem('scilens_current_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        loginWithGithub,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
