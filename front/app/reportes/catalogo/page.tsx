"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '@/context/user-context';
import { ChartCard } from "@/components/reports/chart-card";
import { StatsCard } from "@/components/reports/stats-card";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportExport } from "@/components/reports/report-export";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  BookText,
  Newspaper,
  BookCopy,
  ArrowUpDown,
} from "lucide-react";

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const categoryData = [
  { name: "Ciencias", value: 15420 },
  { name: "Ingeniería", value: 25340 },
  { name: "Humanidades", value: 12450 },
  { name: "Ciencias Sociales", value: 18650 },
  { name: "Otros", value: 3952 },
];

const locationData = [
  { name: "Tomás Aquino", libros: 45487, revistas: 6392 },
  { name: "Otay", libros: 30325, revistas: 4262 },
];

export default function ReportesCatalogoPage() {
  const router = useRouter();
  const { user, isAdmin, hasRole } = useUser();
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
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reporte de Catálogo</h2>
          <p className="text-muted-foreground">
            Análisis del acervo bibliográfico
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Libros"
          value="75,812"
          description="volúmenes en existencia"
          icon={<BookText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Publicaciones Periódicas"
          value="10,654"
          description="revistas y journals"
          icon={<Newspaper className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Ejemplares Disponibles"
          value="68,234"
          description="para préstamo"
          trend={{ value: 3, isPositive: true }}
          icon={<BookCopy className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Tasa de Rotación"
          value="4.2"
          description="préstamos por ejemplar"
          trend={{ value: 8, isPositive: true }}
          icon={<ArrowUpDown className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Distribución por Categoría"
          description="Distribución del acervo por área temática"
        >
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={130}
                  fill="#8884d8"
                  dataKey="value"
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
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Distribución por Unidad"
          description="Comparativa entre unidades académicas"
        >
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={locationData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
                <Bar 
                  dataKey="libros" 
                  name="Libros"
                  fill="hsl(var(--chart-1))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="revistas" 
                  name="Revistas"
                  fill="hsl(var(--chart-2))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}