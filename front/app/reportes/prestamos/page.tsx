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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  BookMarked,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BookX,
} from "lucide-react";

const loanStats = [
  { name: "Ene", prestados: 65, devueltos: 45, atrasados: 12 },
  { name: "Feb", prestados: 59, devueltos: 50, atrasados: 8 },
  { name: "Mar", prestados: 80, devueltos: 70, atrasados: 15 },
  { name: "Abr", prestados: 81, devueltos: 60, atrasados: 20 },
  { name: "May", prestados: 56, devueltos: 45, atrasados: 10 },
  { name: "Jun", prestados: 55, devueltos: 48, atrasados: 5 },
  { name: "Jul", prestados: 72, devueltos: 60, atrasados: 8 },
];

export default function ReportesPrestamosPage() {
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
          <h2 className="text-3xl font-bold tracking-tight">Reporte de Préstamos</h2>
          <p className="text-muted-foreground">
            Análisis detallado de préstamos y devoluciones
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
          title="Préstamos Activos"
          value="342"
          description="desde el mes pasado"
          trend={{ value: 12, isPositive: true }}
          icon={<BookMarked className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Tiempo Promedio"
          value="14 días"
          description="de duración del préstamo"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Préstamos Atrasados"
          value="28"
          description="desde la semana pasada"
          trend={{ value: 8, isPositive: false }}
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Tasa de Devolución"
          value="92%"
          description="en el último mes"
          trend={{ value: 5, isPositive: true }}
          icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Tendencia de Préstamos"
          description="Análisis mensual de préstamos y devoluciones"
        >
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={loanStats}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
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
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Préstamos por Estado"
          description="Distribución actual de préstamos"
        >
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Activos", value: 342 },
                  { name: "Atrasados", value: 28 },
                  { name: "Devueltos", value: 892 },
                  { name: "Perdidos", value: 12 },
                ]}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
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
                  dataKey="value" 
                  name="Cantidad"
                  fill="hsl(var(--chart-3))" 
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