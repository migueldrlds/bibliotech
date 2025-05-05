"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Book, 
  BookOpen, 
  Calendar, 
  ClockIcon, 
  FileSearch, 
  Filter, 
  Search, 
  UserRound, 
  Check, 
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';
import { loanService } from '@/services/loanService';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { Loan } from '@/types';
import { AddLoanModal } from './components/AddLoanModal';
import { LoanDetailModal } from './components/LoanDetailModal';
import { DeleteLoanModal } from './components/DeleteLoanModal';
import { MarkAsReturnedModal } from './components/MarkAsReturnedModal';

// Definir interfaz para los datos de préstamo del API
interface ApiLoanAttributes {
  fecha_prestamo: string;
  fecha_devolucion_esperada: string;
  fecha_devolucion_real: string | null;
  estado: string;
  notas: string | null;
  book?: {
    data: {
      id: string;
      attributes: {
        titulo: string;
        // otros campos del libro
      }
    } | null;
  };
  usuario?: {
    data: {
      id: string;
      attributes: {
        username: string;
        email: string;
        // otros campos del usuario
      }
    } | null;
  };
}

interface ApiLoan {
  id: string;
  attributes: ApiLoanAttributes;
}

// Adaptador para convertir datos del API a nuestro formato Loan
const adaptLoanFromAPI = (apiLoan: any): Loan => {
  console.log("Adaptando préstamo (raw):", JSON.stringify(apiLoan, null, 2));

  // Verificar formato de datos y ajustar las propiedades según sea necesario
  const attributes = apiLoan.attributes || apiLoan;
  
  // Estructura simplificada para manejar los datos tal como vienen de la API
  const loan: Loan = {
    id: apiLoan.id || '',
    documentId: apiLoan.documentId || attributes.documentId || null,
    userId: '',
    userName: 'Usuario no disponible',
    bookId: '',
    bookTitle: 'Libro no asignado',
    loanDate: attributes.fecha_prestamo || new Date().toISOString().split('T')[0],
    dueDate: attributes.fecha_devolucion_esperada || new Date().toISOString().split('T')[0],
    returnDate: attributes.fecha_devolucion_real || null,
    status: attributes.estado === 'devuelto' ? 'returned' : 'active',
    notes: attributes.notas || ''
  };

  // Extraer fechas si vienen en attributes
  if (attributes) {
    // Fechas ya extraídas en la inicialización
    
    // Guardar información adicional que pueda ser útil
    if (attributes.createdAt) {
      console.log(`Préstamo creado el: ${attributes.createdAt}`);
    }
  }

  // Manejar datos del usuario - formato con .data (formato API v4 Strapi)
  if (attributes && attributes.usuario && attributes.usuario.data) {
    const userData = attributes.usuario.data;
    loan.userId = userData.id || '';
    
    // Guardar documentId del usuario si está disponible
    if (userData.attributes && userData.attributes.documentId) {
      console.log(`Usuario documentId: ${userData.attributes.documentId}`);
    }
    
    const userAttrs = userData.attributes || userData;
    loan.userName = userAttrs.username || userAttrs.email || 'Usuario sin nombre';
    
    // Extraer numcontrol si existe
    if (userAttrs.numcontrol) {
      loan.userNumControl = userAttrs.numcontrol.toString();
      console.log(`Usuario numcontrol: ${loan.userNumControl}`);
    }
    
    console.log("Usuario encontrado (formato data):", loan.userName);
  } 
  // Manejar datos del usuario - formato directo
  else if (attributes.usuario || apiLoan.usuario) {
    const usuario = attributes.usuario || apiLoan.usuario;
    loan.userId = usuario.id || '';
    
    // Guardar documentId del usuario si está disponible
    if (usuario.documentId) {
      console.log(`Usuario documentId: ${usuario.documentId}`);
    }
    
    loan.userName = usuario.username || usuario.email || 'Usuario sin nombre';
    
    // Extraer numcontrol si existe
    if (usuario.numcontrol) {
      loan.userNumControl = usuario.numcontrol.toString();
      console.log(`Usuario numcontrol: ${loan.userNumControl}`);
    }
    
    console.log("Usuario encontrado (directo):", loan.userName);
  }
  
  // Manejar datos del libro - formato con .data (formato API v4 Strapi)
  if (attributes && attributes.book && attributes.book.data) {
    const bookData = attributes.book.data;
    loan.bookId = bookData.id || '';
    
    // Guardar documentId del libro si está disponible
    if (bookData.documentId) {
      console.log(`Libro documentId: ${bookData.documentId}`);
    } else if (bookData.attributes && bookData.attributes.documentId) {
      console.log(`Libro documentId (en attributes): ${bookData.attributes.documentId}`);
    }
    
    const bookAttrs = bookData.attributes || bookData;
    loan.bookTitle = bookAttrs.titulo || 'Título no disponible';
    console.log("Libro encontrado (formato data):", loan.bookTitle);
  } 
  // Manejar datos del libro - formato directo
  else if (attributes.book || apiLoan.book) {
    const book = attributes.book || apiLoan.book;
    
    if (!book) {
      console.log("El libro es null o no está disponible");
    } else {
      loan.bookId = book.id || '';
      
      // Guardar documentId del libro si está disponible
      if (book.documentId) {
        console.log(`Libro documentId: ${book.documentId}`);
      }
      
      if (book.titulo) {
        loan.bookTitle = book.titulo;
      } else if (book.attributes && book.attributes.titulo) {
        loan.bookTitle = book.attributes.titulo;
      }
      console.log("Libro encontrado (directo):", loan.bookTitle);
    }
  }

  // Determinar estado
  const determinedStatus = determineStatus(
    attributes.estado || apiLoan.estado || 'active',
    loan.dueDate,
    loan.returnDate
  );
  
  // Asegurarnos de que status sea uno de los valores permitidos
  if (determinedStatus === 'active' || determinedStatus === 'returned' || determinedStatus === 'overdue') {
    loan.status = determinedStatus;
  }

  console.log("Préstamo adaptado:", JSON.stringify(loan, null, 2));
  return loan;
};

// Determinar el estado del préstamo
const determineStatus = (apiStatus: string, dueDate: string, returnDate: string | null): string => {
  if (apiStatus === 'devuelto' || returnDate) return 'returned';
  
  // Comprobar si está atrasado
  const today = new Date();
  const due = new Date(dueDate);
  if (due < today) return 'overdue';
  
  return 'active';
};

export default function PrestamosPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Estado para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Verificar acceso
  useEffect(() => {
    console.log("Verificando acceso a préstamos, usuario:", user);
    console.log("Rol del usuario:", user?.role);
    
    if (!loading) {
      if (!user) {
        toast({
          title: "Acceso denegado",
          description: "Debe iniciar sesión para acceder a esta página",
          variant: "destructive",
        });
        router.push('/login');
        return;
      } 
      
      // Verificar explícitamente roles permitidos: solo administrador e interno pueden acceder
      const userRole = user.role?.toLowerCase() || '';
      console.log("Rol del usuario (lowercase):", userRole);
      
      // Lista de roles permitidos
      const allowedRoles = ['administrador', 'admin', 'interno'];
      const hasAccess = allowedRoles.some(role => userRole.includes(role));
      
      if (!hasAccess) {
        console.log("Usuario sin permisos detectado, redirigiendo...");
        toast({
          title: "Acceso restringido",
          description: "No tienes permisos para acceder a la gestión de préstamos",
          variant: "destructive",
        });
        router.push('/catalogo');
        return;
      }
      
      console.log("Acceso permitido para rol:", userRole);
    }
  }, [user, loading, router, toast]);

  // Cargar préstamos desde el API
  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      const response = await loanService.getLoans();
      console.log("Préstamos obtenidos:", response);
      
      let adaptedLoans: Loan[] = [];
      
      // Verificar si la respuesta tiene la estructura esperada
      if (Array.isArray(response)) {
        // La respuesta ya es un array
        adaptedLoans = response.map((loan: ApiLoan) => adaptLoanFromAPI(loan));
        console.log("Préstamos adaptados:", adaptedLoans);
      } else if (response && Array.isArray(response.data)) {
        // La respuesta tiene un campo data que es un array
        adaptedLoans = response.data.map((loan: ApiLoan) => adaptLoanFromAPI(loan));
        console.log("Préstamos adaptados desde response.data:", adaptedLoans);
      } else {
        console.error("Formato de respuesta no reconocido:", response);
        toast({
          title: "Error",
          description: "Formato de respuesta de préstamos no reconocido",
          variant: "destructive",
        });
      }
      
      setLoans(adaptedLoans);
    } catch (error) {
      console.error("Error al cargar préstamos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los préstamos",
        variant: "destructive",
      });
      setLoans([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLoans();
    }
  }, [user]);

  // Manejadores para los modales
  const handleOpenDetailModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsDetailModalOpen(true);
  };
  
  const handleOpenDeleteModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsDeleteModalOpen(true);
  };

  const handleOpenMarkAsReturnedModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsReturnModalOpen(true);
  };
  
  const handleLoanActionSuccess = () => {
    fetchLoans(); // Recargar la lista de préstamos después de una acción exitosa
  };

  // Filter loans based on user role, tab, search, and filters
  useEffect(() => {
    const filtered = loans.filter(loan => {
      // Console log para depuración
      console.log("Préstamo siendo filtrado:", {
        id: loan.id,
        usuario: {
          id: loan.userId,
          nombre: loan.userName
        },
        libro: loan.bookTitle,
        status: loan.status
      });
      
      // For non-admin and non-librarian users, only show their own loans
      if (user && user.role === 'member' && loan.userId !== user.id.toString()) {
        return false;
      }
      
      // Filter by tab (loan status)
      if (statusFilter !== 'all' && loan.status !== statusFilter) return false;
      
      // Filter by search term (book title, user name, or numcontrol)
      if (searchTerm && !loan.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !loan.userName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !(loan.userNumControl && loan.userNumControl.toString().includes(searchTerm))) {
        return false;
      }
      
      return true;
    });
    
    setFilteredLoans(filtered);
  }, [loans, searchTerm, statusFilter, user]);
  
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
          <h1 className="text-3xl font-bold">Préstamos</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === 'member' 
              ? 'Administre sus préstamos de libros' 
              : 'Administre los préstamos de la biblioteca'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/prestamos/consultas" className="flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              Consultas
            </Link>
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Book className="h-4 w-4 mr-2" />
            Nuevo Préstamo
          </Button>
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <TabsList>
            <TabsTrigger value="all">
              Todos
            </TabsTrigger>
            <TabsTrigger value="active">
              Activos
            </TabsTrigger>
            <TabsTrigger value="returned">
              Devueltos
            </TabsTrigger>
            <TabsTrigger value="overdue">
              Atrasados
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-4 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </div>
        
        {(searchTerm || statusFilter !== 'all') && (
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mr-2">Filtros activos:</span>
            
            {statusFilter && statusFilter !== 'all' && (
              <Badge variant="outline" className="flex items-center gap-1">
                Estado: {statusFilter === 'active' ? 'Activo' : statusFilter === 'returned' ? 'Devuelto' : 'Atrasado'}
                <button 
                  onClick={() => setStatusFilter('all')}
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
                setStatusFilter('all');
              }}
              className="text-xs ml-auto"
            >
              Limpiar filtros
            </Button>
          </div>
        )}
        
        <TabsContent value={statusFilter}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Lista de Préstamos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center p-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="ml-2 text-sm text-muted-foreground">Cargando préstamos...</p>
                </div>
              ) : filteredLoans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="text-xl font-semibold">No hay préstamos</h3>
                  <p className="text-muted-foreground text-center mt-1 mb-4">
                    {searchTerm || statusFilter !== 'all'
                      ? 'No se encontraron préstamos con los filtros actuales.' 
                      : 'No hay préstamos registrados en el sistema.'}
                  </p>
                  <Button onClick={() => setIsAddModalOpen(true)} className="mt-4">
                    Crear nuevo préstamo
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Libro</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Fecha Préstamo</TableHead>
                        <TableHead>Fecha Devolución</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLoans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">{loan.id}</TableCell>
                          <TableCell className="font-medium">{loan.bookTitle}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserRound className="h-4 w-4 text-muted-foreground" />
                              {loan.userName !== 'Usuario no disponible' 
                                ? loan.userName 
                                : <span className="text-muted-foreground italic">No disponible</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{format(new Date(loan.loanDate), 'dd MMM yyyy', { locale: es })}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                {format(new Date(loan.loanDate), 'HH:mm')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {loan.returnDate ? (
                              <div className="flex flex-col">
                                <span>{format(new Date(loan.returnDate), 'dd MMM yyyy', { locale: es })}</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <ClockIcon className="h-3 w-3" />
                                  {format(new Date(loan.returnDate), 'HH:mm')}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span>{format(new Date(loan.dueDate), 'dd MMM yyyy', { locale: es })}</span>
                                <span className="text-xs text-muted-foreground">Fecha límite</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={loan.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Acciones</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleOpenDetailModal(loan)} className="cursor-pointer">
                                  <Book className="h-4 w-4 mr-2" />
                                  Ver detalles
                                </DropdownMenuItem>
                                {loan.status === 'active' && (
                                  <DropdownMenuItem onClick={() => handleOpenMarkAsReturnedModal(loan)} className="cursor-pointer">
                                    <Check className="h-4 w-4 mr-2" />
                                    Marcar como devuelto
                                  </DropdownMenuItem>
                                )}
                                {(user.role === 'admin' || user.role === 'librarian') && (
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive cursor-pointer"
                                    onClick={() => handleOpenDeleteModal(loan)}
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Eliminar préstamo
                                  </DropdownMenuItem>
                                )}
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
        </TabsContent>
      </Tabs>

      {/* Modales */}
      {isAddModalOpen && (
        <AddLoanModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleLoanActionSuccess}
        />
      )}
      
      {isDetailModalOpen && selectedLoan && (
        <LoanDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          loan={selectedLoan}
        />
      )}
      
      {isDeleteModalOpen && selectedLoan && (
        <DeleteLoanModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          loanId={selectedLoan.id}
          documentId={selectedLoan.documentId}
          onSuccess={handleLoanActionSuccess}
        />
      )}
      
      {isReturnModalOpen && selectedLoan && (
        <MarkAsReturnedModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          loanId={selectedLoan.id}
          documentId={selectedLoan.documentId}
          onSuccess={handleLoanActionSuccess}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <Badge className="bg-blue-600">
        <Calendar className="h-3 w-3 mr-1" />
        Activo
      </Badge>
    );
  } else if (status === 'returned') {
    return (
      <Badge className="bg-green-600">
        <Check className="h-3 w-3 mr-1" />
        Devuelto
      </Badge>
    );
  } else if (status === 'overdue') {
    return (
      <Badge className="bg-red-600">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Atrasado
      </Badge>
    );
  }
  
  return null;
}