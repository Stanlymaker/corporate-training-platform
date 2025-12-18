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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('currentUser');
      const token = localStorage.getItem('authToken');
      
      if (savedUser && token) {
        setUser(JSON.parse(savedUser));
        
        try {
          const response = await fetch(`${API_ENDPOINTS.AUTH}?action=verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Auth-Token': token,
            },
          });

          if (!response.ok) {
            setUser(null);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.error('Auth verification error (keeping user logged in):', error);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('[DEBUG] Login attempt:', { email, endpoint: API_ENDPOINTS.AUTH });
      
      const response = await fetch(`${API_ENDPOINTS.AUTH}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('[DEBUG] Response status:', response.status);
      
      const responseText = await response.text();
      console.log('[DEBUG] Response body:', responseText);

      if (!response.ok) {
        console.error('[DEBUG] Login failed with status:', response.status);
        return false;
      }

      const data = JSON.parse(responseText);
      console.log('[DEBUG] Parsed data:', data);
      
      if (data.token && data.user) {
        setAuthToken(data.token);
        setUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        console.log('[DEBUG] Login successful');
        return true;
      }
      
      console.error('[DEBUG] No token or user in response');
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

  if (isLoading) {
    return null;
  }

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