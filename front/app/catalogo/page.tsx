"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search,
  Filter,
  BookOpen,
  Pencil,
  Building2,
  BookCopy,
  GraduationCap,
  Bookmark,
  User,
  CalendarDays,
  Trash2,
  MoreVertical,
  Plus,
  Hash,
  BookText,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { bookService, Book as ApiBook } from "@/services/bookService";
import { getCachedBookCover } from "@/services/bookCoverService";
import { loanService, Loan } from "@/services/loanService";
import { cn } from "@/lib/utils";
import { useUser } from '@/context/user-context';

// Schema for book form validation
const bookSchema = z.object({
  id: z.string().min(1, "El ID es requerido"),
  title: z.string().min(1, "El título es requerido"),
  author: z.string().min(1, "El autor es requerido"),
  category: z.string().min(1, "La categoría es requerida"),
  classification: z.string().min(1, "La clasificación es requerida"),
  available: z.coerce.number().min(0, "Debe ser un número positivo"),
  image: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  location: z.object({
    campus: z.string().min(1, "El campus es requerido"),
  }),
});

// Mock data for books with more examples
const books = [
  {
    id: "LIB-2023-001",
    title: "Fundamentos de Programación",
    author: "Luis Joyanes Aguilar",
    category: "Informática",
    classification: "QA76.73.P98",
    available: 3,
    total: 5,
    entryDate: "2023-01-15",
    image: "https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg",
    location: {
      campus: "Unidad Tomás Aquino",
    },
    loanHistory: [
      { user: "Juan Pérez", startDate: "2023-10-01", endDate: "2023-10-15", status: "returned" },
      { user: "María Sánchez", startDate: "2023-09-15", endDate: "2023-09-30", status: "returned" },
    ],
  },
  {
    id: "LIB-2023-002",
    title: "Cálculo: Una Variable",
    author: "James Stewart",
    category: "Matemáticas",
    classification: "QA303.2.S74",
    available: 2,
    total: 4,
    entryDate: "2023-02-20",
    image: "https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg",
    location: {
      campus: "Unidad Otay",
    },
    loanHistory: [
      { user: "Ana González", startDate: "2023-10-05", endDate: "2023-10-19", status: "active" },
    ],
  },
];

// Categories for the select input
const categories = [
  "Informática",
  "Matemáticas",
  "Física",
  "Química",
  "Ingeniería",
  "Literatura",
  "Historia",
];

// Campuses for the select input
const campuses = [
  "Tomas Aquino",
  "Otay",
  "Unidad Tijuana",
];

function CatalogoContent() {
  const { user, isAdmin, hasRole } = useUser();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<(typeof books[0] & { 
    inventories?: { Campus: string; Cantidad: number; id: number }[],
    location: { 
      campus: string; 
      campusDetails?: Array<{name: string; quantity: number}>
    }
  }) | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiBooks, setApiBooks] = useState<ApiBook[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [bookCovers, setBookCovers] = useState<Record<string, string>>({});
  const [loanHistory, setLoanHistory] = useState<Loan[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);

  const isAlumno = user?.role === 'alumno' || user?.role === 'authenticated';

  useEffect(() => {
    fetchBooks();
  }, [currentPage, searchTerm, selectedCategory, selectedCampus]);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Construir filtros para búsqueda
      const filters: any = {
        'pagination[page]': currentPage,
        'pagination[pageSize]': 20,
      };

      // Filtros de búsqueda
      if (searchTerm) {
        filters['filters[$or][0][titulo][$containsi]'] = searchTerm;
        filters['filters[$or][1][autor][$containsi]'] = searchTerm;
        filters['filters[$or][2][id_libro][$containsi]'] = searchTerm;
      }

      // Filtros de categoría
      if (selectedCategory) {
        filters['filters[clasificacion][$containsi]'] = selectedCategory;
      }

      // Filtros de campus
      if (selectedCampus) {
        filters['filters[inventory][Campus][$eq]'] = selectedCampus;
      }

      const response = await bookService.getBooks(filters);
      
      if (response && response.data) {
        setApiBooks(response.data);
        setTotalBooks(response.meta?.pagination?.total || response.data.length);
      }
    } catch (err) {
      console.error("Error al cargar libros:", err);
      setError("No se pudieron cargar los libros. Por favor, intenta de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  // Transformar API books al formato que espera la UI
  const transformedBooks = apiBooks.map(book => {
    // Obtener los inventarios del libro (puede estar en múltiples campus)
    interface Inventory {
      id: number;
      documentId?: string;
      Campus: string;
      Cantidad: number;
      createdAt?: string;
      updatedAt?: string;
      publishedAt?: string;
    }
    
    let inventories: Inventory[] = [];
    
    // Comprobar si el libro tiene inventarios en el formato de array
    if (book.inventories && Array.isArray(book.inventories)) {
      inventories = book.inventories;
    } 
    // Comprobar si el libro tiene un solo inventario como objeto (compatibilidad)
    else if (book.inventory) {
      inventories = [book.inventory];
    }
    
    // Agrupar inventarios por campus para evitar duplicados y sumar cantidades
    const groupedInventories = inventories.reduce((grouped, inv) => {
      if (!inv || !inv.Campus) return grouped;
      
      const campus = inv.Campus;
      if (!grouped[campus]) {
        grouped[campus] = {
          id: inv.id, // Usamos el ID del primer inventario encontrado para este campus
          Campus: campus,
          Cantidad: 0,
          createdAt: inv.createdAt,
          updatedAt: inv.updatedAt,
          publishedAt: inv.publishedAt
        };
      }
      // Sumar la cantidad al inventario agrupado existente
      grouped[campus].Cantidad += (inv.Cantidad || 0);
      return grouped;
    }, {} as Record<string, Inventory>);
    
    // Convertir el objeto agrupado de vuelta a un array
    const uniqueInventories = Object.values(groupedInventories);
    
    // Calcular disponibilidad total sumando las cantidades de todos los inventarios agrupados
    const totalAvailable = uniqueInventories.reduce((sum, inv) => sum + (inv.Cantidad || 0), 0);
    
    // Obtener todos los campus donde está disponible el libro
    const campuses = uniqueInventories
      .filter(inv => inv.Cantidad > 0)
      .map(inv => inv.Campus)
      .join(", ") || "No especificado";
    
    // Convertir los inventarios agrupados en el formato que espera la UI
    const campusDetails = uniqueInventories
      .filter(inv => inv.Cantidad > 0)
      .map(inv => ({
        name: inv.Campus,
        quantity: inv.Cantidad
      }));
    
    // Usar la URL de la portada del libro desde el estado, o una imagen por defecto
    const coverUrl = bookCovers[book.id_libro] || "https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg";
    
    return {
      id: book.id_libro,
      title: book.titulo,
      author: book.autor,
      category: book.clasificacion.split(',')[0],
      classification: book.clasificacion,
      available: totalAvailable,
      total: totalAvailable,
      entryDate: book.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      image: coverUrl, // Usar la URL de la portada
      location: {
        campus: campuses,
        campusDetails: campusDetails
      },
      inventories: uniqueInventories, // Usamos los inventarios agrupados
      loanHistory: []
    };
  });

  // Efecto para cargar las portadas de los libros
  useEffect(() => {
    const fetchBookCovers = async () => {
      const newCovers: Record<string, string> = {};
      
      // Solo buscar portadas para libros que no tengan una portada ya asignada
      const booksToFetch = apiBooks.filter(book => !bookCovers[book.id_libro]);
      
      if (booksToFetch.length === 0) return;
      
      // Procesar los libros en grupos pequeños para no sobrecargar la API
      // Google Books API tiene límites de uso
      const batchSize = 5;
      
      for (let i = 0; i < booksToFetch.length; i += batchSize) {
        const batch = booksToFetch.slice(i, i + batchSize);
        
        // Buscar portadas en paralelo
        const coverPromises = batch.map(async (book) => {
          try {
            const coverUrl = await getCachedBookCover(book.titulo, book.autor);
            return { id: book.id_libro, url: coverUrl };
          } catch (error) {
            console.error(`Error al buscar portada para ${book.titulo}:`, error);
            return { id: book.id_libro, url: "https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg" };
          }
        });
        
        // Esperar a que se resuelvan todas las promesas de este grupo
        const results = await Promise.all(coverPromises);
        
        // Agregar los resultados al objeto de portadas
        results.forEach(result => {
          newCovers[result.id] = result.url;
        });
        
        // Esperar un momento entre grupos para no sobrecargar la API
        if (i + batchSize < booksToFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Actualizar el estado con las nuevas portadas
      setBookCovers(prev => ({ ...prev, ...newCovers }));
    };
    
    fetchBookCovers();
  }, [apiBooks, bookCovers]);

  // Form for adding/editing books
  const form = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      id: `LIB-${new Date().getFullYear()}-001`,
      title: "",
      author: "",
      category: "",
      classification: "",
      available: 1,
      image: "",
      location: {
        campus: "",
      },
    },
  });

  // Handle form submission
  async function onSubmit(values: z.infer<typeof bookSchema>) {
    try {
      if (isEditDialogOpen && selectedBook) {
        // Actualizar libro
        await bookService.updateBook(selectedBook.id, {
          titulo: values.title,
          autor: values.author,
          clasificacion: values.classification,
          id_libro: values.id,
          campus: values.location.campus
        });
      } else {
        // Crear libro nuevo
        await bookService.createBook({
          id_libro: values.id,
          titulo: values.title,
          autor: values.author,
          clasificacion: values.classification,
          campus: values.location.campus
        });
      }
      
      // Refrescar la lista de libros
      fetchBooks();
      
      // Cerrar diálogos
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error al guardar libro:", error);
    }
  }

  // Handle edit book
  function handleEdit(book: typeof books[0]) {
    setSelectedBook(book);
    form.reset({
      id: book.id,
      title: book.title,
      author: book.author,
      category: book.category,
      classification: book.classification,
      available: book.available,
      image: book.image || "",
      location: {
        campus: book.location.campus,
      },
    });
    setIsEditDialogOpen(true);
  }

  // Handle delete book
  async function handleDelete() {
    if (selectedBook) {
      try {
        await bookService.deleteBook(selectedBook.id);
        // Refrescar la lista después de eliminar
        fetchBooks();
        setDeleteConfirmOpen(false);
      } catch (error) {
        console.error("Error al eliminar libro:", error);
      }
    }
  }

  // Función para cargar el historial de préstamos de un libro
  const loadLoanHistory = async (bookId: string) => {
    try {
      setIsLoadingLoans(true);
      setLoanError(null);
      
      // Obtener todos los préstamos
      const loans = await loanService.getLoans();
      
      // Filtrar los préstamos que corresponden al libro seleccionado
      const bookLoans = loans.filter(loan => 
        loan.book && 
        (loan.book.id_libro === bookId || String(loan.book.id) === bookId)
      );
      
      console.log(`Préstamos encontrados para libro ${bookId}:`, bookLoans);
      setLoanHistory(bookLoans);
    } catch (error) {
      console.error(`Error al cargar historial de préstamos para libro ${bookId}:`, error);
      setLoanError("No se pudo cargar el historial de préstamos");
    } finally {
      setIsLoadingLoans(false);
    }
  };
  
  // Actualizar para cargar préstamos cuando se abre el modal de detalles
  function handleShowDetails(book: typeof books[0]) {
    setSelectedBook(book);
    setIsDetailsDialogOpen(true);
    
    // Cargar historial de préstamos
    loadLoanHistory(book.id);
  }

  // Book form dialog content
  const BookFormContent = ({ isEdit = false }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID del Libro*</FormLabel>
              <FormControl>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    {...field}
                    className="pl-10"
                    disabled={isEdit}
                    placeholder="ID generado automáticamente"
                  />
                </div>
              </FormControl>
              <FormDescription>
                ID generado automáticamente. Puede cambiarlo si lo desea.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título*</FormLabel>
              <FormControl>
                <div className="relative">
                  <BookText className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input {...field} className="pl-10" placeholder="Título del libro" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Autor*</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input {...field} className="pl-10" placeholder="Autor del libro" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="classification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clasificación*</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ej: QA76.73.P98" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="available"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidades disponibles*</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location.campus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campus*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar campus" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {campuses.map((campus) => (
                      <SelectItem key={campus} value={campus}>
                        {campus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de la imagen de portada</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://ejemplo.com/imagen.jpg" />
              </FormControl>
              <FormDescription>
                URL de la imagen de portada (opcional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            form.reset();
          }}>
            Cancelar
          </Button>
          <Button type="submit">{isEdit ? "Actualizar" : "Agregar"}</Button>
        </div>
      </form>
    </Form>
  );

  return (
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Catálogo</h2>
          <p className="text-muted-foreground">
            Gestiona el inventario de libros de la biblioteca
          </p>
        </div>
        <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
            placeholder="Buscar por título, autor, ID..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="p-2 space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Categoría</h4>
                <Select 
                  value={selectedCategory} 
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Campus</h4>
                <Select 
                  value={selectedCampus} 
                  onValueChange={setSelectedCampus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los campus" />
            </SelectTrigger>
            <SelectContent>
                    <SelectItem value="">Todos los campus</SelectItem>
                    {campuses.map((campus) => (
                      <SelectItem key={campus} value={campus}>
                        {campus}
                      </SelectItem>
                    ))}
            </SelectContent>
          </Select>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setSelectedCategory("");
                  setSelectedCampus("");
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <div className="flex justify-end">
          {/* Ocultar botón "Añadir libro" si el usuario es alumno */}
          {!isAlumno && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir libro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Añadir nuevo libro</DialogTitle>
                  <DialogDescription>
                    Completa la información para añadir un nuevo libro al catálogo.
                  </DialogDescription>
                </DialogHeader>
                <BookFormContent isEdit={false} />
              </DialogContent>
            </Dialog>
          )}
    </div>

    {isLoading ? (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 animate-pulse" />
          <p className="mt-4 text-muted-foreground">Cargando libros...</p>
        </div>
      </div>
    ) : error ? (
      <div className="rounded-lg border bg-card text-card-foreground p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <BookOpen className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Error al cargar libros</h3>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-6" onClick={fetchBooks}>
          Reintentar
        </Button>
      </div>
    ) : transformedBooks.length === 0 ? (
      <div className="rounded-lg border bg-card text-card-foreground p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <BookOpen className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No hay libros disponibles</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No se encontraron libros que coincidan con los criterios de búsqueda.
        </p>
        <Button className="mt-6" onClick={() => {
          setSearchTerm("");
          setSelectedCategory("");
          setSelectedCampus("");
        }}>
          Limpiar filtros
        </Button>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {transformedBooks.map((book) => (
          <div
            key={book.id}
            className="bg-card rounded-lg border hover:shadow-md transition-shadow"
          >
            <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
              <img
                src={book.image}
                alt={book.title}
                className="object-cover w-full h-full object-center transform scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              {/* Badge de disponibilidad */}
              <div className="absolute bottom-2 left-2">
                <div className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent text-primary-foreground",
                  book.available > 0 
                    ? "bg-green-500/90 hover:bg-green-500/90" 
                    : "bg-red-500/90 hover:bg-red-500/90"
                )}>
                  {book.available > 0 
                    ? `${book.available} disponibles` 
                    : "No disponible"}
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold line-clamp-2">{book.title}</h3>
                <p className="text-sm text-muted-foreground">{book.author}</p>
              </div>
              
              <div className="space-y-2">
                {/* Clasificación e ícono */}
                <div className="flex items-center gap-2 text-sm">
                  <BookCopy className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{book.classification}</span>
                </div>
                
                {/* Categoría e ícono */}
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{book.category}</span>
                </div>
                
                {/* Campus e ícono */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground font-medium">Disponibilidad por campus:</span>
                  </div>
                  {book.location.campusDetails && book.location.campusDetails.length > 0 ? (
                    <div className="flex flex-col gap-1 pl-6">
                      {book.location.campusDetails.map((campus, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{campus.name}</span>
                          <div className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent text-primary-foreground",
                            "bg-slate-500/90 hover:bg-slate-500/90"
                          )}>
                            {campus.quantity} {campus.quantity === 1 ? "unidad" : "unidades"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pl-6 text-sm text-muted-foreground">
                      Sin inventario disponible
                    </div>
                  )}
                </div>
              </div>
              
              {/* Botones de acciones - Ocultar botón editar si el usuario es alumno */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => handleShowDetails(book)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Detalles
                </Button>
                
                {!isAlumno && (
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="w-full"
                    onClick={() => handleEdit(book)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {totalBooks > 0 && (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          
          {/* Primera página siempre visible */}
          <PaginationItem>
            <PaginationLink
              isActive={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              1
            </PaginationLink>
          </PaginationItem>
          
          {/* Mostrar elipsis si la página actual está lejos del inicio */}
          {currentPage > 3 && (
          <PaginationItem>
              <PaginationEllipsis />
          </PaginationItem>
          )}
          
          {/* Páginas alrededor de la página actual */}
          {Array.from(
            { length: Math.min(Math.ceil(totalBooks / 20), 5) },
            (_, i) => {
              // Calcular las páginas que se mostrarán alrededor de la actual
              const totalPages = Math.ceil(totalBooks / 20);
              let pageToShow;
              
              if (currentPage <= 2) {
                // Si estamos cerca del principio, mostrar las primeras páginas
                pageToShow = i + 2; // Comienza en 2 porque el 1 ya se muestra siempre
              } else if (currentPage >= totalPages - 2) {
                // Si estamos cerca del final, mostrar las últimas páginas
                pageToShow = totalPages - 4 + i; // Mostrar 5 últimas páginas
              } else {
                // En medio, mostrar 2 antes y 2 después de la actual
                pageToShow = currentPage - 2 + i;
              }
              
              // Solo mostrar la página si está dentro del rango válido y no es la primera ni última
              if (pageToShow > 1 && pageToShow < totalPages) {
                return (
                  <PaginationItem key={pageToShow}>
                    <PaginationLink
                      isActive={currentPage === pageToShow}
                      onClick={() => setCurrentPage(pageToShow)}
                    >
                      {pageToShow}
                    </PaginationLink>
              </PaginationItem>
                );
              }
              return null;
            }
          ).filter(Boolean)}
          
          {/* Mostrar elipsis si la página actual está lejos del final */}
          {currentPage < Math.ceil(totalBooks / 20) - 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          )}
          
          {/* Última página siempre visible */}
          {Math.ceil(totalBooks / 20) > 1 && (
            <PaginationItem>
              <PaginationLink
                isActive={currentPage === Math.ceil(totalBooks / 20)}
                onClick={() => setCurrentPage(Math.ceil(totalBooks / 20))}
              >
                {Math.ceil(totalBooks / 20)}
              </PaginationLink>
            </PaginationItem>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalBooks / 20), prev + 1))}
              className={currentPage === Math.ceil(totalBooks / 20) ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )}

    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El libro será eliminado permanentemente
            del catálogo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="sm:max-w-[625px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar libro</DialogTitle>
          <DialogDescription>
            Actualiza la información del libro en el catálogo.
          </DialogDescription>
        </DialogHeader>
        <BookFormContent isEdit={true} />
      </DialogContent>
    </Dialog>

    {/* Modal de detalles del libro */}
    <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto p-0 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row h-full">
          {/* Columna izquierda: Imagen del libro */}
          {selectedBook && (
            <div className="sm:w-1/3 w-full flex-shrink-0 flex justify-center items-center h-full">
              <div className="aspect-[3/4] w-full max-w-[340px] rounded-lg overflow-hidden border border-muted h-full flex items-center justify-center">
                <img
                  src={selectedBook.image}
                  alt={selectedBook.title}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}
          {/* Columna derecha: Todo el contenido del modal */}
          <div className="sm:w-2/3 w-full p-6">
            <DialogHeader className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  {selectedBook && (
                    <>
                      <DialogTitle className="text-2xl">{selectedBook.title}</DialogTitle>
                      <DialogDescription>{selectedBook.author}</DialogDescription>
                    </>
                  )}
                </div>
                {/* Ocultar menú de edición si el usuario es alumno */}
                {!isAlumno && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setIsDetailsDialogOpen(false);
                        selectedBook && handleEdit(selectedBook);
                      }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            className="text-red-600 dark:text-red-400"
                            onSelect={(e) => e.preventDefault()}
                            onClick={() => selectedBook && setSelectedBook(selectedBook)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. El libro será eliminado permanentemente del sistema.
                              {selectedBook && (
                                <div className="mt-4 p-4 border rounded-lg bg-muted">
                                  <p className="font-medium">{selectedBook.title}</p>
                                  <p className="text-sm text-muted-foreground">ID: {selectedBook.id}</p>
                                  <p className="text-sm text-muted-foreground">Autor: {selectedBook.author}</p>
                                </div>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-500 hover:bg-red-600"
                              onClick={handleDelete}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </DialogHeader>
            {/* Resto del contenido: Tabs, detalles, etc. - Modificar tabs según rol */}
            {selectedBook && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className={`w-full grid ${isAlumno ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  <TabsTrigger value="details">Detalles</TabsTrigger>
                  <TabsTrigger value="location">Ubicación</TabsTrigger>
                  {/* Ocultar pestaña historial para alumnos */}
                  {!isAlumno && (
                    <TabsTrigger value="history">Historial</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="flex items-center gap-2">
                      <Hash className="h-5 w-5 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">ID del Libro</p>
                        <p className="font-medium">{selectedBook.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookCopy className="h-5 w-5 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Clasificación</p>
                        <p className="font-medium">{selectedBook.classification}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Categoría</p>
                        <p className="font-medium">{selectedBook.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-5 w-5 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Disponibilidad</p>
                        <Badge 
                          className={
                            selectedBook.available > 0 
                              ? "bg-green-500/90 hover:bg-green-500/90" 
                              : "bg-red-500/90 hover:bg-red-500/90"
                          }
                        >
                          {selectedBook.available} de {selectedBook.total} disponibles
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Fecha de ingreso</p>
                        <p className="font-medium">{selectedBook.entryDate}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="location" className="space-y-4">
                  {/* Mostrar cada campus en una tarjeta separada con cantidad */}
                  {selectedBook && selectedBook.location && selectedBook.location.campusDetails && selectedBook.location.campusDetails.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {selectedBook.location.campusDetails.map((campus, idx) => (
                        <div key={idx} className="rounded-lg border bg-card p-4 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h3 className="text-base font-semibold">{campus.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1">{campus.quantity} disponibles</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                      Sin información de inventario por campus
                    </div>
                  )}
                </TabsContent>

                {/* Ocultar contenido de historial para alumnos */}
                {!isAlumno && (
                  <TabsContent value="history" className="space-y-4">
                    {isLoadingLoans ? (
                      <div className="text-center py-6">
                        <div className="flex flex-col items-center">
                          <User className="h-10 w-10 text-muted-foreground/50 animate-pulse" />
                          <p className="mt-4 text-muted-foreground">Cargando historial de préstamos...</p>
                        </div>
                      </div>
                    ) : loanError ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>{loanError}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => selectedBook && loadLoanHistory(selectedBook.id)}
                        >
                          Reintentar
                        </Button>
                      </div>
                    ) : loanHistory.length > 0 ? (
                      <div className="space-y-4">
                        {loanHistory.map((loan, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{loan.usuario?.username || `Usuario #${loan.usuario?.id || 'N/A'}`}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                <span>
                                  {new Date(loan.fecha_prestamo).toLocaleDateString('es-ES')} - 
                                  {loan.fecha_devolucion_real 
                                    ? new Date(loan.fecha_devolucion_real).toLocaleDateString('es-ES')
                                    : new Date(loan.fecha_devolucion_esperada).toLocaleDateString('es-ES')}
                                </span>
                              </div>
                            </div>
                            <Badge 
                              variant={loan.estado === 'devuelto' ? "outline" : "default"}
                              className={cn(
                                loan.estado === 'activo' && "bg-blue-500 hover:bg-blue-500",
                                loan.estado === 'renovado' && "bg-purple-500 hover:bg-purple-500",
                                loan.estado === 'atrasado' && "bg-red-500 hover:bg-red-500",
                                loan.estado === 'perdido' && "bg-amber-500 hover:bg-amber-500"
                              )}
                            >
                              {loan.estado === 'activo' && "Activo"}
                              {loan.estado === 'renovado' && "Renovado"}
                              {loan.estado === 'atrasado' && "Atrasado"}
                              {loan.estado === 'devuelto' && "Devuelto"}
                              {loan.estado === 'perdido' && "Perdido"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No hay historial de préstamos para este libro
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </div>
);
}

export default function CatalogoPage() {
  const [isMounted, setIsMounted] = useState(false);

  // Evitar el error de hidratación usando useEffect para renderizar después de montado
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Si el componente no está montado, devolver un div vacío para evitar errores de hidratación
  if (!isMounted) {
    return <div className="min-h-screen"></div>;
  }

  return (
    <DashboardLayout>
      <CatalogoContent />
    </DashboardLayout>
  );
}