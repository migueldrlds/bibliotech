"use client";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { DashboardLayout } from "@/components/dashboard/layout";
import {
  BookOpenText,
  BookMarked,
  Users,
  Clock,
  BookOpenCheck,
  Mail,
  CircleDashed,
  AlertTriangle,
  User,
  Bookmark,
  ExternalLink,
  BookOpen,
  Calculator,
  Loader2,
  RotateCw,
  CalendarIcon,
  ChevronLeft,
  Building
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend 
} from "recharts";
import { useEffect, useState } from 'react';
import { bookService, Book } from '@/services/bookService';
import { loanService, Loan } from '@/services/loanService';
import { userService } from '@/services/userService';
import { formatDistanceToNow, parseISO, addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import "@/styles/glow-card.css";
import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useUser } from '@/context/user-context';

interface MonthlyLoanData {
  name: string;
  loans: number;
}

interface CategoryData {
  name: string;
  value: number;
}

const loanData = [
  { name: "Ene", loans: 65 },
  { name: "Feb", loans: 59 },
  { name: "Mar", loans: 80 },
  { name: "Abr", loans: 81 },
  { name: "May", loans: 56 },
  { name: "Jun", loans: 55 },
  { name: "Jul", loans: 72 },
  { name: "Ago", loans: 68 },
  { name: "Sep", loans: 74 },
  { name: "Oct", loans: 65 },
  { name: "Nov", loans: 90 },
  { name: "Dic", loans: 67 },
];

const categoryData = [
  { name: "Ciencias", value: 120 },
  { name: "Ingeniería", value: 95 },
  { name: "Literatura", value: 75 },
  { name: "Historia", value: 60 },
  { name: "Matemáticas", value: 45 },
];

// Utilidad para pluralizar 'préstamo'
const pluralPrestamo = (n: number) => n === 1 ? 'préstamo' : 'préstamos';

export function GlowCard({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
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

  return (
    <div
      ref={ref}
      className="glow-card"
      onMouseMove={handleMouseMove}
      {...props}
    >
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [totalBooks, setTotalBooks] = useState("...");
  const [newBooksThisMonth, setNewBooksThisMonth] = useState("...");
  const [totalUsers, setTotalUsers] = useState("...");
  const [newUsersThisMonth, setNewUsersThisMonth] = useState("...");
  const [activeLoans, setActiveLoans] = useState("...");
  const [pendingReturnsCount, setPendingReturnsCount] = useState("...");
  const [newLoansThisWeek, setNewLoansThisWeek] = useState("...");
  const [loanData, setLoanData] = useState<MonthlyLoanData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [topBooks, setTopBooks] = useState<{ title: string; count: number; loans: Loan[] }[]>([]);
  const [topUsers, setTopUsers] = useState<{ name: string; id: string; count: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [selectedUserLoans, setSelectedUserLoans] = useState<Loan[]>([]);
  const [isUserLoansModalOpen, setIsUserLoansModalOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [selectedBookLoans, setSelectedBookLoans] = useState<Loan[]>([]);
  const [isBookLoansModalOpen, setIsBookLoansModalOpen] = useState(false);
  const [selectedBookTitle, setSelectedBookTitle] = useState("");
  const [selectedMonthLoans, setSelectedMonthLoans] = useState<Loan[]>([]);
  const [isMonthLoansModalOpen, setIsMonthLoansModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para los nuevos modales de las tarjetas principales
  const [isTotalBooksModalOpen, setIsTotalBooksModalOpen] = useState(false);
  const [isActiveLoansModalOpen, setIsActiveLoansModalOpen] = useState(false);
  const [isRegisteredUsersModalOpen, setIsRegisteredUsersModalOpen] = useState(false);
  const [isPendingReturnsModalOpen, setIsPendingReturnsModalOpen] = useState(false);
  const [isFineCalculatorOpen, setIsFineCalculatorOpen] = useState(false);
  const [selectedLoanForFine, setSelectedLoanForFine] = useState<Loan | null>(null);
  const [calculatedFine, setCalculatedFine] = useState<number | null>(null);
  const [isCalculatingFine, setIsCalculatingFine] = useState(false);
  
  // Estados para los datos de los modales
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [allLoans, setAllLoans] = useState<Loan[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [pendingReturns, setPendingReturns] = useState<Loan[]>([]);
  
  // Estados para el modal de creación de préstamos
  const [isCreateLoanModalOpen, setIsCreateLoanModalOpen] = useState(false);
  const [newLoanBookId, setNewLoanBookId] = useState("");
  const [newLoanUserId, setNewLoanUserId] = useState("");
  const [newLoanDate, setNewLoanDate] = useState<Date>(new Date());
  const [newLoanReturnDate, setNewLoanReturnDate] = useState<Date>(addDays(new Date(), 14)); // 14 días por defecto
  const [newLoanCampus, setNewLoanCampus] = useState<string>("Tomas Aquino");
  const [newLoanNotes, setNewLoanNotes] = useState("");
  const [newLoanBookSearchTerm, setNewLoanBookSearchTerm] = useState("");
  const [newLoanUserSearchTerm, setNewLoanUserSearchTerm] = useState("");
  const [filteredNewLoanBooks, setFilteredNewLoanBooks] = useState<Book[]>([]);
  const [filteredNewLoanUsers, setFilteredNewLoanUsers] = useState<any[]>([]);
  const [selectedNewLoanBook, setSelectedNewLoanBook] = useState<Book | null>(null);
  const [selectedNewLoanUser, setSelectedNewLoanUser] = useState<any | null>(null);
  const [isCreatingLoan, setIsCreatingLoan] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAdmin, hasRole } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  const [authorizationChecked, setAuthorizationChecked] = useState(false);
  
  // Verificar si el usuario tiene permisos, si no redirigir al login o catálogo
  useEffect(() => {
    setIsMounted(true);
    
    // Verificar si hay token aunque no haya usuario (puede ser un error de permisos)
    const hasToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('bibliotech-token');
    const savedRole = typeof localStorage !== 'undefined' ? localStorage.getItem('bibliotech-role') : null;
    
    if (!hasToken) {
      // Si no hay token, redirigir al login
      console.log("No hay token de autenticación, redirigiendo a login...");
      router.push('/auth/login');
    } else if (user === null && hasToken) {
      // Si hay token pero no hay usuario, puede ser un problema transitorio o de permisos
      // En este caso, intentamos recuperar el rol guardado para tomar una decisión
      console.log("Hay token pero no usuario cargado. Rol guardado:", savedRole);
      
      if (savedRole === 'alumno' || savedRole === 'authenticated') {
        console.log("Usuario con rol sin permisos para dashboard, redirigiendo a catálogo...");
        router.push('/catalogo');
      } else if (savedRole && ['administrador', 'admin', 'interno'].includes(savedRole)) {
        console.log("Usuario con rol adecuado, pero con posible error de permisos. Intentando cargar dashboard...");
        setAuthorizationChecked(true);
      } else {
        // Si no podemos determinar el rol, por seguridad redirigimos al login
        console.log("No se pudo determinar el rol, redirigiendo a login...");
        router.push('/auth/login');
      }
    } else if (user && (user.role === 'alumno' || user.role === 'authenticated')) {
      // Si el usuario está autenticado pero es alumno, redirigir al catálogo
      console.log("Usuario con rol alumno, redirigiendo a catálogo...");
      router.push('/catalogo');
    } else if (user) {
      // Si el usuario está autenticado y tiene permisos, marcar como verificado
      console.log("Usuario autorizado:", user.role);
      setAuthorizationChecked(true);
    }
  }, [user, router]);
  
  // A nivel global, añadir estilos para la animación
  useEffect(() => {
    // Añadir la animación de fade-in al CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .animate-fade-in {
        animation: fadeIn 0.5s ease-in-out;
      }
      .transition-opacity {
        transition: opacity 0.5s ease-in-out;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // useEffect para cargar datos del dashboard
  useEffect(() => {
    // Solo ejecutar si el usuario está autenticado con permisos
    if (!authorizationChecked || !user || !isMounted || (user.role === 'alumno' || user.role === 'authenticated')) {
      return; // No cargar datos si no tiene permisos
    }
    
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener total de libros
        const booksResponse = await bookService.getBooks();
        const books = booksResponse.data || booksResponse;
        const totalBooksCount = booksResponse.meta?.pagination?.total ?? books.length;
        setTotalBooks(totalBooksCount.toString());
        
        // Guardar todos los libros para el modal
        setAllBooks(books);

        // Obtener préstamos solo si el usuario tiene permiso
        if (isAdmin || hasRole(['administrador', 'interno'])) {
          try {
            const loans = await loanService.getLoans();
            
            // Guardar todos los préstamos
            setAllLoans(loans);
            
            // Calcular préstamos activos (solo activos y renovados)
            const activeLoansCount = loans.filter(loan => 
              loan.estado === 'activo' || 
              loan.estado === 'renovado'
            ).length;
            setActiveLoans(activeLoansCount.toString());
            
            // Calcular devoluciones pendientes (activos, atrasados y renovados)
            const pendingReturnsCountValue = loans.filter(loan => 
              loan.estado === 'activo' || 
              loan.estado === 'atrasado' || 
              loan.estado === 'renovado'
            ).length;
            setPendingReturnsCount(pendingReturnsCountValue.toString());

            // Guardar préstamos activos, atrasados y renovados para el modal de Devoluciones Pendientes
            const pendingReturnsData = loans.filter(loan => 
              loan.estado === 'activo' || 
              loan.estado === 'atrasado' || 
              loan.estado === 'renovado'
            );
            setPendingReturns(pendingReturnsData);
            
            // Procesar datos para gráficos
            const monthlyLoans = processMonthlyLoans(loans);
            setLoanData(monthlyLoans);

            // Calcular libros más prestados
            const bookCountMap: Record<string, { title: string; count: number; loans: Loan[] }> = {};
            loans.forEach(loan => {
              const bookTitle = loan.book?.titulo || 'Sin título';
              if (!bookCountMap[bookTitle]) {
                bookCountMap[bookTitle] = { title: bookTitle, count: 0, loans: [] };
              }
              bookCountMap[bookTitle].count += 1;
              bookCountMap[bookTitle].loans.push(loan);
            });
            const topBooksArr = Object.values(bookCountMap)
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);
            setTopBooks(topBooksArr);

            // Calcular usuarios más activos
            const userCountMap: Record<string, { name: string; id: string; count: number }> = {};
            loans.forEach(loan => {
              const user = loan.usuario;
              const userName = user?.username || 'Sin nombre';
              const userId = user?.Numcontrol || user?.id?.toString() || '';
              if (!userCountMap[userId]) {
                userCountMap[userId] = { name: userName, id: userId, count: 0 };
              }
              userCountMap[userId].count += 1;
            });
            const topUsersArr = Object.values(userCountMap)
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);
            setTopUsers(topUsersArr);

            // Calcular actividad reciente
            const sortedLoans = [...loans].sort((a, b) => {
              const dateA = new Date(a.updatedAt || a.createdAt).getTime();
              const dateB = new Date(b.updatedAt || b.createdAt).getTime();
              return dateB - dateA;
            });
            const recent = sortedLoans.slice(0, 5).map((loan) => {
              let tipo = '';
              let icon = BookMarked;
              let color = 'text-blue-600 dark:text-blue-400';
              switch (loan.estado) {
                case 'devuelto':
                  tipo = 'Devolución';
                  icon = BookOpenCheck;
                  color = 'text-green-600 dark:text-green-400';
                  break;
                case 'atrasado':
                  tipo = 'Atrasado';
                  icon = Clock;
                  color = 'text-orange-600 dark:text-orange-400';
                  break;
                case 'perdido':
                  tipo = 'Perdido';
                  icon = BookOpenText;
                  color = 'text-red-600 dark:text-red-400';
                  break;
                default:
                  tipo = 'Préstamo';
                  icon = BookMarked;
                  color = 'text-blue-600 dark:text-blue-400';
              }
              return {
                tipo,
                icon,
                color,
                libro: loan.book?.titulo || 'Sin título',
                usuario: loan.usuario?.username || 'Sin usuario',
                fecha: loan.updatedAt || loan.createdAt,
              };
            });
            setRecentActivity(recent);
          } catch (loanError) {
            console.error('Error al cargar préstamos:', loanError);
          }
        } else {
          console.log("Usuario sin permisos para ver préstamos, mostrando solo libros");
        }

        // Obtener usuarios si tiene permisos
        if (isAdmin || hasRole(['administrador'])) {
          try {
            const users = await userService.getUsers();
            setTotalUsers(users.length.toString());
            
            // Guardar todos los usuarios para el modal
            setAllUsers(users);
          } catch (userError) {
            console.error('Error al cargar usuarios:', userError);
          }
        }

        // Procesar categorías de libros
        const categories = processBookCategories(books);
        setCategoryData(categories);

      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [authorizationChecked, user, isAdmin, hasRole, isMounted]);

  // Filtrar libros basados en el término de búsqueda
  useEffect(() => {
    if (!newLoanBookSearchTerm.trim() || !allBooks.length) {
      setFilteredNewLoanBooks(allBooks);
      return;
    }
    
    const searchTerm = newLoanBookSearchTerm.toLowerCase();
    const filtered = allBooks.filter(book => 
      book.titulo.toLowerCase().includes(searchTerm) || 
      book.autor.toLowerCase().includes(searchTerm) ||
      (book.id_libro && book.id_libro.toLowerCase().includes(searchTerm))
    );
    
    setFilteredNewLoanBooks(filtered);
  }, [newLoanBookSearchTerm, allBooks]);

  // Filtrar usuarios basados en el término de búsqueda
  useEffect(() => {
    if (!newLoanUserSearchTerm.trim() || !allUsers.length) {
      setFilteredNewLoanUsers(allUsers);
      return;
    }
    
    const searchTerm = newLoanUserSearchTerm.toLowerCase();
    const filtered = allUsers.filter(user => 
      user.username.toLowerCase().includes(searchTerm) || 
      (user.Numcontrol && user.Numcontrol.toLowerCase().includes(searchTerm)) ||
      user.email.toLowerCase().includes(searchTerm)
    );
    
    setFilteredNewLoanUsers(filtered);
  }, [newLoanUserSearchTerm, allUsers]);
  
  // Si el componente no está montado, devolver un div vacío para evitar errores de hidratación
  if (!isMounted) {
    return <div className="min-h-screen"></div>;
  }
  
  // Si el usuario no tiene permisos y no estamos en proceso de verificación, no mostrar contenido
  if (!authorizationChecked && (!user || (user && (user.role === 'alumno' || user.role === 'authenticated')))) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg">Verificando permisos...</p>
      </div>
    </div>;
  }

  const processMonthlyLoans = (loans: Loan[]): MonthlyLoanData[] => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = months.map((month, index) => ({
      name: month,
      loans: loans.filter(loan => {
        const loanDate = new Date(loan.fecha_prestamo);
        return loanDate.getFullYear() === currentYear && 
               loanDate.getMonth() === index;
      }).length
    }));

    return monthlyData;
  };

  const processBookCategories = (books: Book[]): CategoryData[] => {
    const categories: Record<string, number> = {};
    books.forEach(book => {
      const category = book.clasificacion || 'Sin categoría';
      categories[category] = (categories[category] || 0) + 1;
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value
    }));
  };

  const handleUserClick = async (userId: string, userName: string) => {
    try {
      const loans = await loanService.getLoans();
      const userLoans = loans.filter(loan => loan.usuario?.Numcontrol === userId || loan.usuario?.id?.toString() === userId);
      setSelectedUserLoans(userLoans);
      setSelectedUserName(userName);
      setIsUserLoansModalOpen(true);
    } catch (error) {
      console.error('Error al cargar los préstamos del usuario:', error);
    }
  };

  const handleBookClick = (book: { title: string; loans: Loan[] }) => {
    setSelectedBookLoans(book.loans);
    setSelectedBookTitle(book.title);
    setIsBookLoansModalOpen(true);
  };

  const handleMonthClick = async (month: string) => {
    try {
      const loans = await loanService.getLoans();
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthIndex = monthNames.indexOf(month);
      const currentYear = new Date().getFullYear();
      
      console.log('Mes seleccionado:', month);
      console.log('Índice del mes:', monthIndex);
      
      const monthLoans = loans.filter(loan => {
        const loanDate = new Date(loan.fecha_prestamo);
        const loanMonth = loanDate.getMonth();
        const loanYear = loanDate.getFullYear();
        
        console.log('Fecha del préstamo:', loanDate);
        console.log('Mes del préstamo:', loanMonth);
        console.log('Año del préstamo:', loanYear);
        
        return loanYear === currentYear && loanMonth === monthIndex;
      });

      console.log('Préstamos encontrados:', monthLoans.length);
      
      setSelectedMonthLoans(monthLoans);
      setSelectedMonth(month);
      setIsMonthLoansModalOpen(true);
    } catch (error) {
      console.error('Error al cargar los préstamos del mes:', error);
    }
  };

  const handleNewLoanBookSelect = (book: Book) => {
    setSelectedNewLoanBook(book);
    setNewLoanBookId(book.id.toString());
  };

  const handleNewLoanUserSelect = (user: any) => {
    setSelectedNewLoanUser(user);
    setNewLoanUserId(user.id.toString());
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedNewLoanBook || !selectedNewLoanUser) {
      toast({
        title: "Error",
        description: "Por favor selecciona un libro y un usuario",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCreatingLoan(true);
      
      // Preparar datos para el servicio
      const loanData = {
        book: selectedNewLoanBook.id,
        usuario: selectedNewLoanUser.id,
        fecha_prestamo: newLoanDate.toISOString(),
        fecha_devolucion_esperada: newLoanReturnDate.toISOString(),
        estado: "activo" as "activo",
        notas: newLoanNotes,
        campus_origen: newLoanCampus
      };
      
      // Crear el préstamo
      await loanService.createLoan(loanData);
      
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
      setNewLoanCampus("Tomas Aquino");
      setNewLoanNotes("");
      
      // Actualizar datos
      const updatedLoans = await loanService.getLoans();
      const activeLoans = updatedLoans.filter(loan => loan.estado === 'activo');
      const pendingLoans = updatedLoans.filter(l => 
        l.estado === 'activo' || 
        l.estado === 'atrasado' || 
        l.estado === 'renovado'
      );
      setAllLoans(updatedLoans);
      setPendingReturns(pendingLoans);
      setActiveLoans(activeLoans.length.toString());
      setPendingReturnsCount(pendingLoans.length.toString());
      
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

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Panel de control</h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <GlowCard
            onClick={() => setIsTotalBooksModalOpen(true)}
            tabIndex={0}
            role="button"
            aria-label="Ver detalle de libros"
            style={{ cursor: 'pointer' }}
          >
            <Card className="bg-transparent shadow-none border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Libros</CardTitle>
                <BookOpenText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Number(totalBooks).toLocaleString("es-MX")}</div>
                <p className="text-xs text-muted-foreground">
                  Libros en el catálogo
                </p>
              </CardContent>
            </Card>
          </GlowCard>
          
          <GlowCard
            onClick={() => setIsActiveLoansModalOpen(true)}
            tabIndex={0}
            role="button"
            aria-label="Ver préstamos activos"
            style={{ cursor: 'pointer' }}
          >
            <Card className="bg-transparent shadow-none border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Préstamos Activos</CardTitle>
                <BookMarked className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Number(activeLoans).toLocaleString("es-MX")}</div>
                <p className="text-xs text-muted-foreground">
                  Préstamos pendientes
                </p>
              </CardContent>
            </Card>
          </GlowCard>
          
          <GlowCard
            onClick={() => setIsRegisteredUsersModalOpen(true)}
            tabIndex={0}
            role="button"
            aria-label="Ver usuarios registrados"
            style={{ cursor: 'pointer' }}
          >
            <Card className="bg-transparent shadow-none border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Number(totalUsers).toLocaleString("es-MX")}</div>
                <p className="text-xs text-muted-foreground">
                  Usuarios en el sistema
                </p>
              </CardContent>
            </Card>
          </GlowCard>
          
          <GlowCard
            onClick={() => setIsPendingReturnsModalOpen(true)}
            tabIndex={0}
            role="button"
            aria-label="Ver devoluciones pendientes"
            style={{ cursor: 'pointer' }}
          >
            <Card className="bg-transparent shadow-none border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Devoluciones Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Number(pendingReturnsCount).toLocaleString("es-MX")}</div>
                <p className="text-xs text-muted-foreground">
                  Préstamos por devolver
                </p>
              </CardContent>
            </Card>
          </GlowCard>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Préstamos por mes</CardTitle>
              <CardDescription>
                Tendencia de préstamos realizados durante el año
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]" style={{ cursor: 'pointer' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={loanData}
                    margin={{
                      top: 5,
                      right: 10,
                      left: 10,
                      bottom: 0,
                    }}
                    style={{ cursor: 'pointer' }}
                    onMouseMove={(e: any) => {
                      if (e && e.activeLabel) {
                        setHoveredMonth(e.activeLabel);
                      }
                    }}
                    onClick={() => {
                      if (hoveredMonth) {
                        handleMonthClick(hoveredMonth);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="loanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs" 
                      stroke="hsl(var(--muted-foreground))" 
                    />
                    <YAxis 
                      className="text-xs" 
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      labelStyle={{
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="loans"
                      name="Préstamos"
                      stroke="hsl(var(--chart-1))"
                      fillOpacity={1}
                      fill="url(#loanGradient)"
                      activeDot={{
                        onClick: (e: any) => {
                          if (e && e.index !== undefined) {
                            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                            handleMonthClick(monthNames[e.index]);
                          }
                        },
                        style: { cursor: 'pointer' }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Libros por categoría</CardTitle>
              <CardDescription>
                Distribución de los libros por categoría
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      type="number" 
                      className="text-xs" 
                      stroke="hsl(var(--muted-foreground))" 
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      scale="band" 
                      className="text-xs" 
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      labelStyle={{
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="hsl(var(--chart-2))" 
                      radius={[0, 4, 4, 0]} 
                      name="Cantidad"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Actividad reciente</CardTitle>
                <CardDescription>
                  Préstamos y devoluciones recientes
                </CardDescription>
              </div>
              <BookOpenCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-lg border p-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      {item.icon && (
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {item.libro}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.tipo} • {item.usuario} • {formatDistanceToNow(parseISO(item.fecha), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Libros más prestados</CardTitle>
              <CardDescription>
                Top 5 libros con mayor demanda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topBooks.map((book, i) => (
                  <Card 
                    key={i} 
                    className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => handleBookClick(book)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-base font-medium text-primary">
                            {i + 1}
                          </span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {book.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {book.count.toLocaleString("es-MX")} {pluralPrestamo(book.count)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Usuarios más activos</CardTitle>
              <CardDescription>
                Estudiantes con mayor actividad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topUsers.map((user, i) => (
                  <Card 
                    key={i} 
                    className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => handleUserClick(user.id, user.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <span className="text-base font-medium text-blue-600 dark:text-blue-400">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.id} • {user.count.toLocaleString("es-MX")} {pluralPrestamo(user.count)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de préstamos del usuario */}
      <Dialog open={isUserLoansModalOpen} onOpenChange={setIsUserLoansModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Préstamos de {selectedUserName}</DialogTitle>
            <DialogDescription>
              Historial de préstamos realizados por el estudiante
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedUserLoans.map((loan, index) => {
              let tipo = '';
              let IconComponent = BookMarked;
              let color = 'text-blue-600 dark:text-blue-400';
              
              switch (loan.estado) {
                case 'devuelto':
                  tipo = 'Devolución';
                  IconComponent = BookOpenCheck;
                  color = 'text-green-600 dark:text-green-400';
                  break;
                case 'atrasado':
                  tipo = 'Atrasado';
                  IconComponent = Clock;
                  color = 'text-orange-600 dark:text-orange-400';
                  break;
                case 'perdido':
                  tipo = 'Perdido';
                  IconComponent = BookOpenText;
                  color = 'text-red-600 dark:text-red-400';
                  break;
                default:
                  tipo = 'Préstamo';
                  IconComponent = BookMarked;
                  color = 'text-blue-600 dark:text-blue-400';
              }

              return (
                <div key={index} className="flex items-start gap-4 rounded-lg border p-3">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <IconComponent className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {loan.book?.titulo || 'Sin título'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tipo} • {formatDistanceToNow(parseISO(loan.fecha_prestamo), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
              );
            })}
            {selectedUserLoans.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se encontraron préstamos para este usuario
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de préstamos del libro */}
      <Dialog open={isBookLoansModalOpen} onOpenChange={setIsBookLoansModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Préstamos de {selectedBookTitle}</DialogTitle>
            <DialogDescription>
              Historial de préstamos realizados de este libro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedBookLoans.map((loan, index) => {
              let tipo = '';
              let IconComponent = BookMarked;
              let color = 'text-blue-600 dark:text-blue-400';
              
              switch (loan.estado) {
                case 'devuelto':
                  tipo = 'Devolución';
                  IconComponent = BookOpenCheck;
                  color = 'text-green-600 dark:text-green-400';
                  break;
                case 'atrasado':
                  tipo = 'Atrasado';
                  IconComponent = Clock;
                  color = 'text-orange-600 dark:text-orange-400';
                  break;
                case 'perdido':
                  tipo = 'Perdido';
                  IconComponent = BookOpenText;
                  color = 'text-red-600 dark:text-red-400';
                  break;
                default:
                  tipo = 'Préstamo';
                  IconComponent = BookMarked;
                  color = 'text-blue-600 dark:text-blue-400';
              }

              return (
                <div key={index} className="flex items-start gap-4 rounded-lg border p-3">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <IconComponent className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {loan.usuario?.username || 'Sin usuario'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tipo} • {formatDistanceToNow(parseISO(loan.fecha_prestamo), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
              );
            })}
            {selectedBookLoans.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se encontraron préstamos para este libro
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de préstamos del mes */}
      <Dialog open={isMonthLoansModalOpen} onOpenChange={setIsMonthLoansModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Préstamos de {selectedMonth}</DialogTitle>
            <DialogDescription>
              Detalle de préstamos realizados en este mes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedMonthLoans.map((loan, index) => {
              let tipo = '';
              let IconComponent = BookMarked;
              let color = 'text-blue-600 dark:text-blue-400';
              
              switch (loan.estado) {
                case 'devuelto':
                  tipo = 'Devolución';
                  IconComponent = BookOpenCheck;
                  color = 'text-green-600 dark:text-green-400';
                  break;
                case 'atrasado':
                  tipo = 'Atrasado';
                  IconComponent = Clock;
                  color = 'text-orange-600 dark:text-orange-400';
                  break;
                case 'perdido':
                  tipo = 'Perdido';
                  IconComponent = BookOpenText;
                  color = 'text-red-600 dark:text-red-400';
                  break;
                default:
                  tipo = 'Préstamo';
                  IconComponent = BookMarked;
                  color = 'text-blue-600 dark:text-blue-400';
              }

              return (
                <div key={index} className="flex items-start gap-4 rounded-lg border p-3">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <IconComponent className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {loan.book?.titulo || 'Sin título'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {loan.usuario?.username || 'Sin usuario'} • {tipo} • {formatDistanceToNow(parseISO(loan.fecha_prestamo), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
              );
            })}
            {selectedMonthLoans.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se encontraron préstamos para este mes
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Total Libros */}
      <Dialog open={isTotalBooksModalOpen} onOpenChange={setIsTotalBooksModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Catálogo de Libros</DialogTitle>
            <DialogDescription>
              Listado completo de libros disponibles en el sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : allBooks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se encontraron libros en el sistema
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allBooks.slice(0, 50).map((book, index) => (
                  <Card 
                    key={index} 
                    className="transition-all hover:shadow-md"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                          <BookOpenText className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {book.titulo}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {book.autor}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="rounded-full bg-green-100 p-1 dark:bg-green-900/30">
                              <BookMarked className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                            <p className="text-xs text-muted-foreground">ID: {book.id_libro}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="rounded-full bg-green-100 p-1 dark:bg-green-900/30">
                              <Clock className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Clasificación: {book.clasificacion || 'No especificada'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {allBooks.length > 50 && (
              <div className="py-3 px-4 text-center text-sm text-muted-foreground">
                Mostrando 50 de {allBooks.length} libros. Abra el catálogo completo para ver más.
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => router.push('/catalogo')}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
              >
                <BookOpenText className="h-4 w-4" />
                Ir al Catálogo Completo
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Préstamos Activos */}
      <Dialog open={isActiveLoansModalOpen} onOpenChange={setIsActiveLoansModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Préstamos Activos</DialogTitle>
            <DialogDescription>
              Listado de préstamos actualmente en curso
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex flex-col space-y-4">
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
                <div className="flex items-start gap-4 rounded-lg border p-3 animate-pulse">
                  <div className="bg-muted p-2 rounded-md">
                    <div className="h-4 w-4"></div>
                  </div>
                  <div className="space-y-3 w-full">
                    <div className="h-4 bg-muted rounded-md w-3/4"></div>
                    <div className="h-3 bg-muted rounded-md w-2/4"></div>
                  </div>
                </div>
              </div>
            ) : allLoans.filter(loan => loan.estado === 'activo' || loan.estado === 'renovado').length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay préstamos activos actualmente
              </p>
            ) : (
              <div className="animate-fade-in space-y-4">
                {allLoans
                  .filter(loan => loan.estado === 'activo' || loan.estado === 'renovado')
                  .slice(0, 20)
                  .map((loan, index) => {
                    // Calcular días restantes para la devolución
                    const fechaDevolucion = new Date(loan.fecha_devolucion_esperada);
                    const hoy = new Date();
                    const diasRestantes = Math.ceil((fechaDevolucion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Definir iconos y colores según el estado
                    let IconComponent = BookMarked;
                    let iconColor = 'text-blue-600 dark:text-blue-400';
                    
                    // Crear el texto de estado
                    let estadoTexto = `${diasRestantes} días restantes`;
                    let estadoBadgeClase = "bg-emerald-500 hover:bg-emerald-600 text-xs px-2 py-0.5";
                    let estadoBadgeIcono = <CircleDashed className="h-3 w-3 mr-1" />;
                    
                    if (loan.estado === 'renovado') {
                      estadoTexto = `Renovado - ${diasRestantes} días restantes`;
                      estadoBadgeClase = "bg-blue-500 hover:bg-blue-600 text-xs px-2 py-0.5";
                      estadoBadgeIcono = <RotateCw className="h-3 w-3 mr-1" />;
                      IconComponent = RotateCw;
                      iconColor = 'text-blue-600 dark:text-blue-400';
                    } else if (diasRestantes < 0) {
                      estadoTexto = `${Math.abs(diasRestantes)} días de retraso`;
                      estadoBadgeClase = "bg-rose-500 hover:bg-rose-600 text-xs px-2 py-0.5";
                      estadoBadgeIcono = <AlertTriangle className="h-3 w-3 mr-1" />;
                      IconComponent = Clock;
                      iconColor = 'text-red-600 dark:text-red-400';
                    } else if (diasRestantes <= 3) {
                      estadoTexto = `${diasRestantes} días (próximo)`;
                      estadoBadgeClase = "bg-amber-600 hover:bg-amber-700 text-xs px-2 py-0.5 font-medium";
                      estadoBadgeIcono = <Clock className="h-3 w-3 mr-1" />;
                      IconComponent = Clock;
                      iconColor = 'text-orange-600 dark:text-orange-400';
                    }
                    
                    return (
                      <Card 
                        key={index} 
                        className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <IconComponent className={`h-5 w-5 ${iconColor}`} />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium leading-none">
                                  {loan.book?.titulo || 'Sin título'}
                                </p>
                                <Badge className={estadoBadgeClase}>
                                  <div className="flex items-center">
                                    {estadoBadgeIcono}
                                    {estadoTexto}
                                  </div>
                                </Badge>
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
                                <p className="text-xs text-muted-foreground">
                                  Devolución: {new Date(loan.fecha_devolucion_esperada).toLocaleDateString('es-MX')}
                                </p>
                              </div>
                              
                              {/* Información adicional del usuario */}
                              {loan.usuario && (
                                <div className="mt-2 space-y-1">
                                  {loan.usuario.Numcontrol && (
                                    <div className="flex items-center gap-1">
                                      <Bookmark className="h-3 w-3 text-muted-foreground" />
                                      <p className="text-xs text-muted-foreground">
                                        Matrícula: {loan.usuario.Numcontrol}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {loan.usuario.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3 text-muted-foreground" />
                                      <p className="text-xs text-muted-foreground">
                                        {loan.usuario.email}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {loan.usuario.Carrera && (
                                    <div className="flex items-center gap-1">
                                      <GraduationCap className="h-3 w-3 text-muted-foreground" />
                                      <p className="text-xs text-muted-foreground">
                                        {loan.usuario.Carrera}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Botones de acción */}
                              <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedLoanForFine(loan);
                                    setCalculatedFine(null);
                                    setIsFineCalculatorOpen(true);
                                  }}
                                >
                                  {diasRestantes < 0 ? (
                                    <>
                                      <Calculator className="h-3 w-3 mr-1" />
                                      Calcular multa
                                    </>
                                  ) : (
                                    <>
                                      <BookOpenCheck className="h-3 w-3 mr-1" />
                                      Devolver
                                    </>
                                  )}
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      // Calcular nueva fecha (14 días a partir de hoy)
                                      const newDueDate = addDays(new Date(), 14).toISOString();
                                      
                                      await loanService.renewLoan(loan.id, newDueDate, loan.documentId);
                                      
                                      toast({
                                        title: "Préstamo renovado",
                                        description: "El préstamo ha sido renovado exitosamente",
                                      });
                                      
                                      // Actualizar datos
                                      const updatedLoans = await loanService.getLoans();
                                      const activeLoansData = updatedLoans.filter(loan => 
                                        loan.estado === 'activo' || 
                                        loan.estado === 'renovado'
                                      );
                                      const pendingReturnsData = updatedLoans.filter(loan => 
                                        loan.estado === 'activo' || 
                                        loan.estado === 'atrasado' || 
                                        loan.estado === 'renovado'
                                      );
                                      
                                      setAllLoans(updatedLoans);
                                      setPendingReturns(pendingReturnsData);
                                      setActiveLoans(activeLoansData.length.toString());
                                      setPendingReturnsCount(pendingReturnsData.length.toString());
                                      
                                    } catch (error) {
                                      console.error("Error al renovar préstamo:", error);
                                      toast({
                                        title: "Error",
                                        description: "No se pudo renovar el préstamo",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <RotateCw className="h-3 w-3 mr-1" />
                                  Renovar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                
                {allLoans.filter(loan => loan.estado === 'activo' || loan.estado === 'renovado').length > 20 && (
                  <div className="py-3 px-4 text-center text-sm text-muted-foreground bg-muted/10 border rounded-md">
                    Mostrando 20 de {allLoans.filter(loan => loan.estado === 'activo' || loan.estado === 'renovado').length} préstamos activos. 
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={() => setIsCreateLoanModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 mr-2"
              >
                <BookOpen className="h-4 w-4" />
                Crear nuevo préstamo
              </Button>
              <Button
                onClick={() => router.push('/prestamos?estado=activo')}
                className="inline-flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Ver en "Préstamos"
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Usuarios Registrados */}
      <Dialog open={isRegisteredUsersModalOpen} onOpenChange={setIsRegisteredUsersModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Usuarios Registrados</DialogTitle>
            <DialogDescription>
              Listado de usuarios registrados en el sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : allUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay usuarios registrados en el sistema
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allUsers.slice(0, 30).map((user, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => handleUserClick(user.Numcontrol || user.id, user.username)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <span className="text-base font-medium text-blue-600 dark:text-blue-400">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium leading-none">
                              {user.username}
                            </p>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              user.Estado === 'Activo' ? 'bg-green-100 text-green-700' : 
                              user.Estado === 'Inactivo' ? 'bg-red-100 text-red-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {user.Estado || 'Desconocido'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Matrícula: {user.Numcontrol || user.id || 'No especificada'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="rounded-full bg-blue-100 p-1 dark:bg-blue-900/30">
                              <Mail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="rounded-full bg-blue-100 p-1 dark:bg-blue-900/30">
                              <BookOpenText className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {user.role?.name || user.role || 'Usuario'}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                Registro: {new Date(user.createdAt).toLocaleDateString('es-MX')}
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
            {allUsers.length > 30 && (
              <div className="py-3 px-4 text-center text-sm text-muted-foreground">
                Mostrando 30 de {allUsers.length} usuarios. Vea la lista completa para más detalles.
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => router.push('/usuarios')}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
              >
                <Users className="h-4 w-4" />
                Ver Todos los Usuarios
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Devoluciones Pendientes */}
      <Dialog open={isPendingReturnsModalOpen} onOpenChange={setIsPendingReturnsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Devoluciones Pendientes</DialogTitle>
            <DialogDescription>
              Listado de préstamos que están pendientes de devolver
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex flex-col space-y-4">
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
                <div className="flex items-start gap-4 rounded-lg border p-3 animate-pulse">
                  <div className="bg-muted p-2 rounded-md">
                    <div className="h-4 w-4"></div>
                  </div>
                  <div className="space-y-3 w-full">
                    <div className="h-4 bg-muted rounded-md w-3/4"></div>
                    <div className="h-3 bg-muted rounded-md w-2/4"></div>
                  </div>
                </div>
              </div>
            ) : pendingReturns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay devoluciones pendientes
              </p>
            ) : (
              <div className="animate-fade-in space-y-4">
                {pendingReturns.slice(0, 25).map((loan, index) => {
                  const fechaDevolucion = new Date(loan.fecha_devolucion_esperada);
                  const hoy = new Date();
                  const diasRestantes = Math.ceil((fechaDevolucion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                  
                  // Definir iconos y colores según el estado
                  let IconComponent = BookMarked;
                  let iconColor = 'text-blue-600 dark:text-blue-400';
                  
                  // Crear el texto de estado
                  let estadoTexto = `${diasRestantes} días restantes`;
                  let estadoBadgeClase = "bg-emerald-500 hover:bg-emerald-600 text-xs px-2 py-0.5";
                  let estadoBadgeIcono = <CircleDashed className="h-3 w-3 mr-1" />;
                  
                  if (loan.estado === 'atrasado' || diasRestantes < 0) {
                    estadoTexto = `${Math.abs(diasRestantes)} días de retraso`;
                    estadoBadgeClase = "bg-rose-500 hover:bg-rose-600 text-xs px-2 py-0.5";
                    estadoBadgeIcono = <AlertTriangle className="h-3 w-3 mr-1" />;
                    IconComponent = Clock;
                    iconColor = 'text-red-600 dark:text-red-400';
                  } else if (loan.estado === 'renovado') {
                    estadoTexto = `Renovado - ${diasRestantes} días restantes`;
                    estadoBadgeClase = "bg-blue-500 hover:bg-blue-600 text-xs px-2 py-0.5";
                    estadoBadgeIcono = <RotateCw className="h-3 w-3 mr-1" />;
                    IconComponent = RotateCw;
                    iconColor = 'text-blue-600 dark:text-blue-400';
                  } else if (diasRestantes <= 3) {
                    estadoTexto = `${diasRestantes} días (próximo)`;
                    estadoBadgeClase = "bg-amber-600 hover:bg-amber-700 text-xs px-2 py-0.5 font-medium";
                    estadoBadgeIcono = <Clock className="h-3 w-3 mr-1" />;
                    IconComponent = Clock;
                    iconColor = 'text-orange-600 dark:text-orange-400';
                  }
                  
                  return (
                    <Card 
                      key={index} 
                      className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <IconComponent className={`h-5 w-5 ${iconColor}`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium leading-none">
                                {loan.book?.titulo || 'Sin título'}
                              </p>
                              <Badge className={estadoBadgeClase}>
                                <div className="flex items-center">
                                  {estadoBadgeIcono}
                                  {estadoTexto}
                                </div>
                              </Badge>
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
                              <p className="text-xs text-muted-foreground">
                                Devolución: {new Date(loan.fecha_devolucion_esperada).toLocaleDateString('es-MX')}
                              </p>
                            </div>
                            
                            {/* Información adicional del usuario */}
                            {loan.usuario && (
                              <div className="mt-2 space-y-1">
                                {loan.usuario.Numcontrol && (
                                  <div className="flex items-center gap-1">
                                    <Bookmark className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                      Matrícula: {loan.usuario.Numcontrol}
                                    </p>
                                  </div>
                                )}
                                
                                {loan.usuario.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                      {loan.usuario.email}
                                    </p>
                                  </div>
                                )}
                                
                                {loan.usuario.Carrera && (
                                  <div className="flex items-center gap-1">
                                    <GraduationCap className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                      {loan.usuario.Carrera}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Botones de acción */}
                            <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedLoanForFine(loan);
                                  setCalculatedFine(null);
                                  setIsFineCalculatorOpen(true);
                                }}
                              >
                                {diasRestantes < 0 ? (
                                  <>
                                    <Calculator className="h-3 w-3 mr-1" />
                                    Calcular multa
                                  </>
                                ) : (
                                  <>
                                    <BookOpenCheck className="h-3 w-3 mr-1" />
                                    Devolver
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {pendingReturns.length > 25 && (
                  <div className="py-3 px-4 text-center text-sm text-muted-foreground bg-muted/10 border rounded-md">
                    Mostrando 25 de {pendingReturns.length} devoluciones pendientes.
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={() => setIsCreateLoanModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 mr-2"
              >
                <BookOpen className="h-4 w-4" />
                Crear nuevo préstamo
              </Button>
              <Button
                onClick={() => router.push('/prestamos?estado=activo')}
                className="inline-flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Ver en "Préstamos"
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para cálculo de multa */}
      <Dialog open={isFineCalculatorOpen} onOpenChange={setIsFineCalculatorOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Calcular Multa</DialogTitle>
            <DialogDescription>
              {selectedLoanForFine?.estado === 'atrasado' 
                ? "Cálculo de multa para préstamo atrasado" 
                : "Este préstamo no está atrasado, no aplica multa"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLoanForFine && (
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <h3 className="text-sm font-medium">Libro:</h3>
                    <p className="text-sm">{selectedLoanForFine.book?.titulo}</p>
                  </div>
                  <div className="flex justify-between">
                    <h3 className="text-sm font-medium">Usuario:</h3>
                    <p className="text-sm">{selectedLoanForFine.usuario?.username}</p>
                  </div>
                  <div className="flex justify-between">
                    <h3 className="text-sm font-medium">Fecha límite:</h3>
                    <p className="text-sm">{new Date(selectedLoanForFine.fecha_devolucion_esperada).toLocaleDateString('es-MX')}</p>
                  </div>
                  <div className="flex justify-between">
                    <h3 className="text-sm font-medium">Estado:</h3>
                    <div>
                      <Badge className={selectedLoanForFine.estado === 'atrasado' 
                        ? "bg-amber-600 hover:bg-amber-700 text-xs px-2 py-0.5" 
                        : "bg-emerald-500 hover:bg-emerald-600 text-xs px-2 py-0.5"}>
                        <div className="flex items-center">
                          {selectedLoanForFine.estado === 'atrasado' 
                            ? <AlertTriangle className="h-3 w-3 mr-1" /> 
                            : <CircleDashed className="h-3 w-3 mr-1" />}
                          {selectedLoanForFine.estado === 'atrasado' ? 'Atrasado' : 'Activo'}
                        </div>
                      </Badge>
                    </div>
                  </div>
                  
                  {selectedLoanForFine.estado === 'atrasado' && (
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium">Días de atraso:</h3>
                      <p className="text-sm font-semibold text-amber-600">
                        {Math.ceil(
                          (new Date().getTime() - new Date(selectedLoanForFine.fecha_devolucion_esperada).getTime()) / 
                          (1000 * 60 * 60 * 24)
                        )} días
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedLoanForFine.estado === 'atrasado' && (
                <>
                  <div className="rounded-md bg-muted p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-amber-600 mr-2" />
                        <h3 className="text-sm font-medium">Multa calculada:</h3>
                      </div>
                      
                      {isCalculatingFine ? (
                        <div className="flex items-center">
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          <span className="text-sm">Calculando...</span>
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-amber-600">
                          {calculatedFine !== null ? `$${calculatedFine} MXN` : 'No calculado'}
                        </p>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      La multa se calcula a $5 MXN por cada día de retraso
                    </p>
                  </div>
                  
                  <div className="flex justify-between space-x-2">
                    <Button
                      variant="outline"
                      disabled={isCalculatingFine}
                      onClick={async () => {
                        setIsCalculatingFine(true);
                        try {
                          const fine = loanService.calculateFine(
                            selectedLoanForFine.fecha_devolucion_esperada,
                            selectedLoanForFine.fecha_devolucion_real || new Date().toISOString()
                          );
                          setCalculatedFine(fine.amount);
                          
                          toast({
                            title: "Multa calculada",
                            description: `La multa es de $${fine.amount} MXN por ${fine.daysLate} días de atraso`,
                          });
                        } catch (error) {
                          console.error("Error al calcular multa:", error);
                          toast({
                            title: "Error",
                            description: "No se pudo calcular la multa",
                            variant: "destructive",
                          });
                        } finally {
                          setIsCalculatingFine(false);
                        }
                      }}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Calcular multa
                    </Button>
                    
                    <Button
                      disabled={isCalculatingFine}
                      onClick={async () => {
                        setIsCalculatingFine(true);
                        try {
                          await loanService.returnLoan(
                            selectedLoanForFine.id, 
                            selectedLoanForFine.documentId
                          );
                          
                          toast({
                            title: "Préstamo devuelto",
                            description: calculatedFine 
                              ? `Se aplicó una multa de $${calculatedFine} MXN` 
                              : "El préstamo ha sido marcado como devuelto",
                          });
                          
                          setIsFineCalculatorOpen(false);
                          
                          // Actualizar listas de préstamos
                          const updatedLoans = await loanService.getLoans();
                          
                          // Actualizar contadores y listas
                          const activeLoansData = updatedLoans.filter(loan => 
                            loan.estado === 'activo' || 
                            loan.estado === 'renovado'
                          );
                          const pendingReturnsData = updatedLoans.filter(loan => 
                            loan.estado === 'activo' || 
                            loan.estado === 'atrasado' || 
                            loan.estado === 'renovado'
                          );
                          
                          setAllLoans(updatedLoans);
                          setPendingReturns(pendingReturnsData);
                          setActiveLoans(activeLoansData.length.toString());
                          setPendingReturnsCount(pendingReturnsData.length.toString());
                          
                        } catch (error) {
                          console.error("Error al devolver préstamo:", error);
                          toast({
                            title: "Error",
                            description: "No se pudo devolver el préstamo",
                            variant: "destructive",
                          });
                        } finally {
                          setIsCalculatingFine(false);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <BookOpenCheck className="h-4 w-4 mr-2" />
                      Marcar como devuelto
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                
                <div className="border rounded-md max-h-[200px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredNewLoanBooks.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No se encontraron libros
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredNewLoanBooks.slice(0, 10).map(book => (
                        <div 
                          key={book.id}
                          className={`p-3 cursor-pointer transition-colors hover:bg-muted ${selectedNewLoanBook?.id === book.id ? 'bg-muted' : ''}`}
                          onClick={() => handleNewLoanBookSelect(book)}
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
                
                {selectedNewLoanBook && (
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm font-medium">Libro seleccionado:</div>
                    <div className="text-base font-semibold">{selectedNewLoanBook.titulo}</div>
                    <div className="text-sm text-muted-foreground">{selectedNewLoanBook.autor}</div>
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
                
                <div className="border rounded-md max-h-[200px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredNewLoanUsers.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No se encontraron usuarios
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredNewLoanUsers.slice(0, 10).map(user => (
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
                    </div>
                  )}
                </div>
                
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
                        onSelect={(date) => date && setNewLoanDate(date)}
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
                        onSelect={(date) => date && setNewLoanReturnDate(date)}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="campus">Campus de Origen</Label>
                <Select value={newLoanCampus} onValueChange={setNewLoanCampus}>
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
                disabled={!selectedNewLoanBook || !selectedNewLoanUser || isCreatingLoan}
              >
                {isCreatingLoan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Préstamo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}