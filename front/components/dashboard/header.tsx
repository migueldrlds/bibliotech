"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Library, LayoutDashboard, BookText, BookMarked, Users, BarChart3, LogOut, User, LogIn } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/user-context";
import { useEffect, useState } from "react";

// Definir un tipo para los elementos de navegación
type NavigationItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  hideForRoles?: string[];
  allowOnlyRoles?: string[];
  public?: boolean; // Elemento visible sin autenticación
};

const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, hideForRoles: ['alumno', 'authenticated'] },
  { href: "/catalogo", label: "Catálogo", icon: <BookText className="h-4 w-4" />, public: true },
  { href: "/prestamos", label: "Préstamos", icon: <BookMarked className="h-4 w-4" />, hideForRoles: ['alumno', 'authenticated'] },
  { href: "/usuarios", label: "Usuarios", icon: <Users className="h-4 w-4" />, hideForRoles: ['alumno', 'authenticated'] },
  { href: "/reportes", label: "Reportes", icon: <BarChart3 className="h-4 w-4" />, hideForRoles: ['alumno', 'authenticated'] },
];

// Componente para el menú simplificado (solo items públicos)
const PublicNavigation = ({ pathname }: { pathname: string }) => (
  <nav className="hidden md:flex space-x-2">
    {navigationItems
      .filter(item => item.public)
      .map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out",
            pathname === item.href
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
  </nav>
);

export function Header() {
  const pathname = usePathname();
  const { 
    user, 
    logout, 
    loading,
    isAuthenticated,
    isAdmin,
    checkPermission
  } = useUser();
  const [navbarReady, setNavbarReady] = useState(false);
  const [localAuthState, setLocalAuthState] = useState<{
    isAuthenticated: boolean;
    username?: string;
    email?: string;
    role?: string;
  }>({
    isAuthenticated: false
  });
  
  // Verificar localStorage inmediatamente al montar el componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('bibliotech-token');
      const savedRole = localStorage.getItem('bibliotech-role');
      const savedUsername = localStorage.getItem('bibliotech-username');
      const savedEmail = localStorage.getItem('bibliotech-email');
      
      // Si hay token y al menos un rol, consideramos que hay autenticación local
      setLocalAuthState({
        isAuthenticated: !!token && !!savedRole,
        username: savedUsername || undefined,
        email: savedEmail || undefined,
        role: savedRole || undefined
      });
    }
    
    setNavbarReady(true);
  }, []);

  // Determinar estado de autenticación considerando información local y del contexto
  const effectiveIsAuthenticated = isAuthenticated || localAuthState.isAuthenticated;
  
  // Si el componente no está listo para renderizar
  if (!navbarReady) {
    // En lugar de no renderizar nada, mostrar un header mínimo con indicador de carga
    return (
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-10">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center space-x-2">
                <Library className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-semibold">BiblioTeK</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="h-8 w-8 flex items-center justify-center">
                <div className="h-4 w-4 border-2 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Renderizado base del header
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-10">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={effectiveIsAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <Library className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-semibold">BiblioTeK</span>
            </Link>

            {/* Mostrar navegación basada en estado de autenticación efectivo */}
            {!effectiveIsAuthenticated ? (
              <PublicNavigation pathname={pathname} />
            ) : (
              <nav className="hidden md:flex space-x-2">
                {navigationItems.map((item) => {
                  // Solo mostrar el elemento si el usuario tiene permisos
                  // Usar isAdmin del contexto o verificar el rol local 
                  const localIsAdmin = localAuthState.role?.toLowerCase() === 'administrador' || 
                                      localAuthState.role?.toLowerCase() === 'admin';
                  const hasPermission = isAdmin || localIsAdmin || 
                    (user?.role && !item.hideForRoles?.includes(user.role.toLowerCase()));
                  
                  if (!hasPermission) return null;
                  
                  // Si el item es público, mostrarlo siempre
                  if (item.public) return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out",
                        pathname === item.href
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                  
                  // Para items que requieren roles específicos
                  const localRole = localAuthState.role?.toLowerCase();
                  const userRole = user?.role?.toLowerCase();
                  const roleToCheck = userRole || localRole;
                  
                  // Ocultar para roles específicos
                  if (item.hideForRoles && roleToCheck && 
                      item.hideForRoles.includes(roleToCheck)) {
                    return null;
                  }
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out",
                        pathname === item.href
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {!effectiveIsAuthenticated ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span>Iniciar sesión</span>
                </Link>
              </Button>
            ) : loading && !user ? (
              // Mostrar indicador de carga solo si aún estamos cargando pero tenemos datos locales
              <Button variant="ghost" size="sm" disabled className="relative">
                <div className="h-4 w-4 border-2 border-t-transparent border-blue-600 rounded-full animate-spin absolute"></div>
                <span className="opacity-0">Cargando</span>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-sm font-medium">
                        {user?.username ? user.username.charAt(0).toUpperCase() : 
                         localAuthState.username ? localAuthState.username.charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.username || localAuthState.username || 'Usuario'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email || localAuthState.email || ''}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {(user?.role === 'authenticated' || localAuthState.role === 'authenticated') ? 'Alumno' : (user?.role || localAuthState.role || '')}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Link href="/perfil" className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}