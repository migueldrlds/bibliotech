"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserCog, Mail, Calendar, Shield, User, UserMinus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { userService } from '@/services/userService';
import { User as UserType } from '@/types';

export default function DetalleUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user, loading } = useUser();
  const userId = params.id as string;
  
  const [userData, setUserData] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast({
          title: "Acceso denegado",
          description: "Debe iniciar sesión para acceder a esta página",
          variant: "destructive",
        });
        router.push('/login');
      } else {
        fetchUser();
      }
    }
  }, [user, loading, router, toast, userId]);
  
  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const fetchedUser = await userService.getUser(userId);
      
      // Mapear el usuario al formato esperado por la aplicación
      setUserData({
        id: fetchedUser.id.toString(),
        name: fetchedUser.username || 'Sin nombre',
        email: fetchedUser.email || 'Sin email',
        role: fetchedUser.role?.name?.toLowerCase() || 'authenticated',
        createdAt: fetchedUser.createdAt || new Date().toISOString()
      });
    } catch (error) {
      console.error("Error al cargar usuario:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del usuario",
        variant: "destructive",
      });
      router.push('/usuarios');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!userData) return;
    
    setIsDeleting(true);
    
    try {
      await userService.deleteUser(userData.id);
      
      toast({
        title: "Usuario eliminado",
        description: `El usuario ${userData.name} ha sido eliminado correctamente.`,
      });
      
      router.push('/usuarios');
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      });
      setDialogOpen(false);
    } finally {
      setIsDeleting(false);
      setDialogOpen(false);
    }
  };
  
  if (loading || !user || isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }
  
  if (!userData) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Usuario no encontrado</h1>
          <Button variant="outline" asChild>
            <Link href="/usuarios" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Usuario no encontrado</h2>
              <p className="text-muted-foreground mb-6">El usuario que buscas no existe o ha sido eliminado</p>
              <Button asChild>
                <Link href="/usuarios">Ver todos los usuarios</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{userData.name}</h1>
          <div className="mt-2">
            <RoleBadge role={userData.role} />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/usuarios" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
          
          <Button asChild>
            <Link href={`/usuarios/${userData.id}/editar`} className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Editar
            </Link>
          </Button>
          
          <Button variant="destructive" onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
            <UserMinus className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Detalles del usuario registrado</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-4 border-b">
                <dt className="flex items-center gap-2 font-medium text-muted-foreground sm:w-1/3">
                  <User className="h-4 w-4" />
                  Nombre completo
                </dt>
                <dd className="sm:w-2/3 font-medium">{userData.name}</dd>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-4 border-b">
                <dt className="flex items-center gap-2 font-medium text-muted-foreground sm:w-1/3">
                  <Mail className="h-4 w-4" />
                  Correo electrónico
                </dt>
                <dd className="sm:w-2/3">{userData.email}</dd>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-4 border-b">
                <dt className="flex items-center gap-2 font-medium text-muted-foreground sm:w-1/3">
                  <Shield className="h-4 w-4" />
                  Rol
                </dt>
                <dd className="sm:w-2/3">
                  <RoleBadge role={userData.role} />
                </dd>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <dt className="flex items-center gap-2 font-medium text-muted-foreground sm:w-1/3">
                  <Calendar className="h-4 w-4" />
                  Fecha de registro
                </dt>
                <dd className="sm:w-2/3">
                  {format(new Date(userData.createdAt), 'dd/MM/yyyy HH:mm')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <div className="flex justify-between mt-4">
          <Button 
            variant="outline" 
            asChild
          >
            <Link href={`/prestamos?userId=${userData.id}`} className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Ver préstamos
            </Link>
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={() => setDialogOpen(true)}
            className="gap-2"
          >
            <UserMinus className="h-4 w-4" />
            Eliminar usuario
          </Button>
        </div>
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar al usuario{" "}
              <span className="font-medium">{userData.name}</span>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin' || role.includes('admin')) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
        Administrador
      </Badge>
    );
  } else if (role === 'authenticated' || role.includes('auth')) {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
        Usuario
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
        Miembro
      </Badge>
    );
  }
} 