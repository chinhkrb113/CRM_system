
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole } from '../types';
import { loginUser } from '../services/mockApi';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('synergy-crm-user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    // This effect is mainly to handle the initial load.
    // In a real app, you'd validate the token here.
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
        const loggedInUser = await loginUser(email, password);

        if (loggedInUser) {
            setUser(loggedInUser);
            localStorage.setItem('synergy-crm-user', JSON.stringify(loggedInUser));
            toast({
                title: t('loginSuccess'),
                description: t('loginSuccessDesc'),
                variant: 'success',
            });
        } else {
            // Handle login failure by throwing an error to be caught by the UI
            throw new Error("Invalid credentials");
        }
    } catch (err) {
        throw err; // Re-throw for the login page to handle
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('synergy-crm-user');
  };

  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
