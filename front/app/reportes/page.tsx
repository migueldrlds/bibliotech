"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Calendar,
  Download,
  FileBarChart,
  LineChart,
  PieChart,
  BarChart,
  FileText,
  ArrowUpDown,
  ExternalLink,
  User,
  Mail,
  GraduationCap,
  BookMarked,
  BookOpenCheck,
  Clock,
  BookOpenText,
  ArrowLeft,
  CircleDashed,
  RotateCw,
  AlertTriangle,
  CircleCheck,
  CircleX,
  Bookmark,
  Loader2,
  BarChart3,
  BookOpen,
  Users,
  ChevronRight,
  Book,
  BookText,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
} from "recharts";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportExport } from "@/components/reports/report-export";

// Importar loanService para obtener los datos de préstamos
import { loanService, Loan } from "@/services/loanService";
// Importar fetchAPI para obtener usuarios directamente
import fetchAPI from "@/lib/api";
// Importar useRouter para la navegación
import { useRouter } from 'next/navigation';
// Importar para formatear fecha relativa
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
// Importar estilos para el efecto glow
import "@/styles/glow-card.css";
import { useUser } from '@/context/user-context';

// Interfaz para los usuarios obtenidos directamente de la API
interface ApiUser {
  id: number;
  documentId: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  Numcontrol?: string;
  campus?: string;
  Genero?: string;
  Carrera?: string;
  Estado?: string;
}

// Mock data for loan stats
const loanStatsData = [
  { name: "Ene", prestados: 65, devueltos: 45 },
  { name: "Feb", prestados: 59, devueltos: 50 },
  { name: "Mar", prestados: 80, devueltos: 70 },
  { name: "Abr", prestados: 81, devueltos: 60 },
  { name: "May", prestados: 56, devueltos: 45 },
  { name: "Jun", prestados: 55, devueltos: 48 },
  { name: "Jul", prestados: 72, devueltos: 60 },
];

// Nombres de los meses en español
const nombresMeses = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun", 
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

// Mock data for category distribution
const categoryData = [
  { name: "Ingeniería", value: 120 },
  { name: "Ciencias", value: 95 },
  { name: "Matemáticas", value: 75 },
  { name: "Literatura", value: 60 },
  { name: "Historia", value: 45 },
];

// Mock data for popular books
const popularBooksData = [
  { name: "Fundamentos de Programación", value: 42 },
  { name: "Álgebra Lineal", value: 36 },
  { name: "Redes de Computadoras", value: 31 },
  { name: "Cálculo Diferencial", value: 28 },
  { name: "Física para Ingenierías", value: 25 },
];

// Mock data for user activity
const userActivityData = [
  { name: "Lun", activos: 32 },
  { name: "Mar", activos: 40 },
  { name: "Mié", activos: 50 },
  { name: "Jue", activos: 45 },
  { name: "Vie", activos: 60 },
  { name: "Sáb", activos: 25 },
  { name: "Dom", activos: 15 },
];

// Nombres de los días de la semana en español
const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// Colors for pie chart
const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 
                'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

// Componente GlowCard para efecto de tarjeta con brillo
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

// Componente para el skeleton de préstamos
const LoanSkeleton = () => {
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
};

// Helper function para obtener el badge de estado consistente con la pantalla de préstamos
const getStatusBadge = (status: string) => {
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

  // Usar el valor predeterminado si el estado no existe en el registro
  const safeStatus = status in styles ? status : "activo";

  return (
    <Badge className={styles[safeStatus]}>
      <div className="flex items-center">
        {icons[safeStatus]}
        {labels[safeStatus]}
      </div>
    </Badge>
  );
};

export default function ReportesPage() {
  const router = useRouter();
  const { user, isAdmin, hasRole } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  
  // Estado para almacenar los datos de préstamos
  const [prestamoStats, setPrestamoStats] = useState({
    total: 0,
    incremento: "0%"
  });
  const [librosPrestadosStats, setLibrosPrestadosStats] = useState({
    total: 0,
    incremento: "0%"
  });
  const [usuariosActivosStats, setUsuariosActivosStats] = useState({
    total: 0,
    incremento: "0%"
  });
  const [tasaDevolucionStats, setTasaDevolucionStats] = useState({
    porcentaje: 0,
    incremento: "0%"
  });
  const [isLoading, setIsLoading] = useState(true);

  // Estado para gráfico de préstamos vs devoluciones
  const [loanStatsChartData, setLoanStatsChartData] = useState(loanStatsData);
  
  // Estado para usuarios más activos
  const [topActiveUsers, setTopActiveUsers] = useState<{ 
    name: string; 
    id: string; 
    career: string; 
    loans: number; 
    lastLoan: string;
    userId: number | string;
  }[]>([]);
  
  // Estado para actividad por día de la semana
  const [userActivityChartData, setUserActivityChartData] = useState(userActivityData);
  
  // Estados para el modal de total préstamos
  const [showTotalPrestamosModal, setShowTotalPrestamosModal] = useState(false);
  const [prestamosMes, setPrestamosMes] = useState<Loan[]>([]);
  const [isLoadingPrestamosMes, setIsLoadingPrestamosMes] = useState(false);
  const [selectedPrestamoMes, setSelectedPrestamoMes] = useState<Loan | null>(null);
  
  // Estados para el modal de libros prestados
  const [showLibrosPrestadosModal, setShowLibrosPrestadosModal] = useState(false);
  const [librosPrestados, setLibrosPrestados] = useState<Loan[]>([]);
  const [isLoadingLibros, setIsLoadingLibros] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Loan | null>(null);
  
  // Estados para el modal de usuarios activos
  const [showUsuariosActivosModal, setShowUsuariosActivosModal] = useState(false);
  const [usuariosActivos, setUsuariosActivos] = useState<ApiUser[]>([]);
  
  // Estados para el usuario seleccionado y sus préstamos
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [selectedUserLoans, setSelectedUserLoans] = useState<Loan[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);

  // Estado para el modal de tasa de devolución
  const [showTasaDevolucionModal, setShowTasaDevolucionModal] = useState(false);
  const [prestamosDevueltos, setPrestamosDevueltos] = useState<Loan[]>([]);
  const [isLoadingDevueltos, setIsLoadingDevueltos] = useState(false);
  const [selectedDevolucion, setSelectedDevolucion] = useState<Loan | null>(null);
  
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
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
  
  // Función para obtener datos del backend
  useEffect(() => {
    const obtenerEstadisticas = async () => {
      try {
        setIsLoading(true);
        // Obtener préstamos utilizando loanService
        const loans = await loanService.getLoans();
        
        // Calcular el total de préstamos
        const totalPrestamos = loans.length;
        
        // Calcular el incremento de préstamos (comparar con el mes anterior)
        const mesActual = new Date().getMonth();
        const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
        
        const prestamosEsteMes = loans.filter(loan => {
          const fechaPrestamo = new Date(loan.fecha_prestamo);
          return fechaPrestamo.getMonth() === mesActual;
        }).length;
        
        const prestamosMesAnterior = loans.filter(loan => {
          const fechaPrestamo = new Date(loan.fecha_prestamo);
          return fechaPrestamo.getMonth() === mesAnterior;
        }).length;
        
        // Calcular el porcentaje de incremento
        let incrementoPorcentaje = 0;
        if (prestamosMesAnterior > 0) {
          incrementoPorcentaje = Math.round(((prestamosEsteMes - prestamosMesAnterior) / prestamosMesAnterior) * 100);
        }
        
        // Actualizar el estado con los datos calculados
        setPrestamoStats({
          total: totalPrestamos,
          incremento: `${incrementoPorcentaje}`
        });

        // SEGUNDA TARJETA: Libros prestados actualmente
        const librosPrestados = loans.filter(loan => loan.estado === 'activo').length;
        
        // Calcular el incremento semanal
        const hoy = new Date();
        const unaSemanaAtras = new Date(hoy);
        unaSemanaAtras.setDate(hoy.getDate() - 7);

        const dosSemanaAtras = new Date(hoy);
        dosSemanaAtras.setDate(hoy.getDate() - 14);
        
        const prestamosEstaSemana = loans.filter(loan => {
          const fechaPrestamo = new Date(loan.fecha_prestamo);
          return fechaPrestamo >= unaSemanaAtras && fechaPrestamo <= hoy && loan.estado === 'activo';
        }).length;
        
        const prestamosSemanaAnterior = loans.filter(loan => {
          const fechaPrestamo = new Date(loan.fecha_prestamo);
          return fechaPrestamo >= dosSemanaAtras && fechaPrestamo < unaSemanaAtras && loan.estado === 'activo';
        }).length;
        
        let incrementoSemanal = 0;
        if (prestamosSemanaAnterior > 0) {
          incrementoSemanal = Math.round(((prestamosEstaSemana - prestamosSemanaAnterior) / prestamosSemanaAnterior) * 100);
        }
        
        setLibrosPrestadosStats({
          total: librosPrestados,
          incremento: `${incrementoSemanal}`
        });

        // TERCERA TARJETA: Usuarios activos
        try {
          // Obtener usuarios directamente desde la API
          const usuarios: ApiUser[] = await fetchAPI('/api/users');
          
          // Filtrar usuarios con estado "Activo"
          const usuariosActivosList = usuarios.filter((user: ApiUser) => 
            user.Estado === 'Activo'
          );
          
          setUsuariosActivos(usuariosActivosList);
          
          const usuariosActivosCount = usuariosActivosList.length;
          
          // Obtener usuarios creados este mes vs mes anterior para calcular incremento
          const usuariosEsteMes = usuarios.filter((user: ApiUser) => {
            const fechaCreacion = new Date(user.createdAt);
            return fechaCreacion.getMonth() === mesActual && 
                   fechaCreacion.getFullYear() === new Date().getFullYear() &&
                   user.Estado === 'Activo';
          }).length;
          
          const usuariosMesAnterior = usuarios.filter((user: ApiUser) => {
            const fechaCreacion = new Date(user.createdAt);
            return fechaCreacion.getMonth() === mesAnterior && 
                   fechaCreacion.getFullYear() === 
                   (mesAnterior === 11 ? new Date().getFullYear() - 1 : new Date().getFullYear()) &&
                   user.Estado === 'Activo';
          }).length;
          
          // Calcular incremento
          let incrementoUsuarios = 0;
          if (usuariosMesAnterior > 0) {
            incrementoUsuarios = Math.round(((usuariosEsteMes - usuariosMesAnterior) / usuariosMesAnterior) * 100);
          }
          
          setUsuariosActivosStats({
            total: usuariosActivosCount,
            incremento: `${incrementoUsuarios}`
          });
        } catch (userError) {
          console.error("Error al obtener usuarios:", userError);
        }
        
        // CUARTA TARJETA: Tasa de devolución
        // Calcular el porcentaje de préstamos devueltos respecto al total
        const prestamosDevueltos = loans.filter(loan => loan.estado === 'devuelto').length;
        const prestamosTotales = loans.length;
        const tasaDevolucion = prestamosTotales > 0 
          ? Math.round((prestamosDevueltos / prestamosTotales) * 100) 
          : 0;
        
        // Calcular la tasa del mes anterior para la comparación
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
        
        // Calcular el incremento en la tasa de devolución
        let incrementoTasaDevolucion = 0;
        if (tasaDevolucionMesAnterior > 0) {
          incrementoTasaDevolucion = tasaDevolucion - tasaDevolucionMesAnterior;
        }
        
        setTasaDevolucionStats({
          porcentaje: tasaDevolucion,
          incremento: `${incrementoTasaDevolucion}`
        });
        
        // Procesar datos para el gráfico de préstamos vs devoluciones
        // Crear un objeto para almacenar préstamos y devoluciones por mes
        const datosPorMes: Record<number, { prestados: number, devueltos: number }> = {};
        
        // Inicializar los datos para los últimos 12 meses
        const fechaActual = new Date();
        const añoActual = fechaActual.getFullYear();
        const mesActualIndex = fechaActual.getMonth();
        
        // Inicializar los últimos 7 meses con valores en cero
        for (let i = 0; i < 7; i++) {
          const mesIndex = (mesActualIndex - i + 12) % 12; // Asegurarse de que el índice sea positivo
          datosPorMes[mesIndex] = { prestados: 0, devueltos: 0 };
        }
        
        // Contar préstamos por mes (últimos 12 meses)
        loans.forEach(loan => {
          const fechaPrestamo = new Date(loan.fecha_prestamo);
          const mesPrestamo = fechaPrestamo.getMonth();
          const añoPrestamo = fechaPrestamo.getFullYear();
          
          // Solo considerar datos de los últimos 7 meses
          if (
            (añoPrestamo === añoActual && mesPrestamo <= mesActualIndex && mesPrestamo > mesActualIndex - 7) || 
            (añoPrestamo === añoActual - 1 && mesPrestamo > (mesActualIndex + 12) - 7)
          ) {
            if (datosPorMes[mesPrestamo]) {
              datosPorMes[mesPrestamo].prestados += 1;
            } else {
              datosPorMes[mesPrestamo] = { prestados: 1, devueltos: 0 };
            }
          }
          
          // Si el préstamo está devuelto, contar también como devolución
          if (loan.estado === 'devuelto' && loan.fecha_devolucion_real) {
            const fechaDevolucion = new Date(loan.fecha_devolucion_real);
            const mesDevolucion = fechaDevolucion.getMonth();
            const añoDevolucion = fechaDevolucion.getFullYear();
            
            // Solo considerar datos de los últimos 7 meses
            if (
              (añoDevolucion === añoActual && mesDevolucion <= mesActualIndex && mesDevolucion > mesActualIndex - 7) || 
              (añoDevolucion === añoActual - 1 && mesDevolucion > (mesActualIndex + 12) - 7)
            ) {
              if (datosPorMes[mesDevolucion]) {
                datosPorMes[mesDevolucion].devueltos += 1;
              } else {
                datosPorMes[mesDevolucion] = { prestados: 0, devueltos: 1 };
              }
            }
          }
        });
        
        // Convertir los datos a un formato adecuado para el gráfico
        const datosGrafico = [];
        // Mostrar los últimos 7 meses en orden cronológico
        for (let i = 6; i >= 0; i--) {
          const mesIndex = (mesActualIndex - i + 12) % 12;
          if (datosPorMes[mesIndex]) {
            datosGrafico.push({
              name: nombresMeses[mesIndex],
              prestados: datosPorMes[mesIndex].prestados,
              devueltos: datosPorMes[mesIndex].devueltos
            });
          }
        }
        
        setLoanStatsChartData(datosGrafico);
        
        // Calcular los usuarios más activos
        try {
          // Crear un mapa para contar los préstamos por usuario
          const userLoanMap: Record<string, { 
            name: string; 
            id: string; 
            career: string; 
            loans: number; 
            lastLoan: Date | null;
            userId: number | string;
          }> = {};
          
          // Procesar todos los préstamos
          loans.forEach(loan => {
            if (!loan.usuario) return;
            
            const userId = loan.usuario.id?.toString() || '';
            const userName = loan.usuario.username || 'Usuario Desconocido';
            const userMatricula = loan.usuario.Numcontrol || userId;
            const userCareer = loan.usuario.Carrera || 'No especificada';
            const loanDate = new Date(loan.fecha_prestamo);
            
            if (!userLoanMap[userId]) {
              userLoanMap[userId] = {
                name: userName,
                id: userMatricula,
                career: userCareer,
                loans: 0,
                lastLoan: null,
                userId: loan.usuario.id
              };
            }
            
            // Incrementar el contador de préstamos
            userLoanMap[userId].loans += 1;
            
            // Actualizar la fecha del último préstamo
            if (!userLoanMap[userId].lastLoan || loanDate > userLoanMap[userId].lastLoan) {
              userLoanMap[userId].lastLoan = loanDate;
            }
          });
          
          // Convertir el mapa a un array y ordenar por número de préstamos
          const sortedUsers = Object.values(userLoanMap)
            .sort((a, b) => b.loans - a.loans)
            .map(user => ({
              ...user,
              lastLoan: user.lastLoan ? formatDate(user.lastLoan.toISOString()) : 'N/A'
            }))
            .slice(0, 10); // Obtener solo los 10 primeros
          
          setTopActiveUsers(sortedUsers);
          
        } catch (error) {
          console.error("Error al procesar usuarios más activos:", error);
        }
        
        // Procesar los datos de actividad por día de la semana
        try {
          // Inicializar datos por día de la semana para préstamos y devoluciones
          const actividadPorDia: Record<string, { prestamos: number, devoluciones: number }> = {
            "Dom": { prestamos: 0, devoluciones: 0 },
            "Lun": { prestamos: 0, devoluciones: 0 },
            "Mar": { prestamos: 0, devoluciones: 0 },
            "Mié": { prestamos: 0, devoluciones: 0 },
            "Jue": { prestamos: 0, devoluciones: 0 },
            "Vie": { prestamos: 0, devoluciones: 0 },
            "Sáb": { prestamos: 0, devoluciones: 0 }
          };
          
          // Procesar todos los préstamos
          loans.forEach(loan => {
            // Fecha de préstamo
            const fechaPrestamo = new Date(loan.fecha_prestamo);
            const diaPrestamo = diasSemana[fechaPrestamo.getDay()]; // getDay() retorna 0-6 (Domingo-Sábado)
            
            // Incrementar contador de préstamos para ese día
            actividadPorDia[diaPrestamo].prestamos += 1;
            
            // Si el préstamo tiene fecha de devolución, contar también
            if (loan.estado === 'devuelto' && loan.fecha_devolucion_real) {
              const fechaDevolucion = new Date(loan.fecha_devolucion_real);
              const diaDevolucion = diasSemana[fechaDevolucion.getDay()];
              
              // Incrementar contador de devoluciones para ese día
              actividadPorDia[diaDevolucion].devoluciones += 1;
            }
          });
          
          // Convertir a formato para la gráfica (ordenar días de lunes a domingo)
          const diasOrdenados = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
          const datosGrafico = diasOrdenados.map(dia => ({
            name: dia,
            prestamos: actividadPorDia[dia].prestamos,
            devoluciones: actividadPorDia[dia].devoluciones,
            // Para mantener compatibilidad con la gráfica existente
            activos: actividadPorDia[dia].prestamos + actividadPorDia[dia].devoluciones
          }));
          
          setUserActivityChartData(datosGrafico);
        } catch (error) {
          console.error("Error al procesar datos de actividad por día:", error);
        }
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        // En caso de error, mantener los valores por defecto
      } finally {
        setIsLoading(false);
      }
    };

    if (isMounted && user && !(user.role === 'alumno' || user.role === 'authenticated')) {
      obtenerEstadisticas();
    }
  }, [isMounted, user]);
  
  // Si el componente no está montado, devolver un div vacío para evitar errores de hidratación
  if (!isMounted) {
    return <div className="min-h-screen"></div>;
  }
  
  // Si el usuario no está autenticado o no tiene permisos, no mostrar el contenido
  if (!user || (user && (user.role === 'alumno' || user.role === 'authenticated'))) {
    return <div className="min-h-screen"></div>;
  }

  // Formatea la fecha para mostrarla
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Función para mostrar los préstamos de un usuario
  const handleUserClick = async (userId: string | number, userName: string) => {
    try {
      setSelectedUserName(userName);
      setIsLoadingLoans(true);
      
      // Obtener todos los préstamos
      const loans = await loanService.getLoans();
      
      // Filtrar los préstamos del usuario seleccionado
      const userLoans = loans.filter(loan => {
        if (!loan.usuario) return false;
        
        const userIdStr = userId.toString();
        const loanUserId = typeof loan.usuario.id === 'number' || typeof loan.usuario.id === 'string' 
          ? loan.usuario.id.toString() 
          : '';
        const loanNumcontrol = loan.usuario.Numcontrol ? loan.usuario.Numcontrol.toString() : '';
        
        return loanUserId === userIdStr || loanNumcontrol === userIdStr;
      });
      
      setSelectedUserLoans(userLoans);
    } catch (error) {
      console.error("Error al obtener préstamos del usuario:", error);
    } finally {
      setIsLoadingLoans(false);
    }
  };
  
  // Función para limpiar la selección de usuario
  const clearSelectedUser = () => {
    setSelectedUserName(null);
    setSelectedUserLoans([]);
  };

  // Función para cargar libros prestados
  const loadLibrosPrestados = async () => {
    try {
      setIsLoadingLibros(true);
      
      // Obtener préstamos desde el servicio
      const loans = await loanService.getLoans();
      
      // Filtrar solo los préstamos activos
      const activoLoans = loans.filter(loan => loan.estado === 'activo');
      
      setLibrosPrestados(activoLoans);
      setShowLibrosPrestadosModal(true);
    } catch (error) {
      console.error("Error al cargar libros prestados:", error);
    } finally {
      setIsLoadingLibros(false);
    }
  };
  
  // Función para ver detalles de un libro prestado
  const showBookDetails = (loan: Loan) => {
    setSelectedBook(loan);
  };
  
  // Función para volver a la lista de libros prestados
  const clearSelectedBook = () => {
    setSelectedBook(null);
  };

  // Función para cargar préstamos del mes actual
  const loadPrestamosMes = async () => {
    try {
      setIsLoadingPrestamosMes(true);
      
      // Obtener todos los préstamos
      const loans = await loanService.getLoans();
      
      // Filtrar préstamos del mes actual
      const hoy = new Date();
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      
      const prestamosDelMes = loans.filter(loan => {
        const fechaPrestamo = new Date(loan.fecha_prestamo);
        return fechaPrestamo >= primerDiaMes && fechaPrestamo <= ultimoDiaMes;
      });
      
      // Ordenar por fecha, más recientes primero
      prestamosDelMes.sort((a, b) => 
        new Date(b.fecha_prestamo).getTime() - new Date(a.fecha_prestamo).getTime()
      );
      
      setPrestamosMes(prestamosDelMes);
      setShowTotalPrestamosModal(true);
    } catch (error) {
      console.error("Error al cargar préstamos del mes:", error);
    } finally {
      setIsLoadingPrestamosMes(false);
    }
  };
  
  // Función para ver detalles de un préstamo del mes
  const showPrestamoMesDetails = (loan: Loan) => {
    setSelectedPrestamoMes(loan);
  };
  
  // Función para volver a la lista de préstamos del mes
  const clearSelectedPrestamoMes = () => {
    setSelectedPrestamoMes(null);
  };

  // Función para cargar préstamos devueltos
  const loadPrestamosDevueltos = async () => {
    try {
      setIsLoadingDevueltos(true);
      
      // Obtener préstamos desde el servicio
      const loans = await loanService.getLoans();
      
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
          <p className="text-muted-foreground">
            Visualiza estadísticas y reportes del sistema
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker />
          
          <div className="flex items-center gap-2">
            <ReportFilters />
            <ReportExport />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlowCard
          onClick={loadPrestamosMes}
          tabIndex={0}
          role="button"
          aria-label="Ver préstamos del mes actual"
          style={{ cursor: 'pointer' }}
        >
          <Card className="bg-transparent shadow-none border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Préstamos</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "Cargando..." : prestamoStats.total}
              </div>
            <p className="text-xs text-muted-foreground">
                {isLoading ? "Calculando..." : `${prestamoStats.incremento.startsWith('-') ? '' : '+'}${prestamoStats.incremento}% desde el mes pasado`}
            </p>
          </CardContent>
        </Card>
        </GlowCard>
        
        <GlowCard
          onClick={loadLibrosPrestados}
          tabIndex={0}
          role="button"
          aria-label="Ver libros prestados actualmente"
          style={{ cursor: 'pointer' }}
        >
          <Card className="bg-transparent shadow-none border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Libros Prestados</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "Cargando..." : librosPrestadosStats.total}
              </div>
            <p className="text-xs text-muted-foreground">
                {isLoading ? "Calculando..." : `${librosPrestadosStats.incremento.startsWith('-') ? '' : '+'}${librosPrestadosStats.incremento}% desde la semana pasada`}
            </p>
          </CardContent>
        </Card>
        </GlowCard>
        
        <GlowCard
          onClick={() => setShowUsuariosActivosModal(true)}
          tabIndex={0}
          role="button"
          aria-label="Ver detalles de usuarios activos"
          style={{ cursor: 'pointer' }}
        >
          <Card className="bg-transparent shadow-none border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "Cargando..." : usuariosActivosStats.total}
              </div>
            <p className="text-xs text-muted-foreground">
                {isLoading ? "Calculando..." : `${usuariosActivosStats.incremento.startsWith('-') ? '' : '+'}${usuariosActivosStats.incremento}% desde el mes pasado`}
            </p>
          </CardContent>
        </Card>
        </GlowCard>
        
        <GlowCard
          onClick={loadPrestamosDevueltos}
          tabIndex={0}
          role="button"
          aria-label="Ver préstamos devueltos"
          style={{ cursor: 'pointer' }}
        >
          <Card className="bg-transparent shadow-none border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Devolución</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "Cargando..." : `${tasaDevolucionStats.porcentaje}%`}
              </div>
            <p className="text-xs text-muted-foreground">
                {isLoading ? "Calculando..." : `${tasaDevolucionStats.incremento.startsWith('-') ? '' : '+'}${tasaDevolucionStats.incremento}% desde el mes pasado`}
            </p>
          </CardContent>
        </Card>
        </GlowCard>
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3 mb-4">
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          <TabsTrigger value="books">Libros</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Préstamos vs Devoluciones
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-sm">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    Últimos 7 meses
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    <LineChart className="h-3.5 w-3.5 mr-1" />
                    Tendencias
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {isLoading ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                    <AreaChart
                        data={loanStatsChartData}
                      margin={{
                        top: 5,
                        right: 20,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient id="colorPrestados" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDevueltos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
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
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="prestados"
                        name="Préstamos"
                        stroke="hsl(var(--chart-1))"
                        fillOpacity={1}
                        fill="url(#colorPrestados)"
                      />
                      <Area
                        type="monotone"
                        dataKey="devueltos"
                        name="Devoluciones"
                        stroke="hsl(var(--chart-2))"
                        fillOpacity={1}
                        fill="url(#colorDevueltos)"
                      />
                    </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Filtrar por fecha
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Actividad de Usuarios</CardTitle>
                <CardDescription>
                  Actividad total (préstamos + devoluciones) por día
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {isLoading ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                    <RechartsLineChart
                        data={userActivityChartData}
                      margin={{
                        top: 5,
                        right: 20,
                        left: 0,
                        bottom: 0,
                      }}
                    >
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
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="activos"
                          name="Actividad Total"
                        stroke="hsl(var(--chart-3))"
                        activeDot={{ r: 8 }}
                      />
                    </RechartsLineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Filtrar por fecha
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="books" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Distribución por Categoría</CardTitle>
                <CardDescription>
                  Distribución de libros por categoría
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
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
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Libros Más Populares</CardTitle>
                <CardDescription>
                  Ranking de libros más prestados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      layout="vertical"
                      data={popularBooksData}
                      margin={{
                        top: 5,
                        right: 20,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" className="text-xs" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" width={100} className="text-xs" stroke="hsl(var(--muted-foreground))" />
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
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        name="Cantidad de Préstamos" 
                        fill="hsl(var(--chart-5))" 
                        radius={[0, 4, 4, 0]} 
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios más Activos</CardTitle>
              <CardDescription>
                Top 10 usuarios con mayor actividad de préstamos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Usuario</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        <div className="flex items-center space-x-1">
                          <span>ID</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Carrera</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Préstamos</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Último Préstamo</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="h-6 w-28 bg-muted rounded animate-pulse"></div>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                          </td>
                        </tr>
                      ))
                    ) : topActiveUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          No se encontraron datos de usuarios
                        </td>
                      </tr>
                    ) : (
                      topActiveUsers.map((user, i) => (
                        <tr 
                          key={i} 
                          className="border-b transition-colors hover:bg-muted/50 cursor-pointer" 
                          onClick={() => {
                            setShowUsuariosActivosModal(true);
                            handleUserClick(user.userId, user.name);
                          }}
                        >
                        <td className="p-4 align-middle">{user.name}</td>
                        <td className="p-4 align-middle">{user.id}</td>
                        <td className="p-4 align-middle">{user.career}</td>
                        <td className="p-4 align-middle">
                          <Badge variant="outline">{user.loans}</Badge>
                        </td>
                        <td className="p-4 align-middle">{user.lastLoan}</td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar a Excel
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Reportes Predefinidos</CardTitle>
          <CardDescription>
            Reportes comunes para descargar e imprimir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Inventario Completo", description: "Lista completa de todos los libros en el sistema", icon: <FileText className="h-5 w-5" />, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
              { title: "Préstamos Mensuales", description: "Reporte de préstamos del mes actual", icon: <FileBarChart className="h-5 w-5" />, color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
              { title: "Usuarios por Carrera", description: "Distribución de usuarios por carrera", icon: <PieChart className="h-5 w-5" />, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" },
              { title: "Devoluciones Pendientes", description: "Préstamos con devolución pendiente", icon: <FileText className="h-5 w-5" />, color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
              { title: "Top Libros del Semestre", description: "Libros más prestados este semestre", icon: <BarChart className="h-5 w-5" />, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" },
              { title: "Historial de Devoluciones", description: "Histórico de devoluciones por mes", icon: <LineChart className="h-5 w-5" />, color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400" },
            ].map((report, i) => (
              <div key={i} className="flex flex-col border rounded-lg overflow-hidden transition-all hover:shadow-md">
                <div className="p-4 flex items-start gap-4">
                  <div className={`${report.color} p-2 rounded-md`}>
                    {report.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">{report.title}</h3>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                </div>
                <div className="mt-auto p-4 pt-0 flex justify-end">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Total Préstamos (Préstamos del mes) */}
      <Dialog open={showTotalPrestamosModal} onOpenChange={(isOpen) => {
        setShowTotalPrestamosModal(isOpen);
        if (!isOpen) clearSelectedPrestamoMes();
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPrestamoMes ? `Detalles del préstamo` : "Préstamos del Mes Actual"}
            </DialogTitle>
            <DialogDescription>
              {selectedPrestamoMes 
                ? "Información detallada del préstamo" 
                : `Libros prestados durante ${new Date().toLocaleString('es-MX', { month: 'long', year: 'numeric' })}`}
            </DialogDescription>
          </DialogHeader>
          
          {/* Vista de lista de préstamos del mes */}
          {!selectedPrestamoMes && (
            <div className="space-y-4 mt-4">
              {isLoadingPrestamosMes ? (
                <>
                  <LoanSkeleton />
                  <LoanSkeleton />
                  <LoanSkeleton />
                </>
              ) : prestamosMes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay préstamos registrados este mes
                </p>
              ) : (
                <div className="animate-fade-in space-y-4">
                  {prestamosMes.map((loan, index) => {
                    // Definir iconos y colores según el estado
                    let IconComponent = BookMarked;
                    let iconColor = 'text-blue-600 dark:text-blue-400';
                    
                    switch (loan.estado) {
                      case 'devuelto':
                        IconComponent = BookOpenCheck;
                        iconColor = 'text-green-600 dark:text-green-400';
                        break;
                      case 'atrasado':
                        IconComponent = Clock;
                        iconColor = 'text-orange-600 dark:text-orange-400';
                        break;
                      case 'perdido':
                        IconComponent = BookOpenText;
                        iconColor = 'text-red-600 dark:text-red-400';
                        break;
                      case 'renovado':
                        IconComponent = RotateCw;
                        iconColor = 'text-blue-600 dark:text-blue-400';
                        break;
                      default:
                        IconComponent = BookMarked;
                        iconColor = 'text-blue-600 dark:text-blue-400';
                    }
                    
                    return (
                      <Card 
                        key={index} 
                        className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => showPrestamoMesDetails(loan)}
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
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(loan.fecha_prestamo)}
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  onClick={() => {
                    setShowTotalPrestamosModal(false);
                    router.push('/prestamos');
                  }}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver en "Préstamos"
                </Button>
              </DialogFooter>
            </div>
          )}
          
          {/* Vista de detalles del préstamo */}
          {selectedPrestamoMes && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearSelectedPrestamoMes}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a la lista
                </Button>
              </div>
              
              <div className="space-y-4 animate-fade-in">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {selectedPrestamoMes.book?.titulo || 'Sin título'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedPrestamoMes.book?.autor || 'Autor desconocido'}
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
                              {selectedPrestamoMes.usuario?.username || 'Usuario desconocido'}
                            </p>
                          </div>
                          {selectedPrestamoMes.usuario?.Numcontrol && (
                            <p className="text-xs text-muted-foreground pl-6">
                              ID: {selectedPrestamoMes.usuario.Numcontrol}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Estado
                          </h4>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(selectedPrestamoMes.estado)}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Fecha de préstamo
                          </h4>
                          <p className="text-sm">{formatDate(selectedPrestamoMes.fecha_prestamo)}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Fecha de devolución esperada
                          </h4>
                          <p className="text-sm">{formatDate(selectedPrestamoMes.fecha_devolucion_esperada)}</p>
                        </div>
                        
                        {selectedPrestamoMes.estado === 'devuelto' && selectedPrestamoMes.fecha_devolucion_real && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">
                              Fecha de devolución real
                            </h4>
                            <p className="text-sm">{formatDate(selectedPrestamoMes.fecha_devolucion_real)}</p>
                          </div>
                        )}
                      </div>
                      
                      {selectedPrestamoMes.notas && (
                        <div className="pt-2">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Notas
                          </h4>
                          <p className="text-sm p-3 bg-muted rounded-md">
                            {selectedPrestamoMes.notas}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => {
                      router.push(`/prestamos/${selectedPrestamoMes.id}`);
                      setShowTotalPrestamosModal(false);
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver detalles completos
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Libros Prestados */}
      <Dialog open={showLibrosPrestadosModal} onOpenChange={(isOpen) => {
        setShowLibrosPrestadosModal(isOpen);
        if (!isOpen) clearSelectedBook();
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBook ? `Detalles del préstamo` : "Libros Prestados"}
            </DialogTitle>
            <DialogDescription>
              {selectedBook 
                ? "Información detallada del préstamo" 
                : "Lista de libros actualmente en préstamo"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Vista de lista de libros prestados */}
          {!selectedBook && (
            <div className="space-y-4 mt-4">
              {isLoadingLibros ? (
                <>
                  <LoanSkeleton />
                  <LoanSkeleton />
                  <LoanSkeleton />
                </>
              ) : librosPrestados.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay libros prestados actualmente
                </p>
              ) : (
                <div className="animate-fade-in space-y-4">
                  {librosPrestados.map((loan, index) => {
                    // Definir iconos y colores según el estado
                    let IconComponent = BookMarked;
                    let iconColor = 'text-blue-600 dark:text-blue-400';
                    
                    switch (loan.estado) {
                      case 'devuelto':
                        IconComponent = BookOpenCheck;
                        iconColor = 'text-green-600 dark:text-green-400';
                        break;
                      case 'atrasado':
                        IconComponent = Clock;
                        iconColor = 'text-orange-600 dark:text-orange-400';
                        break;
                      case 'perdido':
                        IconComponent = BookOpenText;
                        iconColor = 'text-red-600 dark:text-red-400';
                        break;
                      case 'renovado':
                        IconComponent = RotateCw;
                        iconColor = 'text-blue-600 dark:text-blue-400';
                        break;
                      default:
                        IconComponent = BookMarked;
                        iconColor = 'text-blue-600 dark:text-blue-400';
                    }
                    
                    return (
                      <Card 
                        key={index} 
                        className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => showBookDetails(loan)}
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
                                <p className="text-xs text-muted-foreground">
                                  Desde: {formatDate(loan.fecha_prestamo)}
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  onClick={() => {
                    setShowLibrosPrestadosModal(false);
                    router.push('/prestamos?estado=activo');
                  }}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver en "Préstamos"
                </Button>
              </DialogFooter>
            </div>
          )}
          
          {/* Vista de detalles del préstamo */}
          {selectedBook && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearSelectedBook}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a la lista
                </Button>
              </div>
              
              <div className="space-y-4 animate-fade-in">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {selectedBook.book?.titulo || 'Sin título'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedBook.book?.autor || 'Autor desconocido'}
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
                              {selectedBook.usuario?.username || 'Usuario desconocido'}
                            </p>
                          </div>
                          {selectedBook.usuario?.Numcontrol && (
                            <p className="text-xs text-muted-foreground pl-6">
                              ID: {selectedBook.usuario.Numcontrol}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Estado
                          </h4>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(selectedBook.estado)}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Fecha de préstamo
                          </h4>
                          <p className="text-sm">{formatDate(selectedBook.fecha_prestamo)}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Fecha de devolución esperada
                          </h4>
                          <p className="text-sm">{formatDate(selectedBook.fecha_devolucion_esperada)}</p>
                        </div>
                      </div>
                      
                      {selectedBook.notas && (
                        <div className="pt-2">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Notas
                          </h4>
                          <p className="text-sm p-3 bg-muted rounded-md">
                            {selectedBook.notas}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => {
                      router.push(`/prestamos/${selectedBook.id}`);
                      setShowLibrosPrestadosModal(false);
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver detalles completos
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Usuarios Activos */}
      <Dialog open={showUsuariosActivosModal} onOpenChange={(isOpen) => {
        setShowUsuariosActivosModal(isOpen);
        if (!isOpen) clearSelectedUser();
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUserName ? `Préstamos de ${selectedUserName}` : "Usuarios Activos"}
            </DialogTitle>
            <DialogDescription>
              {selectedUserName 
                ? "Historial de préstamos realizados por el usuario" 
                : "Lista de usuarios con estado \"Activo\" en el sistema"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Vista de lista de usuarios */}
          {!selectedUserName && (
            <div className="space-y-4 mt-4">
              {usuariosActivos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isLoading ? "Cargando usuarios..." : "No hay usuarios activos en el sistema"}
                </p>
              ) : (
                usuariosActivos.map((user) => (
                  <Card 
                    key={user.id} 
                    className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => handleUserClick(user.Numcontrol || user.id, user.username)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <span className="text-base font-medium text-blue-600 dark:text-blue-400">
                            {user.username.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium leading-none">
                              {user.username}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {user.Numcontrol || user.id}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Registro: {formatDate(user.createdAt)}
                            </p>
                          </div>
                          {user.Carrera && (
                            <div className="flex items-center gap-1 mt-1">
                              <GraduationCap className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">{user.Carrera}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
              
              <DialogFooter>
                <Button 
                  onClick={() => {
                    setShowUsuariosActivosModal(false);
                    router.push('/usuarios?estado=Activo');
                  }}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir en "Usuarios"
                </Button>
              </DialogFooter>
            </div>
          )}
          
          {/* Vista de préstamos del usuario */}
          {selectedUserName && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearSelectedUser}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a usuarios
                </Button>
              </div>
              
              <div className="space-y-4">
                {isLoadingLoans ? (
                  // Mostrar skeletons durante la carga
                  <>
                    <LoanSkeleton />
                    <LoanSkeleton />
                    <LoanSkeleton />
                  </>
                ) : selectedUserLoans.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No se encontraron préstamos para este usuario
                  </p>
                ) : (
                  <div className="animate-fade-in space-y-4">
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
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Tasa de Devolución */}
      <Dialog open={showTasaDevolucionModal} onOpenChange={(isOpen) => {
        setShowTasaDevolucionModal(isOpen);
        if (!isOpen) clearSelectedDevolucion();
      }}>
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
                              <div className="bg-slate-500 hover:bg-slate-600 text-xs px-2 py-0.5 text-white rounded-md flex items-center">
                                <CircleCheck className="h-3 w-3 mr-1" />
                                Devuelto
                              </div>
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
                                  Devuelto: {formatDate(loan.fecha_devolucion_real || '')}
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
                            <div className="bg-slate-500 hover:bg-slate-600 text-xs px-2 py-0.5 text-white rounded-md flex items-center">
                              <CircleCheck className="h-3 w-3 mr-1" />
                              Devuelto
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Fecha de préstamo
                          </h4>
                          <p className="text-sm">{formatDate(selectedDevolucion.fecha_prestamo)}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Fecha de devolución esperada
                          </h4>
                          <p className="text-sm">{formatDate(selectedDevolucion.fecha_devolucion_esperada)}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Fecha de devolución real
                          </h4>
                          <p className="text-sm">{formatDate(selectedDevolucion.fecha_devolucion_real || '')}</p>
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
    </div>
  );
}