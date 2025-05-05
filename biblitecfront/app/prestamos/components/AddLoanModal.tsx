"use client";

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, X, Search, User, Book } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { loanService } from '@/services/loanService';
import { bookService } from '@/services/bookService';
import { userService } from '@/services/userService';
import {
  Command,
  CommandItem,
} from '@/components/ui/command';

// Definir la interfaz para los libros
interface BookAttributes {
  titulo: string;
  autor: string;
  clasificacion: string;
  [key: string]: any;
}

interface BookItem {
  id: string;
  attributes: BookAttributes;
  [key: string]: any;
}

// Componente para buscar libros
const BookSearch = ({ onSelect }: { onSelect: (book: BookItem | null) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<BookItem[]>([]);
  const [allBooks, setAllBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  // Estados para scroll infinito
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const pageSize = 30; // Número de libros por carga
  const { toast } = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cerrar la lista al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Función para cargar libros con paginación
  const fetchBooks = async (pageToLoad = 1, reset = false) => {
    try {
      if (reset) {
        setAllBooks([]);
        setResults([]);
        setHasMore(true);
        setPage(1);
      }
      
      if (!hasMore && !reset) return;
      
      if (pageToLoad === 1) setLoading(true);
      else setIsLoadingMore(true);
      
      // Construir URL con parámetros de paginación y filtros
      let url = `http://localhost:1337/api/books?populate=*&pagination[page]=${pageToLoad}&pagination[pageSize]=${pageSize}`;
      
      // Añadir filtros si hay término de búsqueda
      if (searchTerm.trim()) {
        url += `&filters[$or][0][titulo][$containsi]=${encodeURIComponent(searchTerm)}`;
        url += `&filters[$or][1][autor][$containsi]=${encodeURIComponent(searchTerm)}`;
        url += `&filters[$or][2][clasificacion][$containsi]=${encodeURIComponent(searchTerm)}`;
        url += `&filters[$or][3][id_libro][$containsi]=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.data && Array.isArray(data.data)) {
        const newBooks = data.data;
        setAllBooks(prev => reset ? newBooks : [...prev, ...newBooks]);
        setResults(prev => reset ? newBooks : [...prev, ...newBooks]);
        // Verificar si hay más resultados
        setHasMore(newBooks.length === pageSize);
        setPage(pageToLoad + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error al cargar libros:", error);
      toast({ 
        title: 'Error', 
        description: 'No se pudieron cargar los libros.', 
        variant: 'destructive' 
      });
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Cargar la primera página al montar o al cambiar el término de búsqueda
  useEffect(() => {
    fetchBooks(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Manejador de scroll para cargar más libros
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Cargar más cuando estemos a menos de 50px del final
    if (scrollHeight - scrollTop - clientHeight < 50 && !loading && !isLoadingMore && hasMore) {
      console.log('Cargando más libros...', { page, scrollTop, scrollHeight, clientHeight });
      fetchBooks(page);
    }
  };

  // Agregar logs para depurar el estado de las variables
  useEffect(() => {
    console.log("Estado de hasMore:", hasMore);
    console.log("Página actual:", page);
  }, [hasMore, page]);

  const handleSelect = (book: BookItem) => {
    console.log("Libro seleccionado (datos completos):", JSON.stringify(book, null, 2));
    console.log("ID del libro:", book.id, "Tipo:", typeof book.id);
    
    // Asegurarse de que tenemos toda la información
    if (book.attributes) {
      console.log("Atributos del libro:", JSON.stringify(book.attributes, null, 2));
    }
    
    setSelectedBook(book);
    onSelect(book);
    setIsFocused(false);
  };

  return (
    <div className="space-y-4" ref={ref}>
      <Label htmlFor="book-search">Libro <span className="text-destructive">*</span></Label>
      
      <div className="relative">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="book-search"
            placeholder="Buscar por título, autor o clasificación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="pl-10 w-full"
          />
        </div>
        
        {isFocused && !selectedBook && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-10 max-h-[300px] shadow-lg">
            <CardContent 
              className="p-2" 
              ref={scrollRef} 
              onScroll={handleScroll}
              style={{ maxHeight: 260, overflowY: 'auto' }}
            >
              {loading && results.length === 0 && (
                <div className="flex justify-center items-center p-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  <p className="ml-2 text-sm text-muted-foreground">Cargando libros...</p>
                </div>
              )}
              
              {!loading && results.length === 0 && (
                <p className="text-center p-4 text-sm text-muted-foreground">
                  No se encontraron resultados
                </p>
              )}
              
              <div className="divide-y divide-muted">
                {results.map((book) => (
                  <div
                    key={book.id || `book-${Math.random()}`}
                    onClick={() => handleSelect(book)}
                    className="flex items-center p-2 hover:bg-accent cursor-pointer"
                  >
                    <Book className="mr-2 h-4 w-4" />
                    <div>
                      <div className="font-medium">
                        {book.attributes?.titulo || book.titulo || 'Sin título'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {book.attributes?.autor || book.autor || 'Sin autor'} • 
                        {book.attributes?.clasificacion || book.clasificacion || 'Sin clasificación'}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Indicador de carga para paginación */}
                {isLoadingMore && (
                  <div className="flex justify-center items-center p-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="ml-2 text-xs text-muted-foreground">Cargando más...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {selectedBook && (
        <div className="flex items-center mt-2 p-2 border rounded-md bg-muted">
          <Book className="mr-2 h-4 w-4" />
          <div>
            <div className="font-medium">
              {selectedBook.attributes?.titulo || selectedBook.titulo || 'Sin título'}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedBook.attributes?.autor || selectedBook.autor || 'Sin autor'} • 
              {selectedBook.attributes?.clasificacion || selectedBook.clasificacion || 'Sin clasificación'}
            </div>
          </div>
          <Button
            variant="ghost"
            className="ml-auto h-8 w-8 p-0"
            onClick={() => {
              setSelectedBook(null);
              onSelect(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// Componente para buscar usuarios
const UserSearch = ({ onSelect }: { onSelect: (user: any | null) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const { toast } = useToast();
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar la lista al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cargar todos los usuarios al montar el componente
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        setLoading(true);
        
        // Hacer la petición directamente a la API de Strapi
        // Usar un token de API para simplificar (NO USAR EN PRODUCCIÓN)
        const apiToken = "8c89054f1b448eea0733a92bba0c4d58a32195934fd06a9ad93d04c42fd8ab6fc418bad753cdac94c33b2f6c7482f3600835f317604f9b2e6e699a3c7613b9d0738085ab04af593fa986d34f78f79bb28241d2356b75959c28af87038876a7201a4fee8b0b780ff4da0ba10d6b20ed71a45744491cd1ad2153e7de354bae2545";
        
        const response = await fetch('http://localhost:1337/api/users?populate=*', {
          headers: {
            'Authorization': `Bearer ${apiToken}`
          }
        });
        
        const data = await response.json();
        console.log("Respuesta cruda de usuarios:", data);
        
        if (data && Array.isArray(data)) {
          // Registrar información de cada usuario para depuración
          data.forEach((user, index) => {
            console.log(`Usuario #${index + 1}:`, {
              id: user.id,
              typeId: typeof user.id,
              username: user.username,
              email: user.email,
              provider: user.provider,
              confirmed: user.confirmed,
              blocked: user.blocked,
              role: user.role?.name || 'Sin rol'
            });
          });
          
          setAllUsers(data);
          console.log("Usuarios cargados correctamente:", data.length);
        } else {
          console.error("Formato de respuesta inesperado:", data);
          setAllUsers([]);
        }
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        setAllUsers([]);
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios. Revisa la consola para más detalles.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAllUsers();
  }, [toast]);

  // Filtrar usuarios cuando cambie el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      // Si no hay término de búsqueda, mostrar todos los usuarios
      setResults(allUsers);
      return;
    }

    // Filtrar los usuarios
    const filtered = allUsers.filter(user => {
      if (!user) return false;
      
      const username = user.username || '';
      const email = user.email || '';
      
      const term = searchTerm.toLowerCase();
      return username.toLowerCase().includes(term) || 
             email.toLowerCase().includes(term);
    });

    setResults(filtered);
  }, [searchTerm, allUsers]);

  const handleSelect = (user: any) => {
    // Registrar información completa del usuario para depuración
    console.log("Usuario seleccionado en UserSearch:", {
      id: user.id, 
      typeId: typeof user.id,
      username: user.username, 
      email: user.email,
      provider: user.provider,
      role: user.role?.name || 'Sin rol',
      fullUser: user
    });
    
    setSelectedUser(user);
    onSelect(user);
    setIsFocused(false);
  };

  return (
    <div className="space-y-4" ref={ref}>
      <Label htmlFor="user-search">Usuario <span className="text-destructive">*</span></Label>
      
      <div className="relative">
        <div className="relative w-full">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="user-search"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="pl-10 w-full"
          />
        </div>
        
        {/* Renderizar los resultados de búsqueda de usuarios */}
        {isFocused && !selectedUser && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-10 max-h-[300px] overflow-y-auto shadow-lg">
            <CardContent className="p-2">
              {loading ? (
                <div className="flex justify-center items-center p-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  <p className="ml-2 text-sm text-muted-foreground">Cargando usuarios...</p>
                </div>
              ) : results.length === 0 ? (
                <p className="text-center p-4 text-sm text-muted-foreground">
                  {allUsers.length === 0 ? "No hay usuarios disponibles" : "No se encontraron resultados"}
                </p>
              ) : (
                <div className="divide-y divide-muted">
                  {results.map((user) => (
                    <div
                      key={user.id || `user-${Math.random()}`}
                      onClick={() => handleSelect(user)}
                      className="flex items-center p-2 hover:bg-accent cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <div>
                        <div className="font-medium">
                          {user.username || (user.attributes && user.attributes.username) || 
                          user.email || (user.attributes && user.attributes.email) || 'Usuario sin nombre'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email || (user.attributes && user.attributes.email) || 'Sin email'}
                          {user.id && <span className="text-xs ml-2 text-gray-400">ID: {user.id}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {selectedUser && (
        <div className="flex items-center mt-2 p-2 border rounded-md bg-muted">
          <User className="mr-2 h-4 w-4" />
          <div>
            <div className="font-medium">
              {selectedUser.username || (selectedUser.attributes && selectedUser.attributes.username) || 
               selectedUser.email || (selectedUser.attributes && selectedUser.attributes.email) || 'Usuario sin nombre'}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedUser.email || (selectedUser.attributes && selectedUser.attributes.email) || 'Sin email'}
              {selectedUser.id && <span className="text-xs ml-2 text-gray-400">ID: {selectedUser.id}</span>}
            </div>
          </div>
          <Button
            variant="ghost"
            className="ml-auto h-8 w-8 p-0"
            onClick={() => {
              setSelectedUser(null);
              onSelect(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// Componente de selección de fecha
const DatePicker = ({ 
  label, 
  date, 
  onSelect 
}: { 
  label: string; 
  date: Date; 
  onSelect: (date: Date) => void 
}) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(date, 'PPP', { locale: es })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => date && onSelect(date)}
            initialFocus
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddLoanModal({ isOpen, onClose, onSuccess }: AddLoanModalProps) {
  const { toast } = useToast();
  
  // Estados para el formulario
  const [loanDate, setLoanDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Por defecto, una semana
    return date;
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para libros y usuarios
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // Manejar la selección de un libro
  const handleSelectBook = (book: BookItem | null) => {
    setSelectedBook(book);
    
    // Comprobar si hay unidades disponibles
    if (book && (book.attributes?.unidad || book.unidad || 0) <= 0) {
      toast({
        title: "Advertencia",
        description: "Este libro no tiene unidades disponibles para préstamo",
        variant: "destructive",
      });
    }
  };
  
  // Manejar la selección de un usuario
  const handleSelectUser = (user: any | null) => {
    console.log("Usuario seleccionado completo:", JSON.stringify(user, null, 2));
    console.log("ID del usuario:", user?.id);
    console.log("Tipo de ID:", typeof user?.id);
    console.log("Email:", user?.email);
    console.log("Username:", user?.username);
    setSelectedUser(user);
  };
  
  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBook) {
      toast({
        title: "Error",
        description: "Debe seleccionar un libro para el préstamo",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Debe seleccionar un usuario para el préstamo",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar si hay unidades disponibles
    const unidades = selectedBook.attributes?.unidad || selectedBook.unidad || 0;
    if (unidades <= 0) {
      toast({
        title: "Error",
        description: "No hay unidades disponibles de este libro",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      console.log("Detalles completos del usuario seleccionado:", JSON.stringify(selectedUser, null, 2));
      console.log("Libro seleccionado:", JSON.stringify(selectedBook, null, 2));
      
      // Extraer documentId del libro
      const bookDocId = selectedBook.documentId || selectedBook.attributes?.documentId;
      
      if (!bookDocId) {
        toast({
          title: "Error",
          description: "El libro seleccionado no tiene un documentId válido",
          variant: "destructive",
        });
        return;
      }
      
      // 1. Primero crear el préstamo directamente con la API de Strapi
      const loanPayload = {
        data: {
          book: bookDocId, // Usar SIEMPRE documentId
          usuario: selectedUser.id,
          fecha_prestamo: format(loanDate, 'yyyy-MM-dd'),
          fecha_devolucion_esperada: format(dueDate, 'yyyy-MM-dd'),
          estado: "activo",
          notas: notes || ''
        }
      };
      
      console.log("Enviando datos de préstamo a Strapi:", JSON.stringify(loanPayload, null, 2));
      
      // Obtener el JWT token del localStorage para autenticación (si es necesario)
      const auth = localStorage.getItem('strapi_jwt');
      const loanResponse = await fetch('http://localhost:1337/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(auth ? { 'Authorization': `Bearer ${auth}` } : {})
        },
        body: JSON.stringify(loanPayload)
      });
      
      const loanData = await loanResponse.json();
      console.log("Respuesta del servidor al crear préstamo:", JSON.stringify(loanData, null, 2));
      
      if (loanData.error) {
        throw new Error(`Error del servidor: ${loanData.error.message}`);
      }
      
      // 2. Actualizar directamente el inventario del libro usando documentId
      console.log(`Actualizando inventario del libro con documentId: ${bookDocId}`);
      
      // Calcular nueva cantidad (restar 1 unidad)
      const newUnits = Math.max(0, unidades - 1);
      console.log(`Unidades actuales: ${unidades}, Nuevas unidades: ${newUnits}`);
      
      const bookUpdateData = {
        data: {
          unidad: newUnits
        }
      };
      
      console.log("Datos para actualización:", JSON.stringify(bookUpdateData, null, 2));
      
      // Usar SIEMPRE documentId para la actualización
      const updateBookUrl = `http://localhost:1337/api/books/${bookDocId}`;
      console.log(`URL de actualización: ${updateBookUrl}`);
      
      try {
        // Hacer la actualización
        const updateBookResponse = await fetch(updateBookUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(auth ? { 'Authorization': `Bearer ${auth}` } : {})
          },
          body: JSON.stringify(bookUpdateData)
        });
        
        if (!updateBookResponse.ok) {
          throw new Error(`Error HTTP: ${updateBookResponse.status}`);
        }
        
        const updateBookData = await updateBookResponse.json();
        console.log("Respuesta al actualizar el libro:", JSON.stringify(updateBookData, null, 2));
        
        if (updateBookData.error) {
          console.error("Error al actualizar el inventario:", updateBookData.error);
          toast({
            title: "Advertencia",
            description: "El préstamo se creó pero no se pudo actualizar el inventario",
            variant: "default",
          });
        } else {
          console.log(`Inventario actualizado correctamente. Nuevas unidades: ${updateBookData.data?.attributes?.unidad || 'N/A'}`);
          toast({
            title: "Éxito",
            description: "Préstamo creado y el inventario actualizado correctamente",
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Error al actualizar el inventario:", error);
        toast({
          title: "Advertencia",
          description: `El préstamo se creó pero no se pudo actualizar el inventario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          variant: "default",
        });
      }
      
      // Limpiar el formulario
      setSelectedBook(null);
      setSelectedUser(null);
      setLoanDate(new Date());
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 7);
      setDueDate(newDueDate);
      setNotes('');
      
      // Cerrar el modal y notificar el éxito
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error al crear préstamo:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el préstamo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Nuevo Préstamo</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Utilizar el componente BookSearch para seleccionar libro */}
          <BookSearch onSelect={handleSelectBook} />
          
          {/* Utilizar el componente UserSearch para seleccionar usuario */}
          <UserSearch onSelect={handleSelectUser} />
          
          {/* Selectores de fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DatePicker 
              label="Fecha de préstamo"
              date={loanDate}
              onSelect={setLoanDate}
            />
            
            <DatePicker 
              label="Fecha de devolución esperada"
              date={dueDate}
              onSelect={setDueDate}
            />
          </div>
          
          {/* Campo de notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre el préstamo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          
          {/* Botones de acción */}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={!selectedBook || !selectedUser || isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Crear Préstamo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}