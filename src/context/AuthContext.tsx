"use client";

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react";
import { getCurrentUser, login as loginService , register as registerService } from "../utils/authService";
import api from "../utils/API";

type User = {
  id: string;
  name: string;
  phone: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string , name:string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        
        const storedUser = getCurrentUser();
        if (storedUser) {
          try {
            const response = await api.get('/auth/me');
            if (response.data.user) {
              setUser(response.data.user);
              setIsAuthenticated(true);
              // تحديث بيانات المستخدم في localStorage إذا تغيرت
              localStorage.setItem('user', JSON.stringify(response.data.user));
            } else {
              clearAuthData();
            }
          } catch (verifyError) {
            console.log('Token verification failed:', verifyError);
            setUser(storedUser);
            setIsAuthenticated(true);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        // في حالة الخطأ، استخدم البيانات المحفوظة إن وجدت
        const storedUser = getCurrentUser();
        if (storedUser) {
          console.log('📱 Using stored user data (fallback)');
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // login
  const login = useCallback(async (phone: string, password: string) => {
    try {
      console.log('🔐 Attempting login...');
      const userData = await loginService(phone, password);
      if (userData) {
        console.log('✅ Login successful');
        setUser(userData);
        setIsAuthenticated(true);
        // حفظ بيانات المستخدم في localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('lastLoginTime', new Date().toISOString());
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }, []);

  const register = useCallback(async (name: string, phone: string, password: string) => {
    try {
      const userData = await registerService(name, phone, password); 
      if (userData) {
        console.log('✅ Register successful');
      }
    } catch (error) {
      console.error('Register failed:', error);
      throw error;
    }
  }, []);

  // logout
  const logout = useCallback(async () => {
    try {
      // استدعاء logout API لمسح الكوكيز من الخادم
      await api.post('/auth/logout');
    } catch (error) {
      console.error(' Logout API failed:', error);
    } finally {
      // مسح البيانات المحلية في جميع الأحوال
      clearAuthData();
      // إعادة توجيه للصفحة الرئيسية
      window.location.href = '/login';
    }
  }, []);

  // دالة لمسح بيانات المصادقة
  const clearAuthData = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('lastLoginTime');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated  , register}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
