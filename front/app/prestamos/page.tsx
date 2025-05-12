"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/layout";
import { loanService, Loan, LoanData } from "@/services/loanService";
import { bookService, Book } from '@/services/bookService';
import { userService } from '@/services/userService';
import { useUser } from '@/context/user-context';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  RefreshCw,
  BookCheck,
  Undo,
  Clock,
  BookOpen,
  User,
  Calendar as CalendarIcon,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  Timer,
  CircleCheck,
  CircleDashed,
  AlertTriangle,
  CircleX,
  RotateCw,
  Building,
  MapPin,
  Map,
  Loader2,
  PlusCircle,
  Calculator,
  ExternalLink,
  ArrowLeft,
  BarChart,
  BookOpenCheck
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { format, addDays, isAfter, isBefore, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar"; 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Helper function to get status badge
const getStatusBadge = (status: string, renewalCount?: number) => {
  const styles: Record<string, string> = {
    activo: "bg-emerald-500 hover:bg-emerald-600 text-xs px-2 py-0.5",
    renovado: "bg-blue-500 hover:bg-blue-600 text-xs px-2 py-0.5",
    atrasado: "bg-amber-600 hover:bg-amber-700 text-xs px-2 py-0.5 font-medium",
    devuelto: "bg-slate-500 hover:bg-slate-600 text-xs px-2 py-0.5",
    perdido: "bg-rose-500 hover:bg-rose-600 text-xs px-2 py-0.5",
  };

  const icons: Record<string, JSX.Element> = {
    activo: <CircleDashed className="h-3 w-3 mr-1" />,
    renovado: <RotateCw className="h-3 w-3 mr-1" />,
    atrasado: <AlertTriangle className="h-3 w-3 mr-1" />,
    devuelto: <CircleCheck className="h-3 w-3 mr-1" />,
    perdido: <CircleX className="h-3 w-3 mr-1" />,
  };

  const labels: Record<string, string> = {
    activo: "Activo",
    renovado: "Renovado",
    atrasado: "Atrasado",
    devuelto: "Devuelto",
    perdido: "Perdido",
  };

  // Si el estado es renovado pero el contador es 0, asegurarse de mostrar al menos Renovación 1 de 2
  const displayRenewalCount = status === 'renovado' ? Math.max(1, renewalCount || 0) : renewalCount;

  return (
    <div className="flex flex-col gap-1">
      <Badge className={styles[status]}>
        <div className="flex items-center">
          {icons[status]}
          {labels[status]}
        </div>
      </Badge>
      {status === 'renovado' && (
        <span className="text-[10px] text-muted-foreground text-center mt-1">
          Renovación {displayRenewalCount} de 2
        </span>
      )}
    </div>
  );
};

// Helper function to get return type badge
const getReturnTypeBadge = (returnType: string | null) => {
  if (!returnType) return null;

  const styles: Record<string, string> = {
    en_plazo: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-700 dark:border-green-400 text-[10px] px-1.5 py-0.5",
    renovado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-700 dark:border-blue-400 text-[10px] px-1.5 py-0.5",
    atrasado: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-700 dark:border-amber-400 text-[10px] px-1.5 py-0.5",
  };

  const labels: Record<string, string> = {
    en_plazo: "En plazo",
    renovado: "Renovado",
    atrasado: "Atrasado",
  };

  return (
    <Badge variant="outline" className={styles[returnType]}>
      {labels[returnType]}
    </Badge>
  );
};

// Función para obtener el badge de campus
const getCampusBadge = (campus: string | undefined) => {
  if (!campus) return <span className="text-muted-foreground text-xs">Sin campus</span>;
  
  let bgColor = "";
  
  // Asignar color según el campus
  switch (campus.toLowerCase()) {
    case "otay":
      bgColor = "bg-purple-500 hover:bg-purple-600";
      break;
    case "tomas aquino":
      bgColor = "bg-teal-500 hover:bg-teal-600";
      break;
    default:
      bgColor = "bg-blue-500 hover:bg-blue-600";
  }
  
  return (
    <Badge className={`${bgColor} text-xs px-2 py-0.5`}>
      <div className="flex items-center">
        <MapPin className="h-3 w-3 mr-1" />
        {campus}
      </div>
    </Badge>
  );
};

// Interfaz para adaptar los datos de la API al formato esperado por la interfaz
interface UILoan {
  id: string | number;
  documentId?: string;
  formattedId?: string;
  book: string;
  bookId: string | number;
  user: string;
  userId?: string;
  userNumControl?: string;
  userCarrera?: string;
  loanDate: string;
  returnDate: string;
  status: string;
  renewalCount: number;
  actualReturnDate: string | null;
  returnType: string | null;
  campus_origen?: string;
  multa?: number;
  dias_atraso?: number;
  bookDocumentId?: string;
}

// Definir interfaz para el formato de fecha
interface FormattedDate {
  date: string;
  time?: string;
}

// Interfaces adicionales para manejar el inventario por campus
interface BookInventory {
  campus: string;
  cantidad: number;
}

interface BookWithInventory extends Book {
  inventario?: BookInventory[];
}

// Función para procesar inventarios de libros
const procesarInventarioDeLibros = (booksData: Book[]): BookWithInventory[] => {
  return booksData.map(book => {
    // Array para almacenar el inventario procesado
    const inventarioProcesado: BookInventory[] = [];
    
    // Objeto para agrupar por campus
    const inventarioPorCampus: Record<string, number> = {};
    
    // Procesar inventarios si existen como array
    if (book.inventories && Array.isArray(book.inventories)) {
      // Procesar cada registro de inventario
      book.inventories.forEach(inv => {
        if (inv && inv.Campus && inv.Cantidad !== undefined) {
          // Agrupar por campus sumando cantidades
          const campus = inv.Campus;
          inventarioPorCampus[campus] = (inventarioPorCampus[campus] || 0) + inv.Cantidad;
        }
      });
    }
    // Comprobar si hay un solo inventario en el formato antiguo
    else if (book.inventory && book.inventory.Campus && book.inventory.Cantidad !== undefined) {
      const campus = book.inventory.Campus;
      inventarioPorCampus[campus] = (inventarioPorCampus[campus] || 0) + book.inventory.Cantidad;
    }
    // Si no hay inventario pero hay un campus general, usar ese con cantidad 1 (caso por defecto)
    else if (book.campus) {
      inventarioPorCampus[book.campus] = 1; // valor por defecto
    }
    
    // Convertir el objeto agrupado a array
    Object.entries(inventarioPorCampus).forEach(([campus, cantidad]) => {
      inventarioProcesado.push({
        campus,
        cantidad
      });
    });
    
    console.log(`Libro ${book.titulo} - Inventario procesado:`, inventarioProcesado);
    
    // Devolver libro con el inventario procesado
    return {
      ...book,
      inventario: inventarioProcesado
    };
  });
};

// Agregar después de las interfaces existentes

interface FineDetails {
  amount: number;
  daysLate: number;
}

// Función para calcular multas
const calculateFine = (returnDate: string, actualReturnDate: string | null): FineDetails => {
  if (!actualReturnDate) {
    const today = new Date();
    const dueDate = new Date(returnDate);
    const daysLate = Math.max(0, Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    const amount = daysLate * 5; // $5 por día de atraso
    return {
      daysLate,
      amount
    };
  }

  const returnDateObj = new Date(actualReturnDate);
  const dueDate = new Date(returnDate);
  const daysLate = Math.max(0, Math.ceil((returnDateObj.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
  const amount = daysLate * 5; // $5 por día de atraso
  return {
    daysLate,
    amount
  };
};

// Componente GlowCard simplificado (inline)
function GlowCard({ children, onClick, ...props }: React.HTMLAttributes<HTMLDivElement> & { onClick?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    let angle = Math.atan2(mouseY, mouseX) * (180 / Math.PI);
    angle = (angle + 360) % 360;
    card.style.setProperty("--start", `${angle + 60}`);
  };

  // Añadir CSS para el efecto de brillo
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .glow-card {
        position: relative;
        border-radius: 0.5rem;
        overflow: hidden;
      }
      .glow-card::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -1;
        background: conic-gradient(
          from var(--start, 0deg) at 50% 50%,
          rgba(var(--card-rgb), 0.3) 0deg,
          transparent 60deg,
          transparent 300deg,
          rgba(var(--card-rgb), 0.3) 360deg
        );
        --card-rgb: 255, 255, 255;
        border-radius: inherit;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .glow-card:hover::after {
        opacity: 1;
      }
      
      @media (prefers-color-scheme: dark) {
        .glow-card::after {
          --card-rgb: 20, 20, 20;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Corregir el retorno para que sea compatible con EffectCallback
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="glow-card"
      onMouseMove={handleMouseMove}
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
      {...props}
    >
      {children}
    </div>
  );
}

// Componente esqueleto de préstamo para estados de carga
function LoanSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-lg border p-3 animate-pulse">
      <div className="bg-muted p-2 rounded-md">
        <div className="h-4 w-4"></div>
      </div>
      <div className="space-y-3 w-full">
        <div className="h-4 bg-muted rounded-md w-3/4"></div>
        <div className="h-3 bg-muted rounded-md w-2/4"></div>
      </div>
    </div>
  );
}

function PrestamosContent(): JSX.Element {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("todos");
  const [loans, setLoans] = useState<UILoan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<UILoan | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showReplacementDialog, setShowReplacementDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("recientes");
  const [loading, setLoading] = useState(true);
  const [isUpdatingFines, setIsUpdatingFines] = useState(false);
  const [displayCount, setDisplayCount] = useState(50); // Número de préstamos a mostrar
  
  // Estados para el modal de creación de préstamos
  const [isCreateLoanModalOpen, setIsCreateLoanModalOpen] = useState(false);
  const [newLoanBookId, setNewLoanBookId] = useState("");
  const [newLoanUserId, setNewLoanUserId] = useState("");
  const [newLoanDate, setNewLoanDate] = useState<Date>(new Date());
  const [newLoanReturnDate, setNewLoanReturnDate] = useState<Date>(addDays(new Date(), 14)); // 14 días por defecto
  const [newLoanCampus, setNewLoanCampus] = useState<string>("");
  const [newLoanNotes, setNewLoanNotes] = useState("");
  const [newLoanBookSearchTerm, setNewLoanBookSearchTerm] = useState("");
  const [newLoanUserSearchTerm, setNewLoanUserSearchTerm] = useState("");
  const [filteredNewLoanBooks, setFilteredNewLoanBooks] = useState<BookWithInventory[]>([]);
  const [filteredNewLoanUsers, setFilteredNewLoanUsers] = useState<any[]>([]);
  const [selectedNewLoanBook, setSelectedNewLoanBook] = useState<BookWithInventory | null>(null);
  const [selectedNewLoanUser, setSelectedNewLoanUser] = useState<any | null>(null);
  const [isCreatingLoan, setIsCreatingLoan] = useState(false);
  const [allBooks, setAllBooks] = useState<BookWithInventory[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [availableCampus, setAvailableCampus] = useState<BookInventory[]>([]);
  
  // Nuevos estados para la búsqueda paginada de libros
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);
  const [bookSearchPage, setBookSearchPage] = useState(1);
  const [hasMoreBooks, setHasMoreBooks] = useState(true);
  const [totalBooksFound, setTotalBooksFound] = useState(0);
  const BOOKS_PER_PAGE = 20;

  // Nuevos estados para la búsqueda paginada de usuarios
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userSearchPage, setUserSearchPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [totalUsersFound, setTotalUsersFound] = useState(0);
  const USERS_PER_PAGE = 20;
  
  // Nuevo estado para el modal de renovación
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [renewalDate, setRenewalDate] = useState<Date | null>(null);
  
  // Estado para el modal de tasa de devolución
  const [showTasaDevolucionModal, setShowTasaDevolucionModal] = useState(false);
  const [prestamosDevueltos, setPrestamosDevueltos] = useState<Loan[]>([]);
  const [isLoadingDevueltos, setIsLoadingDevueltos] = useState(false);
  const [selectedDevolucion, setSelectedDevolucion] = useState<Loan | null>(null);
  
  // Stats de tasa de devolución
  const [tasaDevolucionStats, setTasaDevolucionStats] = useState({
    porcentaje: 0,
    incremento: "0"
  });

  // Función para recargar los libros con inventario actualizado
  const recargarLibrosConInventario = async () => {
    try {
      const booksData = await bookService.getBooks();
      const booksWithInventory = procesarInventarioDeLibros(booksData.data);
      setAllBooks(booksWithInventory);
      setFilteredNewLoanBooks(booksWithInventory.slice(0, BOOKS_PER_PAGE));
      setTotalBooksFound(booksWithInventory.length);
      setBookSearchPage(1);
      setHasMoreBooks(booksWithInventory.length > BOOKS_PER_PAGE);
    } catch (error) {
      console.error("Error al recargar libros:", error);
    }
  };

  // Función para buscar libros con término de búsqueda
  const searchBooks = async (searchTerm: string, page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setIsSearchingBooks(true);
      }
      
      // Crear parámetros de búsqueda
      const params = new URLSearchParams();
      
      // Usando filtros específicos en lugar del parámetro genérico _q
      if (searchTerm) {
        // Buscar específicamente en título, autor e ID del libro
        params.append('filters[$or][0][titulo][$containsi]', searchTerm);
        params.append('filters[$or][1][autor][$containsi]', searchTerm);
        params.append('filters[$or][2][id_libro][$containsi]', searchTerm);
      }
      
      // Añadir parámetros de paginación
      params.append('pagination[page]', page.toString());
      params.append('pagination[pageSize]', BOOKS_PER_PAGE.toString());
      
      console.log(`Buscando libros con término: "${searchTerm}", página: ${page}`);
      
      // Usar el servicio bookService para buscar libros
      const response = await bookService.searchBooks(params.toString());
      
      if (!response || !response.data) {
        throw new Error("Respuesta inválida del servidor");
      }
      
      // Procesar los libros con inventario
      const booksWithInventory = procesarInventarioDeLibros(response.data);
      
      // Actualizar estado según si es append o no
      if (append) {
        setFilteredNewLoanBooks(prev => [...prev, ...booksWithInventory]);
      } else {
        setFilteredNewLoanBooks(booksWithInventory);
      }
      
      // Actualizar contador total y estado de "hay más"
      setTotalBooksFound(response.meta?.pagination?.total || booksWithInventory.length);
      setHasMoreBooks(booksWithInventory.length === BOOKS_PER_PAGE);
      
      return booksWithInventory;
    } catch (error) {
      console.error("Error al buscar libros:", error);
      toast({
        title: "Error",
        description: "No se pudieron buscar los libros",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsSearchingBooks(false);
    }
  };

  // Función para buscar usuarios con término de búsqueda
  const searchUsers = async (searchTerm: string, page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setIsSearchingUsers(true);
      }
      
      // Crear parámetros de búsqueda
      const params = new URLSearchParams();
      
      // Añadir término de búsqueda si existe
      if (searchTerm) {
        params.append('_q', searchTerm);
      }
      
      // Añadir parámetros de paginación
      params.append('_start', ((page - 1) * USERS_PER_PAGE).toString());
      params.append('_limit', USERS_PER_PAGE.toString());
      
      console.log(`Buscando usuarios con término: "${searchTerm}", página: ${page}`);
      
      // Usar el servicio userService para buscar usuarios
      const response = await userService.searchUsers(params.toString());
      
      // Actualizar estado según si es append o no
      if (append) {
        setFilteredNewLoanUsers(prev => [...prev, ...response]);
      } else {
        setFilteredNewLoanUsers(response);
      }
      
      // Actualizar contador total y estado de "hay más"
      setTotalUsersFound(response.length === USERS_PER_PAGE ? (page * USERS_PER_PAGE) + 1 : page * USERS_PER_PAGE);
      setHasMoreUsers(response.length === USERS_PER_PAGE);
      
      return response;
    } catch (error) {
      console.error("Error al buscar usuarios:", error);
      toast({
        title: "Error",
        description: "No se pudieron buscar los usuarios",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Manejadores de scroll sencillos que solo detectan cuando estamos cerca del final
  const handleBooksScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Solo cargar más cuando estemos cerca del final y no estemos ya cargando
    if (scrollHeight - scrollTop - clientHeight < 100 && !isSearchingBooks && hasMoreBooks) {
      const nextPage = bookSearchPage + 1;
      console.log("Cargando más libros por scroll en página", nextPage);
      searchBooks(newLoanBookSearchTerm, nextPage, true)
        .then(() => setBookSearchPage(nextPage));
    }
  };

  const handleUsersScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Solo cargar más cuando estemos cerca del final y no estemos ya cargando
    if (scrollHeight - scrollTop - clientHeight < 100 && !isSearchingUsers && hasMoreUsers) {
      const nextPage = userSearchPage + 1;
      console.log("Cargando más usuarios por scroll en página", nextPage);
      searchUsers(newLoanUserSearchTerm, nextPage, true)
        .then(() => setUserSearchPage(nextPage));
    }
  };

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        
        // Comprobar y actualizar préstamos atrasados
        try {
          const updatedCount = await loanService.checkOverdueLoans();
          if (updatedCount > 0) {
            console.log(`Se actualizaron ${updatedCount} préstamos a estado 'atrasado'`);
            // Eliminamos la notificación
            /*
            toast({
              title: "Préstamos actualizados",
              description: `Se actualizaron ${updatedCount} préstamos a estado 'atrasado'`,
            });
            */
          }
        } catch (error) {
          console.error("Error al verificar préstamos atrasados:", error);
        }
        
        // Cargar todos los préstamos
        const response = await loanService.getLoans();
        
        // Contar cuántos préstamos se actualizaron automáticamente
        // Esto lo sabremos porque cada préstamo actualizado tiene su estado marcado como "atrasado"
        let updatedAutomatically = 0;
        response.forEach(loan => {
          if (loan.estado === 'atrasado' && loan.multa !== undefined && loan.multa !== null && loan.dias_atraso) {
            updatedAutomatically++;
          }
        });
        
        // Transformar los datos de la API al formato esperado por la UI
        const transformedLoans: UILoan[] = response.map((loan: Loan) => {
          // Determinar tipo de devolución
          let returnType = null;
          if (loan.estado === 'devuelto' && loan.fecha_devolucion_real) {
            const dueDate = new Date(loan.fecha_devolucion_esperada);
            const actualReturn = new Date(loan.fecha_devolucion_real);
            
            if (actualReturn <= dueDate) {
              returnType = 'en_plazo';
            } else {
              returnType = 'atrasado';
            }
          } else if (loan.estado === 'renovado') {
            returnType = 'renovado';
          }
          
          return {
            id: loan.id,
            documentId: loan.documentId,
            formattedId: `LOAN-${new Date().getFullYear()}-${String(loan.id).padStart(3, '0')}`,
            book: loan.book.titulo,
            bookId: loan.book.id_libro,
            user: loan.usuario.username,
            userId: loan.usuario.id.toString(),
            userNumControl: loan.usuario.Numcontrol,
            userCarrera: loan.usuario.Carrera,
            loanDate: loan.fecha_prestamo,
            returnDate: loan.fecha_devolucion_esperada,
            status: loan.estado,
            renewalCount: loan.renewalCount || 0,
            actualReturnDate: loan.fecha_devolucion_real,
            returnType,
            campus_origen: loan.campus_origen,
            multa: loan.multa || 0,
            dias_atraso: loan.dias_atraso || 0,
            bookDocumentId: loan.book.documentId
          };
        });
        
        setLoans(transformedLoans);

        // Iniciar búsqueda de libros y usuarios al abrir el modal por primera vez
        // (después se manejará con los efectos)
        searchBooks("");
        searchUsers("");
        
      } catch (error) {
        console.error("Error al cargar préstamos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los préstamos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchLoans();

    // Configurar un intervalo para actualizar las multas cada 30 minutos
    const intervalId = setInterval(async () => {
      console.log("Actualizando multas periódicamente...");
      try {
        // Obtener préstamos frescos con multas actualizadas
        const freshLoans = await loanService.getLoans();
        
        // Transformar los préstamos al formato de UI
        const transformedLoans: UILoan[] = freshLoans.map((loan: Loan) => {
          // Determinar tipo de devolución
          let returnType = null;
          if (loan.estado === 'devuelto' && loan.fecha_devolucion_real) {
            const dueDate = new Date(loan.fecha_devolucion_esperada);
            const actualReturn = new Date(loan.fecha_devolucion_real);
            
            if (actualReturn <= dueDate) {
              returnType = 'en_plazo';
            } else {
              returnType = 'atrasado';
            }
          } else if (loan.estado === 'renovado') {
            returnType = 'renovado';
          }
          
          return {
            id: loan.id,
            documentId: loan.documentId,
            formattedId: `LOAN-${new Date().getFullYear()}-${String(loan.id).padStart(3, '0')}`,
            book: loan.book.titulo,
            bookId: loan.book.id_libro,
            user: loan.usuario.username,
            userId: loan.usuario.id.toString(),
            userNumControl: loan.usuario.Numcontrol,
            userCarrera: loan.usuario.Carrera,
            loanDate: loan.fecha_prestamo,
            returnDate: loan.fecha_devolucion_esperada,
            status: loan.estado,
            renewalCount: loan.renewalCount || 0,
            actualReturnDate: loan.fecha_devolucion_real,
            returnType,
            campus_origen: loan.campus_origen,
            multa: loan.multa || 0,
            dias_atraso: loan.dias_atraso || 0,
            bookDocumentId: loan.book.documentId
          };
        });
        
        setLoans(transformedLoans);
      } catch (error) {
        console.error("Error al actualizar multas periódicamente:", error);
      }
    }, 30 * 60 * 1000); // 30 minutos
    
    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, [toast]);

  // Efecto para ejecutar búsqueda de libros cuando cambia el término
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (isCreateLoanModalOpen) {
        setBookSearchPage(1);
        searchBooks(newLoanBookSearchTerm);
      }
    }, 500); // Retraso de 500ms para evitar demasiadas búsquedas mientras se escribe
    
    return () => clearTimeout(delaySearch);
  }, [newLoanBookSearchTerm, isCreateLoanModalOpen]);

  // Efecto para ejecutar búsqueda de usuarios cuando cambia el término
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (isCreateLoanModalOpen) {
        setUserSearchPage(1);
        searchUsers(newLoanUserSearchTerm);
      }
    }, 500); // Retraso de 500ms para evitar demasiadas búsquedas mientras se escribe
    
    return () => clearTimeout(delaySearch);
  }, [newLoanUserSearchTerm, isCreateLoanModalOpen]);

  // Reiniciar búsquedas cuando se abre el modal
  useEffect(() => {
    if (isCreateLoanModalOpen) {
      setNewLoanBookSearchTerm("");
      setNewLoanUserSearchTerm("");
      setBookSearchPage(1);
      setUserSearchPage(1);
      searchBooks("");
      searchUsers("");
    }
  }, [isCreateLoanModalOpen]);

  const handleNewLoanBookSelect = (book: BookWithInventory) => {
    setSelectedNewLoanBook(book);
    setNewLoanBookId(book.id.toString());
    
    // Actualizar los campus disponibles para este libro
    if (book.inventario && book.inventario.length > 0) {
      // Filtrar solo campus con disponibilidad mayor a 0
      const campusDisponibles = book.inventario.filter(inv => inv.cantidad > 0);
      
      console.log("Campus disponibles para este libro:", campusDisponibles);
      
      setAvailableCampus(campusDisponibles);
      
      // Si hay campus disponibles, seleccionar el primero por defecto
      if (campusDisponibles.length > 0) {
        setNewLoanCampus(campusDisponibles[0].campus);
      } else {
        setNewLoanCampus("");
        toast({
          title: "Libro sin disponibilidad",
          description: "Este libro no tiene ejemplares disponibles en ningún campus",
          variant: "destructive",
        });
      }
    } else {
      console.log("El libro no tiene información de inventario por campus");
      setAvailableCampus([]);
      setNewLoanCampus("");
    }
  };

  const handleNewLoanUserSelect = (user: any) => {
    setSelectedNewLoanUser(user);
    setNewLoanUserId(user.id.toString());
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedNewLoanBook || !selectedNewLoanUser || !newLoanCampus) {
      toast({
        title: "Error",
        description: "Por favor selecciona un libro, un usuario y un campus",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCreatingLoan(true);
      
      // Registrar información detallada del libro seleccionado para depuración
      console.log("INFORMACIÓN DETALLADA DEL LIBRO SELECCIONADO:", {
        id: selectedNewLoanBook.id,
        documentId: selectedNewLoanBook.documentId,
        id_libro: selectedNewLoanBook.id_libro,
        titulo: selectedNewLoanBook.titulo,
        campus: selectedNewLoanBook.campus,
        inventory: selectedNewLoanBook.inventory,
        inventories: selectedNewLoanBook.inventories,
        inventario: selectedNewLoanBook.inventario
      });
      
      // Determinar qué identificador usar (preferir documentId si existe)
      const bookId = selectedNewLoanBook.documentId || selectedNewLoanBook.id;
      
      // Preparar datos para el servicio
      const loanData = {
        book: bookId, // Usar el identificador apropiado
        usuario: selectedNewLoanUser.id,
        fecha_prestamo: newLoanDate.toISOString(),
        fecha_devolucion_esperada: newLoanReturnDate.toISOString(),
        estado: "activo" as "activo",
        notas: newLoanNotes,
        campus_origen: newLoanCampus
      };
      
      console.log("Datos de préstamo a crear (con ID de libro ajustado):", loanData);
      
      // Crear el préstamo
      const responseData = await loanService.createLoan(loanData);
      console.log("Préstamo creado con respuesta:", responseData);
      
      // El inventario ya se actualiza dentro de loanService.createLoan()
      // No es necesario actualizarlo nuevamente aquí
      
      toast({
        title: "Préstamo creado",
        description: "El préstamo se ha registrado correctamente",
      });
      
      // Cerrar el modal y resetear el formulario
      setIsCreateLoanModalOpen(false);
      setSelectedNewLoanBook(null);
      setSelectedNewLoanUser(null);
      setNewLoanBookId("");
      setNewLoanUserId("");
      setNewLoanBookSearchTerm("");
      setNewLoanUserSearchTerm("");
      setNewLoanDate(new Date());
      setNewLoanReturnDate(addDays(new Date(), 14));
      setNewLoanCampus("");
      setNewLoanNotes("");
      setAvailableCampus([]);
      
      // Actualizar la lista de préstamos y estados para reflejar el cambio de inventario
      try {
        // Recargar los libros para reflejar el cambio en el inventario
        await recargarLibrosConInventario();
      } catch (error) {
        console.error("Error al recargar libros después de actualizar inventario:", error);
      }
      
      // Actualizar la lista de préstamos
      const response = await loanService.getLoans();
      
      // Inicializar un array vacío para los préstamos transformados
      const transformedLoans: UILoan[] = [];
      
      // Transformar los datos de la API al formato esperado por la UI
      response.forEach((loan: Loan) => {
        // Determinar tipo de devolución
        let returnType = null;
        if (loan.estado === 'devuelto' && loan.fecha_devolucion_real) {
          const dueDate = new Date(loan.fecha_devolucion_esperada);
          const actualReturn = new Date(loan.fecha_devolucion_real);
          
          if (actualReturn <= dueDate) {
            returnType = 'en_plazo';
          } else {
            returnType = 'atrasado';
          }
        } else if (loan.estado === 'renovado') {
          returnType = 'renovado';
        }
        
        transformedLoans.push({
          id: loan.id,
          documentId: loan.documentId,
          formattedId: `#${loan.id}`,
          book: loan.book?.titulo || 'Sin título',
          bookId: loan.book?.id_libro || loan.book?.id || '',
          user: loan.usuario?.username || 'Sin usuario',
          userId: loan.usuario?.id?.toString(),
          userNumControl: loan.usuario?.Numcontrol || '',
          userCarrera: loan.usuario?.Carrera,
          loanDate: loan.fecha_prestamo,
          returnDate: loan.fecha_devolucion_esperada,
          status: loan.estado,
          renewalCount: 1, // Por ahora hardcodeado a 1
          actualReturnDate: loan.fecha_devolucion_real,
          returnType,
          campus_origen: loan.campus_origen,
          multa: loan.multa || 0,
          dias_atraso: loan.dias_atraso || 0,
          bookDocumentId: loan.book.documentId
        });
      });
      
      setLoans(transformedLoans);
      
    } catch (error) {
      console.error("Error al crear préstamo:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el préstamo",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLoan(false);
    }
  };

  // Filter and sort loans
  const filteredLoans = loans
    .filter(loan => {
      // Filter by tab
      if (activeTab !== "todos" && loan.status !== activeTab) {
        return false;
      }
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          loan.book.toLowerCase().includes(searchLower) ||
          loan.user.toLowerCase().includes(searchLower) ||
          loan.id.toString().includes(searchLower) ||
          (loan.campus_origen && loan.campus_origen.toLowerCase().includes(searchLower)) ||
          (loan.userNumControl && loan.userNumControl.toLowerCase().includes(searchLower)) ||
          (loan.userCarrera && loan.userCarrera.toLowerCase().includes(searchLower))
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by date
      if (sortOrder === "recientes") {
          return new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime();
      } else {
          return new Date(a.loanDate).getTime() - new Date(b.loanDate).getTime();
      }
    });

  const formatDate = (date: string, includeTime: boolean = false): FormattedDate => {
    if (!date) return { date: "N/A" };
    
    try {
      const dateObj = parseISO(date);
      if (includeTime) {
        // Para formato con hora (hh:mm a) - formato 12 horas
        return {
          date: format(dateObj, "dd MMM yyyy", { locale: es }),
          time: format(dateObj, "hh:mm a", { locale: es }).toLowerCase()
        };
      } else {
        // Solo fecha
        return {
          date: format(dateObj, "dd MMM yyyy", { locale: es })
        };
      }
    } catch (e) {
      console.error("Error formatting date:", e);
      return { date };
    }
  };

  const determineReturnType = (loan: UILoan) => {
    if (loan.status !== "devuelto" || !loan.actualReturnDate) {
      return null;
    }

    const dueDate = new Date(loan.returnDate);
    const returnDate = new Date(loan.actualReturnDate);

    if (returnDate <= dueDate) {
      return "en_plazo";
    } else {
      return "atrasado";
    }
  };

  const handleRenewal = async (loan: UILoan) => {
    try {
      // Verificar si ya alcanzó el límite de renovaciones
      if (loan.renewalCount >= 2) {
        toast({
          title: "Límite de renovaciones alcanzado",
          description: "No se pueden realizar más de 2 renovaciones por préstamo",
          variant: "destructive",
        });
        return;
      }

      // Calcular nueva fecha de devolución (14 días a partir de hoy)
      const newDueDate = addDays(new Date(), 14);
      setRenewalDate(newDueDate);
      setSelectedLoan(loan);
      setShowRenewalDialog(true);
    } catch (error) {
      console.error("Error al preparar renovación:", error);
      toast({
        title: "Error",
        description: "No se pudo preparar la renovación del préstamo",
        variant: "destructive",
      });
    }
  };

  const confirmRenewal = async () => {
    if (!selectedLoan || !renewalDate) return;

    try {
      // Verificar nuevamente el límite de renovaciones
      if (selectedLoan.renewalCount >= 2) {
        toast({
          title: "Límite de renovaciones alcanzado",
          description: "No se pueden realizar más de 2 renovaciones por préstamo",
          variant: "destructive",
        });
        return;
      }

      const response = await loanService.renewLoan(selectedLoan.id, renewalDate.toISOString().split('T')[0], selectedLoan.documentId);
      
      // Obtener el valor actualizado de renewalCount desde la respuesta (o usar el valor incrementado)
      const updatedRenewalCount = response?.data?.attributes?.renewalCount || selectedLoan.renewalCount + 1;
      
      toast({
        title: "Préstamo renovado",
        description: `El préstamo ha sido renovado exitosamente (Renovación ${updatedRenewalCount} de 2)`,
      });
      
      // Actualizar la lista de préstamos
      setLoans(loans.map(l => 
        l.id === selectedLoan.id 
          ? { 
              ...l, 
              status: "renovado", 
              returnDate: renewalDate.toISOString(),
              renewalCount: updatedRenewalCount 
            } 
          : l
      ));

      setShowRenewalDialog(false);
      setRenewalDate(null);
    } catch (error) {
      console.error("Error al renovar préstamo:", error);
      toast({
        title: "Error",
        description: "No se pudo renovar el préstamo",
        variant: "destructive",
      });
    }
  };

  const handleReturn = async (loan: UILoan) => {
    try {
      // Marcar el préstamo como devuelto con multa y días en cero
      const returnData = {
        estado: 'devuelto' as 'devuelto',
        fecha_devolucion_real: new Date().toISOString(),
        multa: 0,
        dias_atraso: 0
      };
      
      // Actualizar el préstamo con los valores en cero
      await loanService.updateLoan(loan.id, returnData, loan.documentId);
      
      const today = new Date().toISOString();
      const returnType = determineReturnType({
        ...loan,
        status: "devuelto",
        actualReturnDate: today
      });
      
      // Incrementar el inventario al devolver el libro
      try {
        console.log("Incrementando inventario después de devolución de libro...");
        
        // IMPORTANTE: Usar el ID del libro, no el ID del préstamo
        // Acceder a bookDocumentId de manera segura y convertir a string
        const bookIdToUse: string = (loan.bookDocumentId || String(loan.bookId) || '');
        const campus = loan.campus_origen || '';
        
        console.log("Datos para actualizar inventario:", {
          bookId: bookIdToUse,
          campus,
          loanDetails: {
            id: loan.id,
            book: loan.book,
            status: loan.status
          }
        });
        
        if (bookIdToUse && campus) {
          // Llamar a bookService para incrementar el inventario (+1)
          await bookService.updateBookInventory(bookIdToUse, campus, 1);
          console.log(`Inventario incrementado correctamente para libro ${loan.book} en campus ${campus}`);
        } else {
          console.error("No se pudo incrementar inventario: falta documentId o campus", {
            bookId: bookIdToUse,
            campus,
            loanId: loan.id
          });
        }
      } catch (inventoryError) {
        console.error("Error al incrementar inventario:", inventoryError);
        toast({
          title: "Advertencia",
          description: "El préstamo fue marcado como devuelto pero hubo un error al actualizar el inventario",
          variant: "destructive",
        });
      }
      
      // Recargar los libros para reflejar el cambio en el inventario
      await recargarLibrosConInventario();
      
      // Mostrar mensaje de devolución exitosa (sin multa)
      toast({
        title: "Préstamo devuelto",
        description: "El libro ha sido marcado como devuelto y el inventario actualizado",
      });
      
      // Actualizar la lista de préstamos con multa en cero
      setLoans(loans.map(l => 
        l.id === loan.id 
          ? { 
              ...l,
              status: "devuelto",
              actualReturnDate: today,
              returnType,
              multa: 0,
              dias_atraso: 0
            } 
          : l
      ));
    } catch (error) {
      console.error("Error al devolver préstamo:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la devolución del libro",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (loan: UILoan) => {
    try {
      // Restaurar préstamo (cambiarlo de perdido a activo)
      const updateData: Partial<LoanData> = {
        estado: 'activo' as 'activo',
        fecha_devolucion_real: null
      };
      
      await loanService.updateLoan(loan.id, updateData, loan.documentId);
      
      toast({
        title: "Préstamo restaurado",
        description: "El préstamo ha sido restaurado a estado activo",
      });
      
      // Actualizar la lista de préstamos
      setLoans(loans.map(l => 
        l.id === loan.id 
          ? { 
          ...l,
              status: "activo", 
              actualReturnDate: null,
              returnType: null
            } 
          : l
      ));
    } catch (error) {
      console.error("Error al restaurar préstamo:", error);
      toast({
        title: "Error",
        description: "No se pudo restaurar el préstamo",
        variant: "destructive",
      });
    }
  };

  const handleReplacement = async (loan: UILoan) => {
    try {
      await loanService.markAsLost(loan.id, loan.documentId);
      
      // No actualizamos el inventario al marcar como perdido, ya que se considera
      // una pérdida real del inventario
      
      toast({
        title: "Libro marcado como perdido",
        description: "El libro ha sido marcado como perdido exitosamente",
      });
      
      // Actualizar la lista de préstamos
      setLoans(loans.map(l => 
        l.id === loan.id 
          ? { 
          ...l,
              status: "perdido"
            } 
          : l
      ));
      
    setShowReplacementDialog(false);
    } catch (error) {
      console.error("Error al marcar como perdido:", error);
    toast({
        title: "Error",
        description: "No se pudo marcar el libro como perdido",
        variant: "destructive",
    });
    }
  };

  const renderDateInfo = (loan: UILoan) => {
    const formattedDate = formatDate(loan.loanDate, true);
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span>{formattedDate.date}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formattedDate.time}</span>
        </div>
      </div>
    );
  };

  const renderReturnDateInfo = (loan: UILoan) => {
    // Calcular días de atraso y multa para préstamos atrasados si no tienen valores
    let displayMulta = loan.multa;
    let displayDiasAtraso = loan.dias_atraso;
    
    // Para préstamos atrasados sin multa calculada, mostrar la multa estimada
    if (loan.status === "atrasado" && (!displayMulta || displayMulta === 0)) {
      const today = new Date();
      const dueDate = new Date(loan.returnDate);
      
      if (dueDate < today) {
        const diffTime = Math.abs(today.getTime() - dueDate.getTime());
        displayDiasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        displayMulta = displayDiasAtraso * 5; // $5 por día de atraso
      }
    }
    
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {loan.status === "devuelto" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {loan.status === "activo" && <CalendarClock className="h-4 w-4 text-blue-500" />}
          {loan.status === "atrasado" && <CalendarX className="h-4 w-4 text-amber-500" />}
          {loan.status === "perdido" && <Timer className="h-4 w-4 text-rose-500" />}
          <span>
            {loan.status === "devuelto" 
              ? formatDate(loan.actualReturnDate || "").date
              : formatDate(loan.returnDate).date}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {loan.status === "devuelto" && loan.actualReturnDate && (
            <>
              <Clock className="h-3 w-3" />
              <span>Devuelto: {formatDate(loan.actualReturnDate, true).time}</span>
            </>
          )}
          {loan.status === "activo" && <span>Fecha límite de entrega</span>}
          {loan.status === "atrasado" && (
            <span className="text-amber-500 font-medium">
              Vencido desde {formatDate(loan.returnDate).date}
            </span>
          )}
          {loan.status === "perdido" && <span className="text-rose-500">No devuelto</span>}
        </div>
        {/* Mostrar multa usando datos del backend o calculados */}
        {loan.status === "atrasado" && displayMulta && displayMulta > 0 && (
          <div className="mt-1 text-xs">
            <Badge variant="destructive" className="bg-rose-500">
              Multa actual: ${displayMulta} ({displayDiasAtraso} días de atraso)
            </Badge>
          </div>
        )}
        {loan.status === "devuelto" && loan.multa && loan.multa > 0 && (
          <div className="mt-1 text-xs">
            <Badge variant="destructive" className="bg-rose-500">
              Multa aplicada: ${loan.multa} ({loan.dias_atraso} días de atraso)
            </Badge>
          </div>
        )}
      </div>
    );
  };

  const renderActionMenu = (loan: UILoan) => {
    return (
      <>
          {/* Ver detalles - Disponible para todos los estados */}
          <DropdownMenuItem onClick={() => {
            setSelectedLoan(loan);
            setShowDetailsDialog(true);
          }}>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalles
          </DropdownMenuItem>
          
        {/* Renovar préstamo - Para activo y renovado (si no alcanzó el límite) */}
        {(loan.status === "activo" || (loan.status === "renovado" && loan.renewalCount < 2)) && (
            <DropdownMenuItem onClick={() => handleRenewal(loan)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Renovar préstamo
            </DropdownMenuItem>
          )}
          
          {/* Marcar como devuelto - Para activo, renovado y atrasado */}
          {["activo", "renovado", "atrasado"].includes(loan.status) && (
            <DropdownMenuItem onClick={() => handleReturn(loan)}>
              <BookCheck className="mr-2 h-4 w-4" />
              Marcar como devuelto
            </DropdownMenuItem>
          )}
          
        {/* Marcar como perdido - Para activo, renovado o atrasado */}
        {["activo", "renovado", "atrasado"].includes(loan.status) && (
            <>
              <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-rose-500 dark:text-rose-400"
              onClick={() => {
                setSelectedLoan(loan);
                setShowReplacementDialog(true);
              }}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Marcar como perdido
            </DropdownMenuItem>
          </>
        )}
        
        {/* Acciones para perdido */}
        {loan.status === "perdido" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleRestore(loan)}>
                <Undo className="mr-2 h-4 w-4" />
                Restaurar a devuelto
              </DropdownMenuItem>
            </>
          )}
      </>
    );
  };

  // Función para calcular y sincronizar todas las multas (ahora solo como respaldo)
  const calculateAllFines = async () => {
    try {
      setIsUpdatingFines(true);
      
      toast({
        title: "Actualizando multas",
        description: "Calculando multas para préstamos atrasados...",
      });
      
      // Obtener préstamos frescos con multas actualizadas
      const freshLoans = await loanService.getLoans();
      
      // Contar cuántos préstamos se actualizaron
      let updatedCount = 0;
      freshLoans.forEach(loan => {
        if (loan.estado === 'atrasado' && loan.multa && loan.dias_atraso) {
          updatedCount++;
        }
      });
      
      if (updatedCount === 0) {
        toast({
          title: "Sin préstamos atrasados",
          description: "No hay préstamos atrasados que requieran cálculo de multa",
        });
        return;
      }
      
      // Transformar los préstamos al formato de UI
      const transformedLoans: UILoan[] = freshLoans.map((loan: Loan) => {
        // Determinar tipo de devolución
        let returnType = null;
        if (loan.estado === 'devuelto' && loan.fecha_devolucion_real) {
          const dueDate = new Date(loan.fecha_devolucion_esperada);
          const actualReturn = new Date(loan.fecha_devolucion_real);
          
          if (actualReturn <= dueDate) {
            returnType = 'en_plazo';
          } else {
            returnType = 'atrasado';
          }
        } else if (loan.estado === 'renovado') {
          returnType = 'renovado';
        }
        
        return {
          id: loan.id,
          documentId: loan.documentId,
          formattedId: `LOAN-${new Date().getFullYear()}-${String(loan.id).padStart(3, '0')}`,
          book: loan.book.titulo,
          bookId: loan.book.id_libro,
          user: loan.usuario.username,
          userId: loan.usuario.id.toString(),
          userNumControl: loan.usuario.Numcontrol,
          userCarrera: loan.usuario.Carrera,
          loanDate: loan.fecha_prestamo,
          returnDate: loan.fecha_devolucion_esperada,
          status: loan.estado,
          renewalCount: loan.renewalCount || 0,
          actualReturnDate: loan.fecha_devolucion_real,
          returnType,
          campus_origen: loan.campus_origen,
          multa: loan.multa || 0,
          dias_atraso: loan.dias_atraso || 0,
          bookDocumentId: loan.book.documentId
        };
      });
      
      setLoans(transformedLoans);
      
      toast({
        title: "Multas actualizadas",
        description: `Se actualizaron las multas de ${updatedCount} préstamos`,
      });
      
    } catch (error) {
      console.error("Error al calcular multas:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar las multas",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingFines(false);
    }
  };

  // Función para cargar préstamos devueltos
  const loadPrestamosDevueltos = async () => {
    try {
      setIsLoadingDevueltos(true);
      
      // Obtener préstamos desde el servicio
      const loans = await loanService.getLoans();
      
      // Calcular la tasa de devolución
      const totalPrestamos = loans.length;
      const prestamosDevueltos = loans.filter(loan => loan.estado === 'devuelto').length;
      const tasaDevolucion = totalPrestamos > 0 
        ? Math.round((prestamosDevueltos / totalPrestamos) * 100) 
        : 0;
        
      // Calcular incremento (simplificado)
      const mesActual = new Date().getMonth();
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
      
      const prestamosDevueltosMesAnterior = loans.filter(loan => {
        const fechaDevolucion = new Date(loan.fecha_devolucion_real || loan.updatedAt);
        return fechaDevolucion.getMonth() === mesAnterior && loan.estado === 'devuelto';
      }).length;
      
      const prestamosTotalesMesAnterior = loans.filter(loan => {
        const fechaPrestamo = new Date(loan.fecha_prestamo);
        return fechaPrestamo.getMonth() === mesAnterior;
      }).length;
      
      const tasaDevolucionMesAnterior = prestamosTotalesMesAnterior > 0 
        ? Math.round((prestamosDevueltosMesAnterior / prestamosTotalesMesAnterior) * 100) 
        : 0;
        
      const incrementoTasaDevolucion = tasaDevolucionMesAnterior > 0 
        ? tasaDevolucion - tasaDevolucionMesAnterior
        : 0;
        
      setTasaDevolucionStats({
        porcentaje: tasaDevolucion,
        incremento: `${incrementoTasaDevolucion}`
      });
      
      // Filtrar solo los préstamos devueltos
      const devueltosLoans = loans.filter(loan => loan.estado === 'devuelto');
      
      // Ordenar por fecha de devolución, más recientes primero
      devueltosLoans.sort((a, b) => {
        const fechaA = a.fecha_devolucion_real ? new Date(a.fecha_devolucion_real).getTime() : 0;
        const fechaB = b.fecha_devolucion_real ? new Date(b.fecha_devolucion_real).getTime() : 0;
        return fechaB - fechaA;
      });
      
      setPrestamosDevueltos(devueltosLoans);
      setShowTasaDevolucionModal(true);
    } catch (error) {
      console.error("Error al cargar préstamos devueltos:", error);
    } finally {
      setIsLoadingDevueltos(false);
    }
  };
  
  // Función para ver detalles de un préstamo devuelto
  const showDevolucionDetails = (loan: Loan) => {
    setSelectedDevolucion(loan);
  };
  
  // Función para volver a la lista de préstamos devueltos
  const clearSelectedDevolucion = () => {
    setSelectedDevolucion(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Préstamos</h2>
            <p className="text-muted-foreground">
              Cargando préstamos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Préstamos</h2>
          <p className="text-muted-foreground">
            Gestiona los préstamos de libros activos y pasados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por libro, usuario, numcontrol, carrera..." 
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setIsCreateLoanModalOpen(true)}
            title="Crear nuevo préstamo"
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
          {activeTab === "atrasado" && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={calculateAllFines}
              disabled={isUpdatingFines}
              title="Actualizar multas"
            >
              {isUpdatingFines ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="activo">Activos</TabsTrigger>
            <TabsTrigger value="renovado">Renovados</TabsTrigger>
            <TabsTrigger value="atrasado">Atrasados</TabsTrigger>
            <TabsTrigger value="devuelto">Devueltos</TabsTrigger>
            <TabsTrigger value="perdido">Perdidos</TabsTrigger>
        </TabsList>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={sortOrder === "recientes" ? "text-primary" : ""}
              onClick={() => setSortOrder("recientes")}
            >
              Más recientes
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className={sortOrder === "antiguos" ? "text-primary" : ""}
              onClick={() => setSortOrder("antiguos")}
            >
              Más antiguos
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab || "todos"} className="mt-6">
          {filteredLoans.length === 0 ? (
            <div className="rounded-lg border bg-card text-card-foreground p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No hay préstamos</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {activeTab === "todos"
                  ? "No se encontraron préstamos en el sistema."
                  : `No hay préstamos con estado "${activeTab}" en este momento.`}
              </p>
              <Button 
                className="mt-6"
                onClick={() => setIsCreateLoanModalOpen(true)}
              >
                Crear nuevo préstamo
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Libro</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Campus del libro</TableHead>
                  <TableHead>Fecha préstamo</TableHead>
                  <TableHead>Fecha devolución</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans
                  .map((loan) => (
                    <TableRow 
                      key={loan.id}
                      className={cn(
                        loan.status === "atrasado" && "bg-rose-50 dark:bg-rose-900/10",
                        "transition-colors hover:bg-muted/50"
                      )}
                    >
                      <TableCell className="font-medium">{loan.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{loan.book}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p>{loan.user}</p>
                            <p className="text-xs text-muted-foreground">{loan.userNumControl}</p>
                            {loan.userCarrera && (
                              <p className="text-xs text-muted-foreground">
                                Carrera: {loan.userCarrera}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getCampusBadge(loan.campus_origen)}
                        </div>
                      </TableCell>
                      <TableCell>{renderDateInfo(loan)}</TableCell>
                      <TableCell>{renderReturnDateInfo(loan)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(loan.status, loan.renewalCount)}
                          {loan.status === "devuelto" && loan.returnType && getReturnTypeBadge(loan.returnType)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                          {renderActionMenu(loan)}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedLoan && (
        <>
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="sm:max-w-md">
          <DialogHeader>
                <DialogTitle>Detalles del préstamo</DialogTitle>
                <DialogDescription>
                  Información completa del préstamo seleccionado
                </DialogDescription>
          </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">{selectedLoan.book}</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  ID del préstamo: {selectedLoan.id}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">
                      ID del libro
                    </h4>
                    <p className="text-xs">{selectedLoan.bookId}</p>
                </div>
                <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">
                      Estado
                    </h4>
                    <div>{getStatusBadge(selectedLoan.status, selectedLoan.renewalCount)}</div>
                  </div>
                </div>

                {selectedLoan.campus_origen && (
              <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">
                      Campus del libro
                    </h4>
                    <div className="flex items-center gap-2">
                      {getCampusBadge(selectedLoan.campus_origen)}
              </div>
              </div>
                )}

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">
                    Usuario
                  </h4>
                  <div className="flex flex-col">
                    <p className="text-xs font-medium">{selectedLoan.user}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Numcontrol: {selectedLoan.userNumControl}
                    </p>
                    {selectedLoan.userCarrera && (
                      <p className="text-[10px] text-muted-foreground">
                        Carrera: {selectedLoan.userCarrera}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">
                      Fecha de préstamo
                    </h4>
                    <p className="text-xs">
                      {formatDate(selectedLoan.loanDate, true).date}
                    </p>
              </div>
                <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">
                      Fecha devolución
                    </h4>
                    <p className="text-xs">
                      {formatDate(selectedLoan.returnDate).date}
                    </p>
                  </div>
                </div>

                {selectedLoan.status === "devuelto" && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">
                      Devuelto
                    </h4>
                    <div className="flex items-center gap-2">
                      <p className="text-xs">
                        {formatDate(selectedLoan.actualReturnDate || "", true).date}
                      </p>
                      {selectedLoan.returnType && (
                        <div>{getReturnTypeBadge(selectedLoan.returnType)}</div>
                      )}
                    </div>
                </div>
              )}

                {/* Mostrar información de multa si corresponde */}
                {(selectedLoan.status === "atrasado" || (selectedLoan.status === "devuelto" && selectedLoan.multa && selectedLoan.multa > 0)) && (
                  <div className="border rounded-md p-2 bg-rose-50 dark:bg-rose-900/10">
                    <h4 className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">
                      Información de multa
                    </h4>
                    <div className="space-y-1">
                      <p className="text-xs">
                        <span className="font-medium">Días:</span> {selectedLoan.dias_atraso || 0}
                      </p>
                      <p className="text-xs">
                        <span className="font-medium">Monto:</span> ${selectedLoan.dias_atraso ? selectedLoan.dias_atraso * 5 : selectedLoan.multa || 0} MXN
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {selectedLoan.status === "atrasado" 
                          ? "La multa se incrementará hasta que se devuelva" 
                          : "Multa aplicada en la devolución"}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Cerrar
            </Button>
            {["activo", "renovado", "atrasado"].includes(selectedLoan.status) && (
              <Button onClick={() => handleReturn(selectedLoan)}>
                <BookCheck className="mr-2 h-4 w-4" />
                Marcar devuelto
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

          <AlertDialog
            open={showReplacementDialog}
            onOpenChange={setShowReplacementDialog}
          >
        <AlertDialogContent>
          <AlertDialogHeader>
                <AlertDialogTitle>Marcar libro como perdido</AlertDialogTitle>
            <AlertDialogDescription>
                  ¿Estás seguro de que deseas marcar este libro como perdido?
                  Esto afectará el inventario de la biblioteca.
            </AlertDialogDescription>
          </AlertDialogHeader>
              <div className="bg-muted rounded-md p-3 text-sm">
                <div className="flex flex-col gap-1">
                  <p>
                    <span className="font-medium">Libro:</span> {selectedLoan.book}
                  </p>
                  <p>
                    <span className="font-medium">Usuario:</span> {selectedLoan.user}
                  </p>
                  <p>
                    <span className="font-medium">Prestado:</span> {formatDate(selectedLoan.loanDate).date}
                  </p>
              </div>
              </div>
          <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
                  className="bg-rose-600 text-white hover:bg-rose-700"
                  onClick={() => handleReplacement(selectedLoan)}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </>
      )}

      {/* Modal para creación de préstamos */}
      <Dialog open={isCreateLoanModalOpen} onOpenChange={setIsCreateLoanModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Préstamo</DialogTitle>
            <DialogDescription>
              Registra un nuevo préstamo de libro
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateLoan} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Selección de libro */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bookSearch">Buscar Libro</Label>
                  <Input
                    id="bookSearch"
                    placeholder="Buscar por título, autor o ID..."
                    value={newLoanBookSearchTerm}
                    onChange={e => setNewLoanBookSearchTerm(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div 
                  className="border rounded-md max-h-[300px] overflow-y-auto"
                  onScroll={handleBooksScroll}
                >
                  {isSearchingBooks ? (
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredNewLoanBooks.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No se encontraron libros
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredNewLoanBooks.map(book => (
                        <div 
                          key={book.id}
                          className={`p-3 cursor-pointer transition-colors hover:bg-muted ${selectedNewLoanBook?.id === book.id ? 'bg-muted' : ''}`}
                          onClick={() => handleNewLoanBookSelect(book)}
                        >
                          <div className="flex items-start gap-2">
                            <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <div className="font-medium">{book.titulo}</div>
                              <div className="text-sm text-muted-foreground">{book.autor}</div>
                              <div className="text-xs text-muted-foreground mt-1">ID: {book.id_libro}</div>
                              {book.inventario && book.inventario.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-1">
                                  {book.inventario.map(inv => (
                                    <Badge 
                                      key={inv.campus} 
                                      variant="outline" 
                                      className={inv.cantidad > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                                    >
                                      {inv.campus}: {inv.cantidad}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Indicador de carga para paginación al final */}
                      {isSearchingBooks && (
                        <div className="p-2 text-center">
                          <Loader2 className="h-4 w-4 mx-auto animate-spin" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {totalBooksFound > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Mostrando {Math.min(filteredNewLoanBooks.length, totalBooksFound)} de {totalBooksFound} libros
                  </div>
                )}
                
                {selectedNewLoanBook && (
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm font-medium">Libro seleccionado:</div>
                    <div className="text-base font-semibold">{selectedNewLoanBook.titulo}</div>
                    <div className="text-sm text-muted-foreground">{selectedNewLoanBook.autor}</div>
                    {selectedNewLoanBook.inventario && selectedNewLoanBook.inventario.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedNewLoanBook.inventario.map(inv => (
                          <Badge 
                            key={inv.campus} 
                            variant="outline" 
                            className={inv.cantidad > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                          >
                            {inv.campus}: {inv.cantidad}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Selección de usuario */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userSearch">Buscar Usuario</Label>
                  <Input
                    id="userSearch"
                    placeholder="Buscar por nombre, matrícula o email..."
                    value={newLoanUserSearchTerm}
                    onChange={e => setNewLoanUserSearchTerm(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div 
                  className="border rounded-md max-h-[300px] overflow-y-auto"
                  onScroll={handleUsersScroll}
                >
                  {isSearchingUsers ? (
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredNewLoanUsers.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No se encontraron usuarios
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredNewLoanUsers.map(user => (
                        <div 
                          key={user.id}
                          className={`p-3 cursor-pointer transition-colors hover:bg-muted ${selectedNewLoanUser?.id === user.id ? 'bg-muted' : ''}`}
                          onClick={() => handleNewLoanUserSelect(user)}
                        >
                          <div className="flex items-start gap-2">
                            <User className="h-5 w-5 text-primary mt-0.5" />
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

                      {/* Indicador de carga para paginación al final */}
                      {isSearchingUsers && (
                        <div className="p-2 text-center">
                          <Loader2 className="h-4 w-4 mx-auto animate-spin" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {totalUsersFound > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Mostrando {Math.min(filteredNewLoanUsers.length, totalUsersFound)} de {totalUsersFound} usuarios
                  </div>
                )}
                
                {selectedNewLoanUser && (
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm font-medium">Usuario seleccionado:</div>
                    <div className="text-base font-semibold">{selectedNewLoanUser.username}</div>
                    {selectedNewLoanUser.Numcontrol && (
                      <div className="text-sm text-muted-foreground">Matrícula: {selectedNewLoanUser.Numcontrol}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Fechas y detalles adicionales */}
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loanDate">Fecha de Préstamo</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newLoanDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newLoanDate ? format(newLoanDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newLoanDate}
                        onSelect={(date) => {
                          if (date) {
                            setNewLoanDate(date);
                            // Si la fecha de devolución es anterior a la nueva fecha de préstamo,
                            // actualizarla a 14 días después de la nueva fecha de préstamo
                            if (newLoanReturnDate && newLoanReturnDate < date) {
                              setNewLoanReturnDate(addDays(date, 14));
                            }
                          }
                        }}
                        initialFocus
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
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
                          !newLoanReturnDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newLoanReturnDate ? format(newLoanReturnDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newLoanReturnDate}
                        onSelect={(date) => {
                          if (date) {
                            setNewLoanReturnDate(date);
                          }
                        }}
                        initialFocus
                        disabled={(date) => {
                          if (!newLoanDate) return true;
                          const minDate = new Date(newLoanDate);
                          const maxDate = addDays(newLoanDate, 30);
                          return date < minDate || date > maxDate;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {newLoanDate && newLoanReturnDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Duración del préstamo: {Math.ceil((newLoanReturnDate.getTime() - newLoanDate.getTime()) / (1000 * 60 * 60 * 24))} días
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="campus">Campus de Origen</Label>
                <Select 
                  value={newLoanCampus} 
                  onValueChange={setNewLoanCampus}
                  disabled={availableCampus.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCampus.length === 0 ? (
                      <SelectItem value="no_disponible" disabled>
                        No hay campus con disponibilidad
                      </SelectItem>
                    ) : (
                      availableCampus.map(campus => (
                        <SelectItem key={campus.campus} value={campus.campus}>
                          {campus.campus} - Disponibles: {campus.cantidad}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {availableCampus.length === 0 && selectedNewLoanBook && (
                  <p className="text-xs text-rose-500 mt-1">
                    Este libro no tiene ejemplares disponibles
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Añade notas relevantes sobre este préstamo..."
                  value={newLoanNotes}
                  onChange={e => setNewLoanNotes(e.target.value)}
                />
              </div>
            </div>
            
            {/* Acciones */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateLoanModalOpen(false)}
                disabled={isCreatingLoan}
                type="button"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!selectedNewLoanBook || !selectedNewLoanUser || !newLoanCampus || isCreatingLoan || availableCampus.length === 0}
              >
                {isCreatingLoan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Préstamo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Renovación */}
      <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Renovar Préstamo</DialogTitle>
            <DialogDescription>
              Confirma la nueva fecha de devolución para el préstamo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedLoan && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Libro</Label>
                  <p className="text-sm font-medium">{selectedLoan.book}</p>
                </div>
                <div className="space-y-2">
                  <Label>Usuario</Label>
                  <p className="text-sm font-medium">{selectedLoan.user}</p>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Devolución Actual</Label>
                  <p className="text-sm font-medium">{formatDate(selectedLoan.returnDate).date}</p>
                </div>
                <div className="space-y-2">
                  <Label>Nueva Fecha de Devolución</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !renewalDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {renewalDate ? format(renewalDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={renewalDate || undefined}
                        onSelect={(date) => date && setRenewalDate(date)}
                        initialFocus
                        disabled={(date) => {
                          if (!selectedLoan) return true;
                          const minDate = new Date();
                          const maxDate = addDays(new Date(), 30);
                          return date < minDate || date > maxDate;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">Renovaciones realizadas:</span> {selectedLoan.renewalCount} de 2
                  </p>
                  {selectedLoan.renewalCount === 1 && (
                    <p className="text-sm text-amber-600 mt-1">
                      Esta será la última renovación permitida
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenewalDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmRenewal}
              disabled={!renewalDate || (selectedLoan?.renewalCount ?? 0) >= 2}
            >
              Confirmar Renovación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Tasa de Devolución */}
      <Dialog open={showTasaDevolucionModal} onOpenChange={setShowTasaDevolucionModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDevolucion ? "Detalles de la devolución" : "Historial de Devoluciones"}
            </DialogTitle>
            <DialogDescription>
              {selectedDevolucion 
                ? "Información detallada de la devolución" 
                : `Tasa actual de devolución: ${tasaDevolucionStats.porcentaje}%`}
            </DialogDescription>
          </DialogHeader>
          
          {/* Vista de lista de préstamos devueltos */}
          {!selectedDevolucion && (
            <div className="space-y-4 mt-4">
              {isLoadingDevueltos ? (
                <>
                  <div className="flex items-start gap-4 rounded-lg border p-3 animate-pulse">
                    <div className="bg-muted p-2 rounded-md">
                      <div className="h-4 w-4"></div>
                    </div>
                    <div className="space-y-3 w-full">
                      <div className="h-4 bg-muted rounded-md w-3/4"></div>
                      <div className="h-3 bg-muted rounded-md w-2/4"></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-lg border p-3 animate-pulse">
                    <div className="bg-muted p-2 rounded-md">
                      <div className="h-4 w-4"></div>
                    </div>
                    <div className="space-y-3 w-full">
                      <div className="h-4 bg-muted rounded-md w-3/4"></div>
                      <div className="h-3 bg-muted rounded-md w-2/4"></div>
                    </div>
                  </div>
                </>
              ) : prestamosDevueltos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay préstamos devueltos registrados
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg mb-6">
                    <h3 className="text-sm font-medium mb-2">Información de Tasa de Devolución</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      La tasa de devolución indica el porcentaje de préstamos que han sido devueltos correctamente
                      en relación al total de préstamos registrados en el sistema.
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full" 
                          style={{ width: `${tasaDevolucionStats.porcentaje}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{tasaDevolucionStats.porcentaje}%</span>
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-medium">Préstamos devueltos recientes</h3>
                  
                  {prestamosDevueltos.slice(0, 10).map((loan, index) => (
                    <Card 
                      key={index} 
                      className="cursor-pointer transition-all hover:shadow-md hover:bg-accent"
                      onClick={() => showDevolucionDetails(loan)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <BookOpenCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium leading-none">
                                {loan.book?.titulo || 'Sin título'}
                              </p>
                              {getStatusBadge(loan.estado)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {loan.book?.autor || 'Autor desconocido'}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  {loan.usuario?.username || 'Usuario desconocido'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-green-600" />
                                <p className="text-xs text-green-600">
                                  Devuelto: {formatDate(loan.fecha_devolucion_real || '').date}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  onClick={() => {
                    setShowTasaDevolucionModal(false);
                    router.push('/prestamos?estado=devuelto');
                  }}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver todos los prestamos devueltos
                </Button>
              </DialogFooter>
            </div>
          )}
          
          {/* Vista de detalles de la devolución */}
          {selectedDevolucion && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearSelectedDevolucion}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a la lista
                </Button>
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {selectedDevolucion.book?.titulo || 'Sin título'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedDevolucion.book?.autor || 'Autor desconocido'}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Usuario
                          </h4>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-500" />
                            <p className="text-sm font-medium">
                              {selectedDevolucion.usuario?.username || 'Usuario desconocido'}
                            </p>
                          </div>
                          {selectedDevolucion.usuario?.Numcontrol && (
                            <p className="text-xs text-muted-foreground pl-6">
                              ID: {selectedDevolucion.usuario.Numcontrol}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Estado
                          </h4>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(selectedDevolucion.estado)}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Fecha de préstamo
                          </h4>
                          <p className="text-sm">{formatDate(selectedDevolucion.fecha_prestamo).date}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Fecha de devolución esperada
                          </h4>
                          <p className="text-sm">{formatDate(selectedDevolucion.fecha_devolucion_esperada).date}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Fecha de devolución real
                          </h4>
                          <p className="text-sm">{formatDate(selectedDevolucion.fecha_devolucion_real || '').date}</p>
                        </div>
                        
                        {selectedDevolucion.multa !== undefined && selectedDevolucion.multa > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">
                              Multa aplicada
                            </h4>
                            <p className="text-sm">${selectedDevolucion.multa} por {selectedDevolucion.dias_atraso} días de atraso</p>
                          </div>
                        )}
                      </div>
                      
                      {selectedDevolucion.notas && (
                        <div className="pt-2">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Notas
                          </h4>
                          <p className="text-sm p-3 bg-muted rounded-md">
                            {selectedDevolucion.notas}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ... other cards ... */}
        
        <Card 
          className="cursor-pointer transition-all hover:shadow-md"
          onClick={loadPrestamosDevueltos}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Devolución</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "Cargando..." : `${tasaDevolucionStats.porcentaje}%`}
              </div>
            <p className="text-xs text-muted-foreground">
                {loading ? "Calculando..." : `${tasaDevolucionStats.incremento.startsWith('-') ? '' : '+'}${tasaDevolucionStats.incremento}% desde el mes pasado`}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PrestamosPage() {
  const router = useRouter();
  const { user, isAdmin, hasRole } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  
  // Verificar si el usuario tiene permisos, si no redirigir al catálogo
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
  
  return (
    <DashboardLayout>
      <PrestamosContent />
    </DashboardLayout>
  );
}