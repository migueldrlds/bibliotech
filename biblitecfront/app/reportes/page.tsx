"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  FileText, 
  Filter, 
  Search, 
  Download, 
  Plus, 
  BarChart3, 
  BookOpen, 
  Users, 
  Calendar,
  ArrowDownToLine, 
  RefreshCw
} from 'lucide-react';
import { mockReports } from '@/data/mockData';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';

export default function ReportesPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast({
          title: "Acceso denegado",
          description: "Debe iniciar sesión para acceder a esta página",
          variant: "destructive",
        });
        router.push('/login');
      } else if (user.role !== 'admin' && user.role !== 'librarian') {
        toast({
          title: "Acceso denegado",
          description: "No tiene permisos para acceder a esta página",
          variant: "destructive",
        });
        router.push('/dashboard');
      }
    }
  }, [user, loading, router, toast]);

  if (loading || !user || (user.role !== 'admin' && user.role !== 'librarian')) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Filter reports based on search, type filter and status (via tab)
  const filteredReports = mockReports.filter(report => {
    const matchesSearch = !searchTerm || 
                          report.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    
    const matchesStatus = activeTab === 'all' || 
                          (activeTab === 'completed' && report.status === 'completed') ||
                          (activeTab === 'processing' && report.status === 'processing');
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const reportCards = [
    {
      title: "Préstamos Mensuales",
      description: "Informe detallado de todos los préstamos realizados en el mes actual.",
      icon: BookOpen,
      type: "loans",
    },
    {
      title: "Estadísticas de Usuarios",
      description: "Análisis de usuarios activos, nuevos registros y patrones de préstamo.",
      icon: Users,
      type: "users",
    },
    {
      title: "Libros Populares",
      description: "Ranking de los libros más consultados y prestados.",
      icon: BarChart3,
      type: "books",
    },
    {
      title: "Registro de Visitas",
      description: "Datos sobre visitas diarias a la biblioteca y horas pico.",
      icon: Calendar,
      type: "entries",
    },
  ];

  const handleGenerateReport = (reportType: string) => {
    toast({
      title: "Generando informe",
      description: `El informe se está generando y estará disponible en breve.`,
    });
  };

  const downloadReport = (report) => {
    if (report.status !== 'completed') {
      toast({
        title: "Informe no disponible",
        description: "El informe aún se está procesando y no está disponible para descarga.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Descargando informe",
      description: `Descargando ${report.title}`,
    });
    
    // In a real app, this would redirect to the download URL
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Informes y Estadísticas</h1>
          <p className="text-muted-foreground mt-1">
            Genere y consulte informes detallados sobre la biblioteca
          </p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Informe Personalizado
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="completed">Completados</TabsTrigger>
            <TabsTrigger value="processing">En proceso</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-4 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar informes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="sm:w-[180px] w-full">
                <SelectValue placeholder="Tipo de informe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="loans">Préstamos</SelectItem>
                <SelectItem value="returns">Devoluciones</SelectItem>
                <SelectItem value="users">Usuarios</SelectItem>
                <SelectItem value="books">Libros</SelectItem>
                <SelectItem value="entries">Visitas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(searchTerm || typeFilter) && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mr-2">Filtros activos:</span>
            
            {searchTerm && (
              <Badge variant="outline" className="flex items-center gap-1">
                Búsqueda: {searchTerm}
                <button 
                  onClick={() => setSearchTerm('')}
                  className="ml-1 hover:text-destructive"
                >
                  &times;
                </button>
              </Badge>
            )}
            
            {typeFilter && typeFilter !== 'all' && (
              <Badge variant="outline" className="flex items-center gap-1">
                Tipo: {
                  typeFilter === 'loans' ? 'Préstamos' :
                  typeFilter === 'returns' ? 'Devoluciones' :
                  typeFilter === 'users' ? 'Usuarios' :
                  typeFilter === 'books' ? 'Libros' :
                  typeFilter === 'entries' ? 'Visitas' :
                  'Personalizado'
                }
                <button 
                  onClick={() => setTypeFilter('all')}
                  className="ml-1 hover:text-destructive"
                >
                  &times;
                </button>
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
              }}
              className="ml-auto text-sm"
            >
              Limpiar filtros
            </Button>
          </div>
        )}
        
        <TabsContent value="all" className="space-y-6">
          {/* Informes rápidos */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Informes Rápidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportCards.map((card, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <card.icon className="h-5 w-5 text-primary" />
                        {card.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="min-h-[60px]">{card.description}</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleGenerateReport(card.type)}
                    >
                      <ArrowDownToLine className="h-4 w-4 mr-2" />
                      Generar Ahora
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Informes generados */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Informes Generados</h2>
            {filteredReports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No se encontraron informes</h3>
                  <p className="text-muted-foreground mt-1">
                    No hay informes que coincidan con los criterios seleccionados
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-lg">Historial de Informes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Periodo</TableHead>
                          <TableHead>Generado por</TableHead>
                          <TableHead>Formato</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">{report.title}</TableCell>
                            <TableCell>
                              <ReportTypeBadge type={report.type} />
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>
                                  {format(new Date(report.dateRange.from), 'dd/MM/yyyy', { locale: es })}
                                </div>
                                <div className="text-muted-foreground">
                                  a {format(new Date(report.dateRange.to), 'dd/MM/yyyy', { locale: es })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{report.generatedBy}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {report.format.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <ReportStatusBadge status={report.status} />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant={report.status === 'completed' ? 'default' : 'outline'}
                                onClick={() => downloadReport(report)}
                                disabled={report.status !== 'completed'}
                                className="flex items-center gap-1"
                              >
                                {report.status === 'completed' ? (
                                  <>
                                    <Download className="h-3.5 w-3.5" />
                                    Descargar
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    Procesando
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-6">
          <Card>
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-lg">Informes Completados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Generado por</TableHead>
                      <TableHead>Formato</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>
                          <ReportTypeBadge type={report.type} />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              {format(new Date(report.dateRange.from), 'dd/MM/yyyy', { locale: es })}
                            </div>
                            <div className="text-muted-foreground">
                              a {format(new Date(report.dateRange.to), 'dd/MM/yyyy', { locale: es })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{report.generatedBy}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {report.format.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => downloadReport(report)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Descargar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="processing" className="space-y-6">
          <Card>
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-lg">Informes en Proceso</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Generado por</TableHead>
                      <TableHead>Formato</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>
                          <ReportTypeBadge type={report.type} />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              {format(new Date(report.dateRange.from), 'dd/MM/yyyy', { locale: es })}
                            </div>
                            <div className="text-muted-foreground">
                              a {format(new Date(report.dateRange.to), 'dd/MM/yyyy', { locale: es })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{report.generatedBy}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {report.format.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                            <span>Procesando</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportTypeBadge({ type }: { type: string }) {
  switch(type) {
    case 'loans':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
          <BookOpen className="h-3 w-3 mr-1" />
          Préstamos
        </Badge>
      );
    case 'returns':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
          <ArrowDownToLine className="h-3 w-3 mr-1" />
          Devoluciones
        </Badge>
      );
    case 'users':
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
          <Users className="h-3 w-3 mr-1" />
          Usuarios
        </Badge>
      );
    case 'books':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
          <BookOpen className="h-3 w-3 mr-1" />
          Libros
        </Badge>
      );
    case 'entries':
      return (
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
          <Calendar className="h-3 w-3 mr-1" />
          Visitas
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <FileText className="h-3 w-3 mr-1" />
          Personalizado
        </Badge>
      );
  }
}

function ReportStatusBadge({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
        Completado
      </Badge>
    );
  } else if (status === 'processing') {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
        Procesando
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
        Error
      </Badge>
    );
  }
}