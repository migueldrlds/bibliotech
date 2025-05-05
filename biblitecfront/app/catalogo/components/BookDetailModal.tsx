"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookOpen, MapPin, Calendar, Clock, Users, User, FileText, BookMarked, CheckSquare, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { bookService } from '@/services/bookService';
import { loanService } from '@/services/loanService';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { Book } from '../page';

interface BookDetailModalProps {
  bookId: string | number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (book: Book) => void;
  onDelete?: (bookId: string | number) => Promise<void>;
}

interface Loan {
  id: string;
  documentId?: string;
  user: {
    name: string;
    id: string;
  };
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'activo' | 'devuelto' | 'atrasado';
}

export default function BookDetailModal({ bookId, open, onOpenChange, onEdit, onDelete }: BookDetailModalProps) {
  const { toast } = useToast();
  const { user } = useUser(); // Obtener información del usuario actual
  const [book, setBook] = useState<Book | null>(null);
  const [bookLoans, setBookLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Verificar si el usuario tiene permisos para editar y eliminar
  const canEditBooks = user && !['alumno', 'authenticated'].includes(user.role.toLowerCase());
  
  // Log para depuración
  useEffect(() => {
    if (user) {
      console.log("Usuario en BookDetailModal:", user);
      console.log("Rol de usuario:", user.role);
      console.log("¿Puede editar libros?", canEditBooks);
    }
  }, [user, canEditBooks]);
  
  useEffect(() => {
    if (open && bookId) {
      fetchBookDetails();
    }
  }, [bookId, open]);
  
  const fetchBookDetails = async () => {
    if (!bookId) return;
    
    setIsLoading(true);
    try {
      const response = await bookService.getBook(bookId);
      if (response && response.data) {
        setBook(response.data);
        fetchBookLoans(response.data.id);
      } else {
        setBook(null);
      }
    } catch (error) {
      console.error("Error al obtener detalles del libro:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del libro.",
        variant: "destructive"
      });
      setBook(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchBookLoans = async (id: string | number) => {
    if (!id) return;
    
    setIsLoadingLoans(true);
    try {
      const loans = await loanService.getLoansByBook(id);
      
      // Transformar los préstamos al formato que necesitamos
      const formattedLoans: Loan[] = loans.map((loan: any) => {
        const attributes = loan.attributes || loan;
        const usuario = attributes.usuario && attributes.usuario.data ? 
          attributes.usuario.data.attributes || attributes.usuario.data :
          (attributes.usuario || {});
        
        return {
          id: loan.id || '',
          documentId: attributes.documentId || '',
          user: {
            name: usuario.username || usuario.email || 'Usuario sin nombre',
            id: usuario.id || '',
          },
          loanDate: attributes.fecha_prestamo || '',
          dueDate: attributes.fecha_devolucion_esperada || '',
          returnDate: attributes.fecha_devolucion_real || null,
          status: attributes.estado || 'activo',
        };
      });
      
      setBookLoans(formattedLoans);
    } catch (error) {
      console.error("Error al obtener préstamos del libro:", error);
      toast({
        title: "Advertencia",
        description: "No se pudieron cargar los préstamos asociados al libro.",
        variant: "destructive"
      });
      setBookLoans([]);
    } finally {
      setIsLoadingLoans(false);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!book) return;
    
    const id = book.documentId || book.id_libro || book.id;
    if (!id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el libro a eliminar",
        variant: "destructive"
      });
      return;
    }
    
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(id);
        setShowDeleteDialog(false);
        onOpenChange(false);
        toast({
          title: "Libro eliminado",
          description: "El libro ha sido eliminado correctamente.",
        });
      }
    } catch (error) {
      console.error("Error al eliminar libro:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el libro. Inténtelo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  };
  
  // Obtener etiqueta para el estado del préstamo
  const getLoanStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'activo':
        return <Badge className="bg-blue-600">Activo</Badge>;
      case 'devuelto':
        return <Badge className="bg-green-600">Devuelto</Badge>;
      case 'atrasado':
        return <Badge className="bg-red-600">Atrasado</Badge>;
      default:
        return <Badge className="bg-gray-500">{status || 'Desconocido'}</Badge>;
    }
  };
  
  if (!open) return null;
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-medium">Cargando detalles del libro...</p>
            </div>
          ) : !book ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Libro no encontrado</h3>
              <p className="text-muted-foreground text-center mb-6">No se pudo encontrar la información del libro solicitado.</p>
              <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{book.titulo || book.title || 'Sin título'}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2 mt-1">
                    <span>{book.autor || book.author || 'Autor desconocido'}</span>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="outline" className="rounded-sm">
                      {book.clasificacion || book.genre || 'Sin clasificación'}
                    </Badge>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 gap-6 mt-4">
                <div>
                  <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details">Detalles</TabsTrigger>
                      <TabsTrigger value="location">Ubicación</TabsTrigger>
                      <TabsTrigger value="history">Historial</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Información del libro</CardTitle>
                          <CardDescription>Detalles completos sobre este ejemplar</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-2">
                              <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-semibold text-sm">ID del libro</p>
                                <p className="text-sm text-muted-foreground">{book.id_libro}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-semibold text-sm">Unidades disponibles</p>
                                <p className="text-sm text-muted-foreground">{book.unidad || 0}</p>
                              </div>
                            </div>
                            
                            {book.createdAt && (
                              <div className="flex items-start gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="font-semibold text-sm">Fecha de ingreso</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(book.createdAt)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                          {canEditBooks && (
                            <Button 
                              onClick={() => {
                                if (onEdit) onEdit(book);
                                onOpenChange(false);
                              }}
                              variant="outline"
                            >
                              Editar información
                            </Button>
                          )}
                          {canEditBooks && (
                            <Button 
                              variant="destructive"
                              onClick={() => setShowDeleteDialog(true)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar libro
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="location" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Ubicación</CardTitle>
                          <CardDescription>Información sobre dónde encontrar este ejemplar</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-semibold text-sm">Clasificación</p>
                                <p className="text-sm text-muted-foreground">{book.clasificacion}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <Badge className={(book.unidad || 0) > 0 ? 'bg-green-600' : 'bg-red-600'}>
                                {(book.unidad || 0) > 0 ? 'Disponible' : 'No disponible'}
                              </Badge>
                              <p className="text-sm text-muted-foreground">
                                {book.unidad || 0} de {book.unidad || 0} disponibles
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="history" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Historial de préstamos</CardTitle>
                          <CardDescription>Registro de préstamos de este ejemplar</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {isLoadingLoans ? (
                            <div className="flex justify-center items-center py-8">
                              <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin mr-2"></div>
                              <p>Cargando historial...</p>
                            </div>
                          ) : bookLoans.length === 0 ? (
                            <div className="text-center py-8">
                              <BookMarked className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">No hay registros de préstamos para este libro</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {bookLoans.map((loan) => (
                                <div key={loan.id} className="border rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <User className="h-5 w-5 text-muted-foreground" />
                                      <span className="font-medium">{loan.user.name}</span>
                                    </div>
                                    {getLoanStatusBadge(loan.status)}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Préstamo: </span>
                                      {formatDate(loan.loanDate)}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Devolución esperada: </span>
                                      {formatDate(loan.dueDate)}
                                    </div>
                                    {loan.returnDate && (
                                      <div>
                                        <span className="text-muted-foreground">Devolución real: </span>
                                        {formatDate(loan.returnDate)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmación para eliminar libro */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este libro? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            {canEditBooks && (
              <Button 
                variant="destructive" 
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 