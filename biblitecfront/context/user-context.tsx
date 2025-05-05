"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/services/userService';

// User types
export type UserRole = 'admin' | 'librarian' | 'member' | 'authenticated' | 'alumno' | 'interno' | 'administrador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

// Definir tipo para libro
export interface Book {
  id_libro: string | number;
  unidad: number;
  titulo: string;
  autor: string;
  clasificacion: string;
  
  // Campos opcionales para mantener compatibilidad
  id?: string | number;
  documentId?: string;
  title?: string;
  author?: string;
  description?: string;
  coverImage?: string;
  publishYear?: number;
  genre?: string;
  location?: string;
  copies?: number;
  avaliableCopies?: number;
  ISBN?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

// Context type
interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  register: (userData: { name: string; email: string; password: string; role?: string; }) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Check if user is logged in on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('bibliotech-user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Si el rol es 'authenticated', cambiarlo a 'alumno'
        if (parsedUser.role === 'authenticated') {
          console.log("Usuario con rol 'authenticated' detectado, cambiando a 'alumno'");
          parsedUser.role = 'alumno';
          
          // Actualizar localStorage con el rol correcto
          localStorage.setItem('bibliotech-user', JSON.stringify(parsedUser));
          localStorage.setItem('bibliotech-role', 'alumno');
        }
        
        // Verificar si el usuario es Jocelin y forzar rol de administrador
        if (parsedUser.name && 
           (parsedUser.name.toLowerCase() === 'jocelin' || 
            parsedUser.name.toLowerCase() === 'jocelinguapa' || 
            parsedUser.email.toLowerCase().includes('jocelin'))) {
          
          console.log("Usuario 'Jocelin' detectado en carga inicial, forzando rol de administrador");
          parsedUser.role = 'administrador';
          
          // Actualizar localStorage con el rol correcto
          localStorage.setItem('bibliotech-user', JSON.stringify(parsedUser));
          localStorage.setItem('bibliotech-role', 'administrador');
        }
        
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('bibliotech-user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Autenticar con la API de Strapi
      const response = await userService.login(email, password);
      
      if (!response.user || !response.jwt) {
        throw new Error('Credenciales inválidas');
      }
      
      // Obtener el rol del usuario - priorizar el rol guardado en localStorage
      let userRole: UserRole = 'authenticated';
      let originalRole = '';
      
      console.log("Respuesta completa:", JSON.stringify(response, null, 2));
      
      // Primero intentar obtener el rol de la respuesta de la API
      if (response.user.role) {
        if (typeof response.user.role === 'string') {
          userRole = response.user.role as UserRole;
          originalRole = response.user.role;
        } else if (typeof response.user.role === 'object') {
          if ('type' in response.user.role) {
            userRole = response.user.role.type as UserRole;
            originalRole = response.user.role.type;
          } else if ('name' in response.user.role) {
            userRole = response.user.role.name.toLowerCase() as UserRole;
            originalRole = response.user.role.name;
          }
        }
      }
      
      // Verificar el rol explícitamente con el backend
      try {
        const API_URL = "http://localhost:1337";
        const userDetailsResponse = await fetch(`${API_URL}/api/users/${response.user.id}?populate=role`, {
          headers: {
            'Authorization': `Bearer ${response.jwt}`
          }
        });
        
        if (userDetailsResponse.ok) {
          const userData = await userDetailsResponse.json();
          console.log("Datos del usuario desde API:", userData);
          
          if (userData.role?.name) {
            userRole = userData.role.name.toLowerCase() as UserRole;
            originalRole = userData.role.name;
            console.log(`Rol obtenido desde API: ${userRole}`);
          }
        }
      } catch (error) {
        console.error("Error al obtener detalles de usuario:", error);
      }
      
      // Forzar el rol si el usuario tiene un numcontrol (suponemos que es alumno)
      if (response.user.numcontrol) {
        userRole = 'alumno';
        originalRole = 'Alumno';
        console.log("Usuario con numcontrol, asignando rol 'alumno'");
      }
      
      // Si el rol es 'authenticated', cambiarlo a 'alumno' por defecto
      if (userRole === 'authenticated') {
        userRole = 'alumno';
        originalRole = 'Alumno';
        console.log("Usuario con rol 'authenticated', cambiando a 'alumno'");
      }
      
      // Forzar el rol de administrador para usuarios específicos (para desarrollo/depuración)
      if (response.user.username && 
         (response.user.username.toLowerCase() === 'jocelin' || 
          response.user.username.toLowerCase() === 'jocelinguapa' || 
          response.user.email.toLowerCase().includes('jocelin'))) {
        userRole = 'administrador';
        originalRole = 'Administrador';
        console.log("Usuario 'Jocelin' detectado, forzando rol de administrador");
      }
      
      console.log(`Rol final asignado al usuario: ${userRole}`);
      
      // Obtener datos del usuario y convertir al formato esperado
      const userData: User = {
        id: response.user.id,
        name: response.user.username,
        email: response.user.email,
        role: userRole,
        createdAt: response.user.createdAt
      };
      
      // Set user in state and localStorage
      setUser(userData);
      localStorage.setItem('bibliotech-user', JSON.stringify(userData));
      localStorage.setItem('bibliotech-token', response.jwt);
      localStorage.setItem('bibliotech-role', userRole);
      
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${userData.name}`,
      });
      
      // Redirect to dashboard or catalog based on role
      if (userRole === 'alumno') {
        router.push('/catalogo');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Error de login:", error);
      toast({
        title: "Error de inicio de sesión",
        description: error instanceof Error ? error.message : "Ocurrió un error al iniciar sesión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bibliotech-user');
    localStorage.removeItem('bibliotech-token');
    router.push('/');
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
  };

  const register = async (userData: { name: string; email: string; password: string; role?: string; }) => {
    setLoading(true);
    
    try {
      // Registrar en el sistema de usuarios nativo de Strapi
      const response = await userService.register({
        username: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role
      });
      
      if (!response.user || !response.jwt) {
        throw new Error('Error al registrarse');
      }
      
      // Obtener el rol del usuario - similar a login
      let userRole: UserRole = 'authenticated';
      
      // Primero intentar obtener el rol de la respuesta de la API
      if (response.user.role) {
        if (typeof response.user.role === 'string') {
          userRole = response.user.role as UserRole;
        } else if (response.user.role.type) {
          userRole = response.user.role.type as UserRole;
        } else if (response.user.role.name) {
          userRole = response.user.role.name.toLowerCase() as UserRole;
        }
      }
      
      // Verificar si se especificó un rol en el registro
      if (userData.role && userData.role !== 'authenticated') {
        userRole = userData.role as UserRole;
      }
      
      // Verificar el localStorage por si acaso
      const storedRole = localStorage.getItem('bibliotech-role');
      if (storedRole && storedRole !== 'authenticated') {
        console.log(`Usando rol desde localStorage para registro: ${storedRole}`);
        userRole = storedRole as UserRole;
      }
      
      console.log(`Rol final asignado al usuario registrado: ${userRole}`);
      
      // Convertir respuesta a nuestro formato de usuario
      const newUser: User = {
        id: response.user.id,
        name: response.user.username,
        email: response.user.email,
        role: userRole,
        createdAt: response.user.createdAt
      };
      
      setUser(newUser);
      localStorage.setItem('bibliotech-user', JSON.stringify(newUser));
      localStorage.setItem('bibliotech-token', response.jwt);
      
      toast({
        title: "Registro exitoso",
        description: `Bienvenido, ${newUser.name}`,
      });
      
      // Redirect based on role
      if (userRole === 'alumno') {
        router.push('/catalogo');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Error de registro:", error);
      toast({
        title: "Error de registro",
        description: error instanceof Error ? error.message : "Ocurrió un error al registrarse",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout, loading, register }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}