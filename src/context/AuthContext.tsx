import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../services/api';

const REMEMBER_KEY = 'hr_remember_me_login';

export interface RememberedAccount {
  email: string;
  role?: string;
  company_id?: string;
  name?: string;
  savedAt?: string;
}

export function getRememberedAccount(): RememberedAccount | null {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setRememberedAccount(account: RememberedAccount | null) {
  try {
    if (account) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify(account));
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  } catch {}
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string, company_id?: string, rememberMe?: boolean) => Promise<void>;
  registerCandidate: (data: any, rememberMe?: boolean) => Promise<void>;
  registerHr: (data: any, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  switchCompany: (company_id: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  unreadNotifications: number;
  setUnreadNotifications: React.Dispatch<React.SetStateAction<number>>;
  refreshNotificationsCount: () => Promise<void>;
  rememberedAccount: RememberedAccount | null;
  clearRememberedAccount: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [rememberedAccount, setRememberedAccountState] = useState<RememberedAccount | null>(getRememberedAccount());

  const refreshUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data);
      refreshNotificationsCount();
    } catch (err: any) {
      // If unauthorized, clean up expired token
      const message = String(err?.message || '');
      if (message.includes('expired') || message.includes('Authentication') || message.includes('denied')) {
        removeStoredToken();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshNotificationsCount = async () => {
    try {
      const res = await api.getNotifications();
      setUnreadNotifications(res.unreadCount);
    } catch {}
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string, company_id?: string, rememberMe: boolean = true) => {
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      const payload: any = { email: cleanEmail, password: pass };
      if (company_id && company_id.trim()) {
        payload.company_id = company_id.trim();
      }
      const res = await api.login(payload);
      setStoredToken(res.token);

      if (rememberMe) {
        const remembered: RememberedAccount = {
          email: cleanEmail,
          role: res.user?.role,
          company_id: res.user?.company_id,
          name: res.user?.name,
          savedAt: new Date().toISOString(),
        };
        setRememberedAccount(remembered);
        setRememberedAccountState(remembered);
      } else {
        setRememberedAccount(null);
        setRememberedAccountState(null);
      }

      await refreshUser();
    } finally {
      setLoading(false);
    }
  };

  const switchCompany = async (company_id: string) => {
    setLoading(true);
    try {
      const res = await api.switchCompany(company_id.trim());
      setStoredToken(res.token);
      await refreshUser();
    } finally {
      setLoading(false);
    }
  };

  const registerCandidate = async (data: any, rememberMe: boolean = true) => {
    setLoading(true);
    try {
      const res = await api.registerCandidate(data);
      setStoredToken(res.token);

      if (rememberMe) {
        const remembered: RememberedAccount = {
          email: data.email.trim(),
          role: 'candidate',
          name: data.name,
          savedAt: new Date().toISOString(),
        };
        setRememberedAccount(remembered);
        setRememberedAccountState(remembered);
      }

      await refreshUser();
    } finally {
      setLoading(false);
    }
  };

  const registerHr = async (data: any, rememberMe: boolean = true) => {
    setLoading(true);
    try {
      const res = await api.registerHr(data);
      setStoredToken(res.token);

      if (rememberMe) {
        const remembered: RememberedAccount = {
          email: data.email.trim(),
          role: 'hr',
          company_id: res.user?.company_id,
          name: data.name,
          savedAt: new Date().toISOString(),
        };
        setRememberedAccount(remembered);
        setRememberedAccountState(remembered);
      }

      await refreshUser();
    } finally {
      setLoading(false);
    }
  };

  const clearRememberedAccount = () => {
    setRememberedAccount(null);
    setRememberedAccountState(null);
  };

  const logout = () => {
    removeStoredToken();
    setUser(null);
    setUnreadNotifications(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerCandidate,
        registerHr,
        logout,
        switchCompany,
        refreshUser,
        unreadNotifications,
        setUnreadNotifications,
        refreshNotificationsCount,
        rememberedAccount,
        clearRememberedAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
