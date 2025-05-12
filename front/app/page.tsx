import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Library, Search, BookOpen, MapPin, Clock, GraduationCap, BookText } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-4 right-6 z-10 flex items-center gap-3 animate-fade-in">
        <Button asChild variant="ghost" size="icon-sm" className="rounded-full">
          <Link href="/catalogo">
            <BookOpen className="h-[1.1rem] w-[1.1rem]" />
            <span className="sr-only">Ver catálogo</span>
          </Link>
        </Button>
        <ThemeToggle size="sm" />
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="container mx-auto px-6 py-24 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8 animate-fade-up">
                <div className="flex items-center space-x-2 mb-8">
                  <Library className="h-8 w-8 text-blue-600 animate-bounce-subtle" />
                  <h1 className="text-2xl font-semibold text-foreground">BiblioTeK</h1>
                </div>

                <div className="space-y-6">
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none">
                    Tu biblioteca{" "}
                    <span className="inline-block bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400 dark:from-blue-400 dark:via-cyan-300 dark:to-blue-300 bg-clip-text text-transparent animate-gradient">
                      universitaria en línea
                    </span>
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                    Accede a más de 3,500 ejemplares académicos desde cualquier dispositivo. 
                    Consulta la disponibilidad y ubicación de los libros que necesitas.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="rounded-full text-base animate-fade-in">
                    <Link href="/auth/register">
                      Crear cuenta
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full text-base animate-fade-in [animation-delay:200ms]">
                    <Link href="/auth/login">Iniciar sesión</Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 animate-fade-in [animation-delay:400ms] hover:text-foreground transition-colors">
                    <Search className="h-4 w-4" />
                    <span>Búsqueda avanzada</span>
                  </div>
                  <div className="flex items-center gap-2 animate-fade-in [animation-delay:600ms] hover:text-foreground transition-colors">
                    <MapPin className="h-4 w-4" />
                    <span>Unidad Tomás Aquino y Otay</span>
                  </div>
                  <div className="flex items-center gap-2 animate-fade-in [animation-delay:800ms] hover:text-foreground transition-colors">
                    <Clock className="h-4 w-4" />
                    <span>Préstamos flexibles</span>
                  </div>
                </div>
              </div>

              <div className="relative animate-fade-up [animation-delay:200ms]">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl opacity-20 blur-3xl animate-pulse-slow"></div>
                <div className="relative grid grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="bg-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                      <div className="bg-blue-100 dark:bg-blue-900/30 h-12 w-12 flex items-center justify-center rounded-xl mb-4">
                        <BookText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Consulta del Catálogo</h3>
                      <p className="text-muted-foreground">
                        Explora más de 3,500 libros organizados por categorías, autores y materias, con filtros y buscador inteligente.
                      </p>
                    </div>
                    
                    <div className="bg-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                      <div className="bg-purple-100 dark:bg-purple-900/30 h-12 w-12 flex items-center justify-center rounded-xl mb-4">
                        <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Disponibilidad y Detalles</h3>
                      <p className="text-muted-foreground">
                        Consulta unidades disponibles y fechas estimadas de devolución para cada ejemplar.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 mt-12">
                    <div className="bg-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                      <div className="bg-green-100 dark:bg-green-900/30 h-12 w-12 flex items-center justify-center rounded-xl mb-4">
                        <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Ubicación del Libro</h3>
                      <p className="text-muted-foreground">
                        Localiza ejemplares en Unidad Tomás Aquino o Unidad Otay de forma rápida y sencilla.
                      </p>
                    </div>
                    
                    <div className="bg-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                      <div className="bg-orange-100 dark:bg-orange-900/30 h-12 w-12 flex items-center justify-center rounded-xl mb-4">
                        <GraduationCap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Acceso Estudiantil</h3>
                      <p className="text-muted-foreground">
                        Plataforma exclusiva para consulta del catálogo por estudiantes registrados.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}