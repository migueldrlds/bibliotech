"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '@/context/user-context';
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, ChevronLeft, Loader2, BookOpenText, User as UserIcon, Building } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { loanService } from "@/services/loanService";
import { bookService } from "@/services/bookService";
import { userService, User as ServiceUser } from "@/services/userService";

interface Book {
  id: number;
  id_libro: string;
  titulo: string;
  autor: string;
  clasificacion?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  Numcontrol?: string;
  Carrera?: string;
}

export default function CrearPrestamoPage() {
  const router = useRouter();
  const { user, isAdmin, hasRole } = useUser();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  
  // Verificar si el usuario tiene permisos, si no redirigir al login o catálogo
  useEffect(() => {
    setIsMounted(true);
    
    if (user === null) {
      // Si no hay usuario (no ha iniciado sesión), redirigir a login
      console.log("Usuario no autenticado, redirigiendo a login...");
      router.push('/auth/login');
    } else if (user && (user.role === 'alumno' || user.role === 'authenticated')) {
      // Si el usuario tiene sesión pero no tiene permisos, redirigir al catálogo
      console.log("Usuario sin permisos suficientes, redirigiendo a catálogo...");
      router.push('/catalogo');
    }
  }, [user, router]);
  
  // Si el componente no está montado, devolver un div vacío para evitar errores de hidratación
  if (!isMounted) {
    return <div className="min-h-screen"></div>;
  }
  
  // Si el usuario no está autenticado o no tiene permisos, no mostrar el contenido
  if (!user || (user && (user.role === 'alumno' || user.role === 'authenticated'))) {
    return <div className="min-h-screen"></div>;
  }
  
  // Estados para los datos del formulario
  const [bookId, setBookId] = useState("");
  const [userId, setUserId] = useState("");
  const [loanDate, setLoanDate] = useState<Date>(new Date());
  const [returnDate, setReturnDate] = useState<Date>(addDays(new Date(), 14)); // 14 días por defecto
  const [campus, setCampus] = useState<string>("Tomas Aquino");
  const [notes, setNotes] = useState("");
  
  // Estados para las búsquedas
  const [bookSearchTerm, setBookSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<ServiceUser[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ServiceUser[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedUser, setSelectedUser] = useState<ServiceUser | null>(null);
  
  // Estado de carga
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar libros
        setIsLoadingBooks(true);
        const booksData = await bookService.getBooks();
        setBooks(booksData.data);
        setFilteredBooks(booksData.data);
        setIsLoadingBooks(false);
        
        // Cargar usuarios
        setIsLoadingUsers(true);
        const usersData = await userService.getUsers();
        setUsers(usersData);
        setFilteredUsers(usersData);
        setIsLoadingUsers(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos necesarios.",
          variant: "destructive",
        });
      }
    };
    
    fetchData();
  }, [toast]);

  // Filtrar libros basados en el término de búsqueda
  useEffect(() => {
    if (!bookSearchTerm.trim()) {
      setFilteredBooks(books);
      return;
    }
    
    const searchTerm = bookSearchTerm.toLowerCase();
    const filtered = books.filter(book => 
      book.titulo.toLowerCase().includes(searchTerm) || 
      book.autor.toLowerCase().includes(searchTerm) ||
      book.id_libro.toLowerCase().includes(searchTerm)
    );
    
    setFilteredBooks(filtered);
  }, [bookSearchTerm, books]);

  // Filtrar usuarios basados en el término de búsqueda
  useEffect(() => {
    if (!userSearchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const searchTerm = userSearchTerm.toLowerCase();
    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(searchTerm) || 
      (user.Numcontrol && user.Numcontrol.toLowerCase().includes(searchTerm)) ||
      user.email.toLowerCase().includes(searchTerm)
    );
    
    setFilteredUsers(filtered);
  }, [userSearchTerm, users]);

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setBookId(book.id.toString());
  };

  const handleUserSelect = (user: ServiceUser) => {
    setSelectedUser(user);
    setUserId(user.id.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBook || !selectedUser) {
      toast({
        title: "Error",
        description: "Por favor selecciona un libro y un usuario",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Preparar datos para el servicio
      const loanData = {
        book: selectedBook.id,
        usuario: selectedUser.id,
        fecha_prestamo: loanDate.toISOString(),
        fecha_devolucion_esperada: returnDate.toISOString(),
        estado: "activo",
        notas: notes,
        campus_origen: campus
      };
      
      // Crear el préstamo
      await loanService.createLoan(loanData);
      
      toast({
        title: "Préstamo creado",
        description: "El préstamo se ha registrado correctamente",
      });
      
      // Redirigir a la lista de préstamos
      router.push("/prestamos");
    } catch (error) {
      console.error("Error al crear préstamo:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el préstamo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-3xl font-bold tracking-tight">Crear Préstamo</h2>
            <p className="text-muted-foreground">
              Registra un nuevo préstamo de libro
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Información del Libro</CardTitle>
              <CardDescription>
                Selecciona el libro que se prestará
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookSearch">Buscar Libro</Label>
                <div className="relative">
                  <Input
                    id="bookSearch"
                    placeholder="Buscar por título, autor o ID..."
                    value={bookSearchTerm}
                    onChange={e => setBookSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {isLoadingBooks ? (
                  <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredBooks.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No se encontraron libros
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredBooks.map(book => (
                      <div 
                        key={book.id}
                        className={`p-3 cursor-pointer transition-colors hover:bg-muted ${selectedBook?.id === book.id ? 'bg-muted' : ''}`}
                        onClick={() => handleBookSelect(book)}
                      >
                        <div className="flex items-start gap-2">
                          <BookOpenText className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <div className="font-medium">{book.titulo}</div>
                            <div className="text-sm text-muted-foreground">{book.autor}</div>
                            <div className="text-xs text-muted-foreground mt-1">ID: {book.id_libro}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedBook && (
                <div className="bg-muted p-3 rounded-md mt-2">
                  <div className="text-sm font-medium">Libro seleccionado:</div>
                  <div className="text-base font-semibold">{selectedBook.titulo}</div>
                  <div className="text-sm text-muted-foreground">{selectedBook.autor}</div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Información del Usuario</CardTitle>
              <CardDescription>
                Selecciona el usuario que recibirá el préstamo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userSearch">Buscar Usuario</Label>
                <div className="relative">
                  <Input
                    id="userSearch"
                    placeholder="Buscar por nombre, matrícula o email..."
                    value={userSearchTerm}
                    onChange={e => setUserSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {isLoadingUsers ? (
                  <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No se encontraron usuarios
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map(user => (
                      <div 
                        key={user.id}
                        className={`p-3 cursor-pointer transition-colors hover:bg-muted ${selectedUser?.id === user.id ? 'bg-muted' : ''}`}
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="flex items-start gap-2">
                          <UserIcon className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            {user.Numcontrol && (
                              <div className="text-xs text-muted-foreground mt-1">Matrícula: {user.Numcontrol}</div>
                            )}
                            {user.Carrera && (
                              <div className="text-xs text-muted-foreground">Carrera: {user.Carrera}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedUser && (
                <div className="bg-muted p-3 rounded-md mt-2">
                  <div className="text-sm font-medium">Usuario seleccionado:</div>
                  <div className="text-base font-semibold">{selectedUser.username}</div>
                  {selectedUser.Numcontrol && (
                    <div className="text-sm text-muted-foreground">Matrícula: {selectedUser.Numcontrol}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Préstamo</CardTitle>
              <CardDescription>
                Configura las fechas y otros detalles del préstamo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loanDate">Fecha de Préstamo</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !loanDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {loanDate ? format(loanDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={loanDate}
                        onSelect={(date) => date && setLoanDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="returnDate">Fecha de Devolución Esperada</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !returnDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={(date) => date && setReturnDate(date)}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="campus">Campus de Origen</Label>
                <Select value={campus} onValueChange={setCampus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el campus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tomas Aquino">Tomas Aquino</SelectItem>
                    <SelectItem value="Otay">Otay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Añade notas relevantes sobre este préstamo..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!selectedBook || !selectedUser || isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Préstamo
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
} 