import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, BarChart3, LogIn } from 'lucide-react';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="py-12 bg-gradient-to-r from-blue-900 to-blue-700 rounded-lg text-white mb-10">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sistema de Gestión Bibliotecaria</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Una solución completa para administrar catálogos, préstamos y usuarios de su biblioteca.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
              <Link href="/login" className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Iniciar Sesión
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-center">Funcionalidades Principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Gestión de Catálogo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-gray-700 min-h-[100px]">
                Administre su colección completa con información detallada sobre ubicación, disponibilidad y estado de cada ejemplar.
              </CardDescription>
              
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Gestión de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-gray-700 min-h-[100px]">
                Administre los usuarios del sistema con distintos roles, permisos y seguimiento de actividad.
              </CardDescription>
              
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Reportes y Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-gray-700 min-h-[100px]">
                Genere informes detallados sobre préstamos, consultas, usuarios y más para tomar decisiones informadas.
              </CardDescription>
              
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}