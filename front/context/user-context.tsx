"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  numcontrol?: string;
  createdAt: string;
  token: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { username: string; email: string; password: string; numcontrol?: string }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasRole: (role: string | string[]) => boolean;
  checkPermission: (requiredRoles: string[], hideForRoles?: string[]) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const clearError = () => setError(null);
  
  const isAuthenticated = !!user;
  
  const isAdmin = !!user && (
    user.role?.toLowerCase() === 'administrador' || 
    user.role?.toLowerCase() === 'admin' || 
    user.role?.toLowerCase().includes('admin')
  );
  
  useEffect(() => {
    if (user) {
      console.log("Información del usuario en contexto:", JSON.stringify(user, null, 2));
      console.log("Rol del usuario actual:", user.role);
      console.log("¿Es administrador?", isAdmin);
    }
  }, [user, isAdmin]);
  
  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    
    const userRoleLower = user.role.toLowerCase();
    console.log("Verificando rol:", userRoleLower);
    
    if (userRoleLower === 'administrador' || 
        userRoleLower === 'admin' || 
        userRoleLower.includes('admin')) {
      console.log("Usuario es administrador, tiene todos los permisos");
      return true;
    }
    
    if (typeof role === 'string') {
      const result = userRoleLower === role.toLowerCase();
      console.log(`Comparando rol '${userRoleLower}' con '${role.toLowerCase()}': ${result}`);
      return result;
    }
    
    const result = role.some(r => {
      const match = userRoleLower === r.toLowerCase();
      console.log(`Comparando rol '${userRoleLower}' con '${r.toLowerCase()}': ${match}`);
      return match;
    });
    
    return result;
  };
  
  const checkPermission = (requiredRoles: string[] = [], hideForRoles: string[] = []): boolean => {
    if (!user) return false;
    
    if (isAdmin) return true;
    
    if (hideForRoles.length > 0) {
      const userRoleLower = user.role.toLowerCase();
      if (hideForRoles.some(role => userRoleLower === role.toLowerCase())) {
        return false;
      }
    }
    
    if (requiredRoles.length > 0) {
      return hasRole(requiredRoles);
    }
    
    return true;
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bibliotech-token') : null;
      
      // Si no hay token en localStorage, el usuario no está autenticado
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Primero, intentar usar la información local guardada
      const savedRole = localStorage.getItem('bibliotech-role');
      const savedUsername = localStorage.getItem('bibliotech-username');
      const savedEmail = localStorage.getItem('bibliotech-email');
      const savedNumControl = localStorage.getItem('bibliotech-numcontrol');
      
      // Si hay información guardada, usarla primero para mostrar la UI sin esperar la API
      if (savedRole && savedUsername) {
        console.log("Usando datos guardados en localStorage para autenticación inicial");
        
        // Establecer usuario con información local
        setUser({
          id: parseInt(localStorage.getItem('bibliotech-user-id') || '0'),
          username: savedUsername,
          email: savedEmail || '',
          role: savedRole,
          numcontrol: savedNumControl || '',
          createdAt: new Date().toISOString(),
          token
        });
        
        // Ya podemos considerar que estamos "autenticados" con datos locales
        setLoading(false);
      } else {
        // Si no hay datos guardados, seguimos cargando hasta verificar con la API
        setLoading(true);
      }

      // En segundo plano, intentar actualizar la información desde la API
      // pero sin bloquear la interfaz
      try {
        // Intentar obtener el usuario actual
        const userData = await authService.getMe(token);
        
        if (userData) {
          // Actualizar el estado con datos frescos de la API
          setUser({
            ...userData,
            token
          });
        }
        // Si no hay datos pero tampoco hubo error, mantenemos los datos locales
      } catch (error: any) {
        console.error("Error al verificar autenticación:", error);
        
        // Para errores específicos de sesión, limpiar la sesión
        if (error.message === 'Sesión expirada') {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('bibliotech-token');
          }
          setUser(null);
        }
        // Para otros errores, mantenemos los datos locales que ya establecimos
      } finally {
        // Asegurar que siempre se marca como no cargando al finalizar
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Iniciando proceso de login...");
      setLoading(true);
      setError(null);
      const response = await authService.login(email, password);
      console.log("Login exitoso, respuesta:", response);
      setUser({
        ...response.user,
        token: response.jwt
      });
      console.log("Usuario establecido en el contexto:", response.user);
      console.log("Redirigiendo a dashboard...");
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error detallado en login:', error);
      const errorMessage = error.message || 'Error al iniciar sesión';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: { username: string; email: string; password: string; numcontrol?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(userData);
      setUser({
        ...response.user,
        token: response.jwt
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error en registro:', error);
      setError('Error al registrar usuario. Por favor, intenta nuevamente.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
    router.push('/auth/login');
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      logout, 
      clearError,
      isAuthenticated,
      isAdmin,
      hasRole,
      checkPermission 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
} 