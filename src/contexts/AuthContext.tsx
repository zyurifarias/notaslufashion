
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Define the authentication context type
interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: async () => false,
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

  // Login function to authenticate user against the database
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Use the database function to check credentials
      const { data, error } = await supabase.rpc('check_admin_credentials', {
        p_username: username,
        p_password: password
      });

      if (error) {
        console.error('Authentication error:', error);
        toast({
          title: "Erro de autenticação",
          description: "Ocorreu um erro ao verificar suas credenciais.",
          variant: "destructive",
        });
        return false;
      }

      if (data) {
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
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro de sistema",
        description: "Não foi possível conectar-se ao servidor.",
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
