"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { Book, Menu, LogIn, Sun, Moon, User, LogOut, BarChart3, Home, Users, BookOpen } from 'lucide-react';
import { useUser } from '@/context/user-context';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, logout, loading: userLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [navbarReady, setNavbarReady] = useState(false);

  // Esperar a que se resuelva el estado del usuario
  useEffect(() => {
    if (!userLoading) {
      setIsLoading(false);
    }
  }, [userLoading]);

  // Esperar a que el componente se monte en el cliente para evitar hidratación incorrecta
  useEffect(() => {
    setNavbarReady(true);
  }, []);

  // Añadir log para depuración del rol de usuario
  useEffect(() => {
    if (user) {
      console.log("Rol de usuario en Navbar:", user.role);
    }
  }, [user]);

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, hideForRoles: ['alumno', 'authenticated'] },
    { name: 'Catálogo', href: '/catalogo', icon: BookOpen },
    { name: 'Préstamos', href: '/prestamos', icon: Book, hideForRoles: ['alumno', 'authenticated'] },
    { name: 'Usuarios', href: '/usuarios', icon: Users, hideForRoles: ['alumno', 'authenticated'] },
  ];

  const checkRolePermission = (requiredRole: string[] | string, userRole?: string) => {
    if (!userRole) return false;
    
    const userRoleLower = userRole.toLowerCase();
    console.log(`Verificando permisos - Rol requerido: ${JSON.stringify(requiredRole)}, Rol de usuario: ${userRoleLower}`);
    
    // Si el usuario es administrador, siempre tiene acceso a todo
    if (userRoleLower === 'administrador' || userRoleLower === 'admin') {
      return true;
    }
    
    let result = false;
    if (Array.isArray(requiredRole)) {
      result = requiredRole.some(role => userRoleLower.includes(role.toLowerCase()));
    } else {
      result = userRoleLower.includes(requiredRole.toLowerCase());
    }
    
    console.log(`Resultado de verificación: ${result}`);
    return result;
  };

  // Mostrar un navbar simplificado mientras se carga o antes de la hidratación
  if (isLoading || !navbarReady) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center md:ml-0">
            <Link href="/" className="flex items-center gap-2 mr-6">
              <Book className="hidden md:block h-6 w-6" />
              <span className="font-bold text-xl">BiblioTech</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  // Verificar si el usuario es administrador
  const isAdmin = user && (user.role.toLowerCase() === 'administrador' || user.role.toLowerCase() === 'admin');
  console.log("¿Es administrador?", isAdmin);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile menu trigger - now on the left */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <Link href="/" className="flex items-center gap-2 mb-8">
                <span className="font-bold text-xl">BiblioTech</span>
              </Link>
              <nav className="flex flex-col gap-4">
                {menuItems.map((item) => {
                  // Los administradores pueden ver todos los elementos del menú
                  if (isAdmin) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2",
                          "border-l-2 border-transparent hover:border-primary pl-2"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  }
                  
                  // Para otros roles, aplicar las reglas normales
                  // Verificar si el elemento es solo para ciertos roles
                  if (item.allowOnlyRoles && (!user || !item.allowOnlyRoles.some(role => checkRolePermission(role, user.role)))) {
                    return null;
                  }
                  
                  // Verificar si el elemento está oculto para el rol del usuario
                  if (item.hideForRoles && user && item.hideForRoles.some(role => checkRolePermission(role, user.role))) {
                    return null;
                  }
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2",
                        "border-l-2 border-transparent hover:border-primary pl-2"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo - center on mobile, left on desktop */}
        <div className="flex items-center md:ml-0">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <Book className="hidden md:block h-6 w-6" />
            <span className="font-bold text-xl">BiblioTech</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {menuItems.map((item) => {
              // Los administradores pueden ver todos los elementos del menú
              if (isAdmin) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              }
              
              // Para otros roles, aplicar las reglas normales
              // Verificar si el elemento es solo para ciertos roles
              if (item.allowOnlyRoles && (!user || !item.allowOnlyRoles.some(role => checkRolePermission(role, user.role)))) {
                return null;
              }
              
              // Verificar si el elemento está oculto para el rol del usuario
              if (item.hideForRoles && user && item.hideForRoles.some(role => checkRolePermission(role, user.role))) {
                return null;
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Theme toggle and user menu */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {user.role === 'authenticated' ? 'Alumno' : user.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="cursor-pointer w-full flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login" className="flex items-center gap-1">
                <LogIn className="h-4 w-4 mr-1" />
                Iniciar Sesión
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}