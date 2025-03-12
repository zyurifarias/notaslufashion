
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

// Define the authentication context type
interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component for authentication
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  // Check for existing session on component mount
  useEffect(() => {
    const savedSession = localStorage.getItem('lufashion_auth');
    if (savedSession) {
      setIsAuthenticated(true);
    }
  }, []);

  // Login function to authenticate user
  const login = (username: string, password: string): boolean => {
    // Hardcoded credentials as requested
    if (username === 'luana' && password === 'adminlufashion') {
      setIsAuthenticated(true);
      // Save session in localStorage
      localStorage.setItem('lufashion_auth', 'true');
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vinda ao sistema de gerenciamento LuFashion!",
      });
      return true;
    } else {
      toast({
        title: "Erro de autenticação",
        description: "Usuário ou senha incorretos.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Logout function to end session
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('lufashion_auth');
    navigate('/login');
    toast({
      title: "Logout realizado",
      description: "Sessão encerrada com sucesso.",
    });
  };

  // Return the provider with context values
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
