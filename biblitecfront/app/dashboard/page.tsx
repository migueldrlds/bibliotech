"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/context/user-context';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  BarChart3, 
  BookMarked, 
  TrendingUp, 
  TrendingDown, 
  History,
  RefreshCw
} from 'lucide-react';
import StatsCard from '@/components/stats-card';
import { useToast } from '@/hooks/use-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { bookService } from '@/services/bookService';
import { userService } from '@/services/userService';
import { loanService } from '@/services/loanService';

// Mock data for charts
const monthlyVisitsData = [
  { name: 'Ene', visits: 524 },
  { name: 'Feb', visits: 621 },
  { name: 'Mar', visits: 573 },
  { name: 'Abr', visits: 610 },
  { name: 'May', visits: 588 },
  { name: 'Jun', visits: 642 },
  { name: 'Jul', visits: 680 },
  { name: 'Ago', visits: 701 },
  { name: 'Sep', visits: 610 },
  { name: 'Oct', visits: 590 },
  { name: 'Nov', visits: 632 },
  { name: 'Dic', visits: 550 },
];

const booksByGenreData = [
  { name: 'Ciencia Ficción', books: 420 },
  { name: 'Historia', books: 380 },
  { name: 'Biografía', books: 340 },
  { name: 'Poesía', books: 210 },
  { name: 'Ensayo', books: 290 },
  { name: 'Infantil', books: 320 },
  { name: 'Novela', books: 520 },
];

const loansByDayData = [
  { name: 'Lun', loans: 38 },
  { name: 'Mar', loans: 52 },
  { name: 'Mié', loans: 61 },
  { name: 'Jue', loans: 45 },
  { name: 'Vie', loans: 73 },
  { name: 'Sáb', loans: 29 },
  { name: 'Dom', loans: 18 },
];

const usersByRoleData = [
  { name: 'Estudiantes', value: 540 },
  { name: 'Profesores', value: 120 },
  { name: 'Personal', value: 85 },
  { name: 'Externos', value: 25 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface Activity {
  id: string;
  action: 'Préstamo' | 'Devolución';
  book: string;
  user: string;
  time: string;
  date: string;
  timestamp: number;
}

interface BookItem {
  id: string;
  attributes: {
    titulo?: string;
    autor?: string;
    clasificacion?: string;
    [key: string]: any;
  };
  titulo?: string;
  autor?: string;
  clasificacion?: string;
  [key: string]: any;
}

export default function Dashboard() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [totalBooks, setTotalBooks] = useState("...");
  const [newBooksThisMonth, setNewBooksThisMonth] = useState("...");
  const [totalUsers, setTotalUsers] = useState("...");
  const [newUsersThisMonth, setNewUsersThisMonth] = useState("...");
  const [activeLoans, setActiveLoans] = useState("...");
  const [newLoansThisWeek, setNewLoansThisWeek] = useState("...");
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (!loading) {
      console.log("Verificando acceso al dashboard, usuario:", user);
      console.log("Rol del usuario:", user?.role);
      
      if (!user) {
        toast({
          title: "Acceso denegado",
          description: "Debe iniciar sesión para acceder al panel de control",
          variant: "destructive",
        });
        router.push('/login');
        return;
      } 
      
      // Verificar explícitamente roles permitidos: alumno no puede acceder
      const userRole = user.role?.toLowerCase() || '';
      console.log("Rol del usuario (lowercase):", userRole);
      
      // Lista de roles NO permitidos
      const restrictedRoles = ['alumno', 'authenticated'];
      const isRestricted = restrictedRoles.some(role => userRole.includes(role));
      
      if (isRestricted) {
        console.log("Usuario con rol restringido detectado, redirigiendo...");
        toast({
          title: "Acceso restringido",
          description: "No tienes permisos para acceder al panel de control",
          variant: "destructive",
        });
        router.push('/catalogo');
        return;
      }
      
      console.log("Acceso permitido para rol:", userRole);
    }
  }, [user, loading, router, toast]);

  useEffect(() => {
    // Cargar el número total de libros y los añadidos este mes
    const fetchBooksData = async () => {
      try {
        const response = await bookService.getBooks();
        
        if (response && response.data) {
          // Calcular el total de libros
          const total = response.meta?.pagination?.total || response.data.length || 0;
          setTotalBooks(total.toLocaleString('es-ES'));
          
          // Calcular libros añadidos este mes
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          const newBooks = response.data.filter((book: { createdAt?: string | Date }) => {
            if (!book.createdAt) return false;
            const createdDate = new Date(book.createdAt);
            return createdDate.getMonth() === currentMonth && 
                   createdDate.getFullYear() === currentYear;
          });
          
          setNewBooksThisMonth(`+${newBooks.length}`);
        }
      } catch (error) {
        console.error("Error al obtener libros:", error);
        setTotalBooks("Error");
        setNewBooksThisMonth("Error");
      }
    };
    
    // Cargar el número total de usuarios y los añadidos este mes
    const fetchUsersData = async () => {
      try {
        const users = await userService.getUsers();
        
        if (users && Array.isArray(users)) {
          // Calcular el total de usuarios
          const total = users.length;
          setTotalUsers(total.toLocaleString('es-ES'));
          
          // Calcular usuarios añadidos este mes
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          const newUsers = users.filter(user => {
            if (!user.createdAt) return false;
            const createdDate = new Date(user.createdAt);
            return createdDate.getMonth() === currentMonth && 
                   createdDate.getFullYear() === currentYear;
          });
          
          setNewUsersThisMonth(`+${newUsers.length}`);
        }
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
        setTotalUsers("Error");
        setNewUsersThisMonth("Error");
      }
    };
    
    // Cargar el número de préstamos activos y los añadidos esta semana
    const fetchLoansData = async () => {
      try {
        // Obtener préstamos activos
        const response = await fetch('http://localhost:1337/api/loans?filters[estado]=activo&populate=*');
        const data = await response.json();
        
        if (data && data.data) {
          setActiveLoans(data.data.length.toLocaleString('es-ES'));
          
          // Calcular préstamos añadidos esta semana
          const now = new Date();
          const oneWeekAgo = new Date(now);
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          
          // Obtener préstamos de la última semana
          const recentResponse = await fetch(`http://localhost:1337/api/loans?filters[fecha_prestamo][$gte]=${oneWeekAgo.toISOString().split('T')[0]}`);
          const recentData = await recentResponse.json();
          
          if (recentData && recentData.data) {
            setNewLoansThisWeek(`+${recentData.data.length}`);
          }
        }
      } catch (error) {
        console.error("Error al obtener préstamos:", error);
        setActiveLoans("Error");
        setNewLoansThisWeek("Error");
      }
    };

    const fetchRecentActivities = async () => {
      try {
        const response = await loanService.getLoans();
        let activities: Activity[] = [];
        
        if (response && response.data) {
          // Convertir los préstamos en actividades
          activities = response.data
            .map((loan: any) => {
              const bookData = loan.attributes?.book?.data;
              const userData = loan.attributes?.usuario?.data;
              
              const bookTitle = bookData?.attributes?.titulo || 'Libro no disponible';
              const userName = userData?.attributes?.username || 
                            userData?.attributes?.email || 
                            'Usuario no disponible';
              
              const fechaPrestamo = new Date(loan.attributes.fecha_prestamo);
              const fechaDevolucion = loan.attributes.fecha_devolucion_real ? 
                new Date(loan.attributes.fecha_devolucion_real) : null;
              
              const activities: Activity[] = [];
              
              // Crear una entrada para el préstamo
              activities.push({
                id: `loan-${loan.id}`,
                action: 'Préstamo',
                book: bookTitle,
                user: userName,
                time: fechaPrestamo.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                date: isToday(fechaPrestamo) ? 'Hoy' : 
                      isYesterday(fechaPrestamo) ? 'Ayer' : 
                      fechaPrestamo.toLocaleDateString('es-ES'),
                timestamp: fechaPrestamo.getTime()
              });

              // Si hay devolución, crear otra entrada
              if (fechaDevolucion) {
                activities.push({
                  id: `return-${loan.id}`,
                  action: 'Devolución',
                  book: bookTitle,
                  user: userName,
                  time: fechaDevolucion.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                  date: isToday(fechaDevolucion) ? 'Hoy' : 
                        isYesterday(fechaDevolucion) ? 'Ayer' : 
                        fechaDevolucion.toLocaleDateString('es-ES'),
                  timestamp: fechaDevolucion.getTime()
                });
              }

              return activities;
            })
            .flat();

          // Ordenar por fecha más reciente primero y limitar a 5 actividades
          activities.sort((a, b) => b.timestamp - a.timestamp);
          activities = activities.slice(0, 5);
        }
        
        setRecentActivities(activities);
      } catch (error) {
        console.error("Error al cargar actividades recientes:", error);
        setRecentActivities([]);
      }
    };

    // Funciones auxiliares para determinar si una fecha es hoy o ayer
    const isToday = (date: Date) => {
      const today = new Date();
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
    };

    const isYesterday = (date: Date) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return date.getDate() === yesterday.getDate() &&
             date.getMonth() === yesterday.getMonth() &&
             date.getFullYear() === yesterday.getFullYear();
    };

    if (user) {
      fetchBooksData();
      fetchUsersData();
      fetchLoansData();
      fetchRecentActivities();
    }
  }, [user]);

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
          <h1 className="text-3xl font-bold">Biblioteca Digital</h1>
          <p className="text-muted-foreground mt-1">
            Resumen y estadísticas del sistema bibliotecario
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="rounded-full bg-primary/10 p-2">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-medium">Actualizado</p>
            <p className="text-muted-foreground">{new Date().toLocaleString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}</p>
          </div>
        </div>
      </div>
      
      {/* Resumen principal - Tarjetas con estadísticas clave */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
        <StatsCard 
          title="Libros" 
          value={totalBooks} 
          description="Total en catálogo" 
          icon={<BookOpen className="h-6 w-6" />} 
          trend={{ value: newBooksThisMonth, label: "este mes", positive: true }}
        />
        
        <StatsCard 
          title="Préstamos Activos" 
          value={activeLoans} 
          description="Pendientes de devolución" 
          icon={<BookMarked className="h-6 w-6" />} 
          trend={{ value: newLoansThisWeek, label: "esta semana", positive: true }}
        />
        
        <StatsCard 
          title="Usuarios" 
          value={totalUsers} 
          description="Usuarios registrados" 
          icon={<Users className="h-6 w-6" />} 
          trend={{ value: newUsersThisMonth, label: "este mes", positive: true }}
        />
      </div>

      {/* Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>
                  Últimas acciones registradas en el sistema
                </CardDescription>
              </div>
              <History className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 py-2 border-b last:border-b-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      {activity.action === 'Préstamo' && <BookMarked className="h-5 w-5" />}
                      {activity.action === 'Devolución' && <RefreshCw className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Libro:</span> {activity.book}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Usuario:</span> {activity.user}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{activity.time}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No hay actividades recientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Distribución de Usuarios</CardTitle>
                <CardDescription>
                  Por tipo de usuario
                </CardDescription>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usersByRoleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label
                  >
                    {usersByRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráficos principales */}
      <Tabs defaultValue="loans" className="space-y-4">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-3 gap-2">
          <TabsTrigger value="loans">Préstamos</TabsTrigger>
          <TabsTrigger value="visits">Visitas</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
        </TabsList>
        
        <TabsContent value="loans">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Préstamos</CardTitle>
              <CardDescription>
                Tendencias en la actividad de préstamos por día
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={loansByDayData}>
                      <defs>
                        <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        name="Préstamos"
                        dataKey="loans" 
                        fill="url(#colorLoans)" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Promedio diario</p>
                          <p className="text-2xl font-bold">45</p>
                        </div>
                        <BarChart3 className="text-blue-500 h-8 w-8" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Día más activo</p>
                          <p className="text-2xl font-bold">Viernes</p>
                        </div>
                        <Calendar className="text-green-500 h-8 w-8" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Devoluciones</p>
                          <p className="text-2xl font-bold">82%</p>
                        </div>
                        <RefreshCw className="text-orange-500 h-8 w-8" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tendencia</p>
                          <p className="text-2xl font-bold">+8.2%</p>
                        </div>
                        <TrendingUp className="text-green-500 h-8 w-8" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="visits">
          <Card>
            <CardHeader>
              <CardTitle>Visitas Mensuales</CardTitle>
              <CardDescription>
                Flujo de visitantes a la biblioteca durante el último año
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyVisitsData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="visits" 
                      stroke="hsl(var(--chart-1))" 
                      fillOpacity={1} 
                      fill="url(#colorVisits)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Inventario</CardTitle>
              <CardDescription>
                Estadísticas detalladas del catálogo de libros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={booksByGenreData}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar name="Cantidad de Libros" dataKey="books" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Libros disponibles</p>
                          <p className="text-2xl font-bold">4,821</p>
                        </div>
                        <BookOpen className="text-green-500 h-8 w-8" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">En préstamo</p>
                          <p className="text-2xl font-bold">459</p>
                        </div>
                        <BookMarked className="text-orange-500 h-8 w-8" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Género popular</p>
                          <p className="text-2xl font-bold">Novela</p>
                        </div>
                        <TrendingUp className="text-blue-500 h-8 w-8" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Nuevos este mes</p>
                          <p className="text-2xl font-bold">42</p>
                        </div>
                        <BookPlus className="text-green-500 h-8 w-8" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// These components are used in the Dashboard but not defined elsewhere
function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function BookPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M9 10h6" />
      <path d="M12 7v6" />
    </svg>
  );
}

function UserPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}

function LogIn(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" x2="3" y1="12" y2="12" />
    </svg>
  );
}