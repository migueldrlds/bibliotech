"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MoreHorizontal, 
  User, 
  Trash2, 
  Mail,
  GraduationCap,
  Calendar,
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { userService, User as UserType } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";

// Interfaz para la UI de usuario con datos adicionales
interface UIUser extends UserType {
  fullName: string;
  career?: string;
  gender?: string;
  status: string;
  Estado?: string; // Campo Estado de la API
  stats: {
    totalLoans: number;
    activeLoans: number;
    overdueLoans: number;
    lastActivity: string;
  };
}

export default function UsuariosPage() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UIUser | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [users, setUsers] = useState<UIUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await userService.getUsers();
        
        // Log para depuración
        console.log("Datos de usuarios recibidos:", response);
        
        // Transformar los datos de la API al formato esperado por la UI
        const transformedUsers: UIUser[] = response.map((user: any) => {
          // Determinar estado basado en el campo Estado de la API, o blocked y confirmed como fallback
          let status = "activo";
          
          // Usar el campo Estado de la API si existe
          if (user.Estado) {
            // Normalizar a minúsculas para consistencia
            status = user.Estado.toLowerCase();
            console.log(`Usuario ${user.username} tiene Estado: ${user.Estado} -> status: ${status}`);
          } else if (user.blocked) {
            status = "inactivo";
            console.log(`Usuario ${user.username} está bloqueado -> status: ${status}`);
          } else if (!user.confirmed) {
            status = "pendiente";
            console.log(`Usuario ${user.username} no está confirmado -> status: ${status}`);
          } else {
            console.log(`Usuario ${user.username} no tiene Estado, está usando valor predeterminado: ${status}`);
          }
          
          return {
            ...user,
            fullName: user.username || 'Sin nombre',
            status,
            Estado: user.Estado, // Mantener el campo original
            // Datos ficticios para mantener consistencia con el diseño original
            career: user.Carrera || (user.role === 'alumno' ? "Ingeniería en Sistemas Computacionales" : undefined),
            gender: user.Genero?.toLowerCase() || (Math.random() > 0.5 ? "masculino" : "femenino"),
            stats: {
              totalLoans: Math.floor(Math.random() * 15),
              activeLoans: Math.floor(Math.random() * 3),
              overdueLoans: Math.floor(Math.random() * 2),
              lastActivity: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            }
          };
        });
        
        setUsers(transformedUsers);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [toast]);

  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.numcontrol && user.numcontrol.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "todos" || user.role === roleFilter;
    const matchesStatus = statusFilter === "todos" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      alumno: "bg-emerald-500 hover:bg-emerald-600",
      administrador: "bg-rose-500 hover:bg-rose-600",
      interno: "bg-blue-500 hover:bg-blue-600",
      authenticated: "bg-gray-500 hover:bg-gray-600",
    };

    const labels: Record<string, string> = {
      alumno: "Alumno",
      administrador: "Administrador",
      interno: "Interno",
      authenticated: "Usuario",
    };

    const roleKey = role in styles ? role : "authenticated";

    return (
      <Badge className={styles[roleKey]}>
        {labels[roleKey]}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "activo":
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          Activo
        </Badge>
      );
      case "pendiente":
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-600">
          Pendiente
        </Badge>
      );
      case "inactivo":
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-600">
          Inactivo
        </Badge>
      );
      case "baja":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            Baja
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
          </Badge>
        );
    }
  };

  const handleDeleteUser = () => {
    // Here would go the logic to delete the user
    setShowDeleteDialog(false);
    setSelectedUser(null);
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "dd MMM yyyy", { locale: es });
    } catch (e) {
      return date;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Usuarios</h2>
            <p className="text-muted-foreground">
              Cargando usuarios...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Usuarios</h2>
          <p className="text-muted-foreground">
            Gestiona los usuarios registrados en el sistema
          </p>
        </div>

        <Tabs value={roleFilter} onValueChange={setRoleFilter} className="w-auto">
          <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="todos" className="rounded-md px-3 py-1 text-sm font-medium">
              Todos
            </TabsTrigger>
            <TabsTrigger value="alumno" className="rounded-md px-3 py-1 text-sm font-medium">
              Alumnos
            </TabsTrigger>
            <TabsTrigger value="interno" className="rounded-md px-3 py-1 text-sm font-medium">
              Internos
            </TabsTrigger>
            <TabsTrigger value="administrador" className="rounded-md px-3 py-1 text-sm font-medium">
              Administradores
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-auto mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, ID o correo..."
            className="pl-9 w-full min-w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo electrónico</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de registro</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.numcontrol || user.id}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {selectedUser && (
          <>
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Detalles del usuario</DialogTitle>
                  <DialogDescription>
                    Información completa del usuario seleccionado
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">{selectedUser.fullName}</h3>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(selectedUser.role)}
                      {getStatusBadge(selectedUser.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">ID/Número de control</p>
                      <p className="font-medium">{selectedUser.numcontrol || selectedUser.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de registro</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Correo electrónico</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                  </div>

                  {selectedUser.career && (
                    <div>
                      <p className="text-sm text-muted-foreground">Carrera</p>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{selectedUser.career}</p>
                      </div>
                    </div>
                  )}

                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="font-medium mb-3">Actividad del usuario</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Préstamos totales</p>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                          <p className="font-medium">{selectedUser.stats.totalLoans}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Préstamos activos</p>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-emerald-500" />
                          <p className="font-medium">{selectedUser.stats.activeLoans}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Préstamos atrasados</p>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <p className="font-medium">{selectedUser.stats.overdueLoans}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Última actividad</p>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{formatDate(selectedUser.stats.lastActivity)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente
                    la cuenta de usuario y todos los datos asociados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="bg-muted p-3 rounded-md text-sm">
                  <div className="font-medium">{selectedUser.fullName}</div>
                  <div className="text-muted-foreground">{selectedUser.email}</div>
                  <div className="text-muted-foreground">ID: {selectedUser.numcontrol || selectedUser.id}</div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDeleteUser}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}