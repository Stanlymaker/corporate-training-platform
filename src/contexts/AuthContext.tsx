import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { API_ENDPOINTS, getAuthHeaders, setAuthToken, removeAuthToken } from '@/config/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Временно: сбрасываем пароль админа перед входом
      if (email === 'admin@example.com') {
        await fetch(`${API_ENDPOINTS.AUTH}?action=reset-admin`, {
          method: 'POST',
        });
      }
      
      console.log('[DEBUG] Attempting login:', email);
      const response = await fetch(`${API_ENDPOINTS.AUTH}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('[DEBUG] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('[DEBUG] Error response:', errorText);
        return false;
      }

      const data = await response.json();
      console.log('[DEBUG] Response data:', data);
      
      if (data.token && data.user) {
        setAuthToken(data.token);
        setUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_ENDPOINTS.AUTH}?action=logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    localStorage.removeItem('currentUser');
    removeAuthToken();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}