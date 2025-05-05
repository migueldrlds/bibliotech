"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Filter, MoreHorizontal, Search, Shield, User, UserPlus, UserCheck, UserMinus, UserCog, Mail, Calendar, Save, ArrowLeft } from 'lucide-react';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { User as UserType } from '@/types';
import { userService } from '@/services/userService';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export default function UsuariosPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  // Estados para la lista de usuarios
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  // Estados para los modales
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  
  // Estados para el formulario de creación/edición
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    numcontrol: '',
    password: '',
    confirmPassword: '',
    role: 'alumno'
  });
  
  // Estados para manejo de operaciones
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast({
          title: "Acceso denegado",
          description: "Debe iniciar sesión para acceder a esta página",
          variant: "destructive",
        });
        router.push('/login');
      } else if (user.role.toLowerCase() === 'alumno') {
        toast({
          title: "Acceso restringido",
          description: "No tienes permisos para acceder a la gestión de usuarios",
          variant: "destructive",
        });
        router.push('/catalogo');
      } else {
        // Cargar usuarios desde la API
        fetchUsers();
      }
    }
  }, [user, loading, router, toast]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const fetchedUsers = await userService.getUsers();
      console.log("Usuarios obtenidos (raw):", fetchedUsers);
      
      // Mapear los usuarios al formato esperado por la aplicación
      const mappedUsers = Array.isArray(fetchedUsers) ? fetchedUsers.map((u: any) => {
        // Obtener el rol correcto
        let userRole = 'authenticated';
        if (u.role) {
          // Si tenemos un objeto role con name o type, usar ese valor
          if (u.role.name) {
            userRole = u.role.name.toLowerCase();
          } else if (u.role.type) {
            userRole = u.role.type.toLowerCase();
          }
        }
        
        return {
          id: u.id?.toString() || 'unknown',
          username: u.username || 'Sin nombre',
          name: u.username || 'Sin nombre',
          email: u.email || 'Sin email',
          numcontrol: u.numcontrol?.toString() || '',
          role: userRole,
          createdAt: u.createdAt || new Date().toISOString()
        };
      }) : [];

      console.log("Usuarios mapeados:", mappedUsers);
      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
      setUsers([]); // Asegurarnos de que users sea un array vacío en caso de error
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Filter users based on search and role filter
  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchTerm || 
                         u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (u.numcontrol && u.numcontrol.toString().toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || 
                        !roleFilter || 
                        (u.role && u.role.includes(roleFilter));
    
    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    console.log("Filtered users:", filteredUsers);
  }, [filteredUsers]);

  // Manejadores para formularios
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | { name: string; value: string }
  ) => {
    const { name, value } = 'target' in e ? e.target : e;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpiar error del campo al cambiar su valor
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }
    
    // Solo validar contraseña en creación o cuando se está cambiando
    if (!selectedUser || formData.password) {
      if (!selectedUser && !formData.password) {
        newErrors.password = "La contraseña es obligatoria";
      } else if (formData.password && formData.password.length < 8) {
        newErrors.password = "La contraseña debe tener al menos 8 caracteres";
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Abrir modal para crear usuario
  const openCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      numcontrol: '',
      password: '',
      confirmPassword: '',
      role: 'alumno',
    });
    setErrors({});
    setSelectedUser(null);
    setCreateModalOpen(true);
  };

  // Abrir modal para ver detalles de usuario
  const openViewModal = (userData: UserType) => {
    setSelectedUser(userData);
    setViewModalOpen(true);
  };

  // Abrir modal para editar usuario
  const openEditModal = (userData: UserType) => {
    setSelectedUser(userData);
    setFormData({
      name: userData.name,
      email: userData.email,
      numcontrol: userData.numcontrol || '',
      password: '',
      confirmPassword: '',
      role: userData.role,
    });
    setErrors({});
    setEditModalOpen(true);
  };

  // Abrir modal para eliminar usuario
  const openDeleteModal = (userData: UserType) => {
    setSelectedUser(userData);
    setDeleteModalOpen(true);
  };

  // Crear un nuevo usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await userService.register({
        username: formData.name,
        email: formData.email,
        password: formData.password,
        numcontrol: formData.numcontrol,
        role: formData.role
      });
      
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente",
      });
      
      setCreateModalOpen(false);
      fetchUsers(); // Recargar lista de usuarios
    } catch (error: any) {
      console.error("Error al crear usuario:", error);
      
      // Mensajes de error más descriptivos
      let errorMessage = "No se pudo crear el usuario.";
      
      if (error.message) {
        if (error.message.includes('email') || error.message.includes('correo')) {
          errorMessage = "El correo electrónico ya está registrado.";
        } else if (error.message.includes('contraseña') || error.message.includes('password')) {
          errorMessage = "La contraseña no cumple con los requisitos mínimos (mínimo 8 caracteres).";
        } else if (error.message.includes('validación')) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actualizar un usuario existente
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !validate()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updateData: Record<string, any> = {
        username: formData.name,
        email: formData.email,
        numcontrol: formData.numcontrol
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      await userService.updateUser(selectedUser.id, updateData);
      
      toast({
        title: "Usuario actualizado",
        description: "La información del usuario ha sido actualizada exitosamente",
      });
      
      setEditModalOpen(false);
      fetchUsers(); // Recargar lista de usuarios
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del usuario",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar un usuario
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    
    try {
      await userService.deleteUser(selectedUser.id);
      
      toast({
        title: "Usuario eliminado",
        description: `El usuario ${selectedUser.name} ha sido eliminado correctamente.`,
      });
      
      setDeleteModalOpen(false);
      fetchUsers(); // Recargar lista de usuarios
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setSelectedUser(null);
    }
  };
  
  if (loading || !user) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administre los usuarios del sistema
          </p>
        </div>
        
        <Button onClick={openCreateModal} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo Usuario
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={roleFilter}
              onValueChange={setRoleFilter}
            >
              <SelectTrigger className="sm:w-[180px] w-full">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
                <SelectItem value="interno">Interno</SelectItem>
                <SelectItem value="alumno">Alumno</SelectItem>
                <SelectItem value="authenticated">Usuario</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(searchTerm || roleFilter !== 'all') && (
            <div className="flex items-center gap-2 mb-6">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground mr-2">Filtros activos:</span>
              
              {searchTerm && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Búsqueda: {searchTerm}
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:text-destructive"
                  >
                    &times;
                  </button>
                </Badge>
              )}
              
              {roleFilter && roleFilter !== 'all' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Rol: {
                    roleFilter === 'administrador' ? 'Administrador' : 
                    roleFilter === 'interno' ? 'Interno' : 
                    roleFilter === 'alumno' ? 'Alumno' : 
                    roleFilter === 'authenticated' ? 'Usuario' : 
                    roleFilter
                  }
                  <button 
                    onClick={() => setRoleFilter('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    &times;
                  </button>
                </Badge>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                }}
                className="ml-auto text-sm"
              >
                Limpiar filtros
              </Button>
            </div>
          )}

          {isLoadingUsers ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No se encontraron usuarios</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Intente ajustar sus criterios de búsqueda o filtros
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                }}
              >
                Mostrar todos los usuarios
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Num. Control</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha de registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} onClick={() => openViewModal(user)} className="cursor-pointer hover:bg-muted">
                      <TableCell className="font-medium">{user.numcontrol || 'N/A'}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                openViewModal(user);
                              }}
                            >
                              <User className="mr-2 h-4 w-4" />
                              <span>Ver detalles</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                openEditModal(user);
                              }}
                            >
                              <UserCog className="mr-2 h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                openDeleteModal(user);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para crear usuario */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crear un nuevo usuario en el sistema
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateUser} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ingrese el nombre completo"
                  value={formData.name}
                  onChange={(e) => handleChange(e)}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-destructive text-sm">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numcontrol">
                  Num. Control
                </Label>
                <Input
                  id="numcontrol"
                  name="numcontrol"
                  value={formData.numcontrol}
                  onChange={(e) => handleChange(e)}
                  className="col-span-3"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={(e) => handleChange(e)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-destructive text-sm">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">
                  Contraseña <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange(e)}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-destructive text-sm">{errors.password}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmar Contraseña <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange(e)}
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-destructive text-sm">{errors.confirmPassword}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">
                  Rol <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleChange({ name: 'role', value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alumno">Alumno</SelectItem>
                    <SelectItem value="interno">Interno</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para ver detalles de usuario */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detalles del Usuario
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                <RoleBadge role={selectedUser.role} />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Num. Control</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.numcontrol || 'No asignado'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Correo electrónico</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                
                  <div className="flex items-start gap-2">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Rol</p>
                      <RoleBadge role={selectedUser.role} />
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Fecha de registro</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedUser.createdAt), 'PPP', { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setViewModalOpen(false)}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setViewModalOpen(false);
                    openEditModal(selectedUser);
                  }}
                  className="gap-2"
                >
                  <UserCog className="h-4 w-4" />
                  Editar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para editar usuario */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Editar Usuario
            </DialogTitle>
            <DialogDescription>
              Modificar información del usuario
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">
                    Nombre Completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    placeholder="Ingrese el nombre completo"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm">{errors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-numcontrol">
                    Num. Control
                  </Label>
                  <Input
                    id="edit-numcontrol"
                    name="numcontrol"
                    value={formData.numcontrol}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-password">
                    Nueva Contraseña <span className="text-muted-foreground text-sm">(opcional)</span>
                  </Label>
                  <Input
                    id="edit-password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? "border-destructive" : ""}
                    placeholder="Dejar en blanco para mantener la actual"
                  />
                  {errors.password && (
                    <p className="text-destructive text-sm">{errors.password}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-confirmPassword">
                    Confirmar Nueva Contraseña
                  </Label>
                  <Input
                    id="edit-confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                    disabled={!formData.password}
                  />
                  {errors.confirmPassword && (
                    <p className="text-destructive text-sm">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  )}
                  <Save className="h-4 w-4" />
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para eliminar usuario */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar al usuario{" "}
              <span className="font-medium">{selectedUser?.name}</span>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting && (
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
  const roleLower = role.toLowerCase();
  
  if (roleLower === 'administrador' || roleLower.includes('admin')) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
        Administrador
      </Badge>
    );
  } else if (roleLower === 'interno') {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
        Interno
      </Badge>
    );
  } else if (roleLower === 'alumno') {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
        Alumno
      </Badge>
    );
  } else if (roleLower === 'authenticated' || roleLower.includes('auth')) {
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800">
        Usuario
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
        {role || 'Sin rol'}
      </Badge>
    );
  }
}