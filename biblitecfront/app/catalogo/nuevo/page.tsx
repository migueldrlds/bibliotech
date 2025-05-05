"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, BookMarked, Save } from 'lucide-react';
import { bookService } from '@/services/bookService';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';

// Esquema de validación para el formulario
const bookSchema = z.object({
  titulo: z.string().min(1, { message: "El título es obligatorio" }),
  autor: z.string().min(1, { message: "El autor es obligatorio" }),
  unidad: z.coerce.number().int().min(0, { message: "La unidad debe ser un número entero positivo" }),
  clasificacion: z.string().min(1, { message: "La clasificación es obligatoria" }),
  description: z.string().optional(),
});

export default function NuevoLibroPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, loading } = useUser();

  // Formulario con React Hook Form y validación Zod
  const form = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      titulo: "",
      autor: "",
      unidad: 0,
      clasificacion: "",
      description: "",
    },
  });

  // Verificar que el usuario sea administrador
  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast({
          title: "Acceso denegado",
          description: "Debe iniciar sesión para acceder a esta página",
          variant: "destructive",
        });
        router.push('/login');
      } else if (user.role !== 'admin') {
        toast({
          title: "Acceso denegado",
          description: "No tiene permisos para acceder a esta página",
          variant: "destructive",
        });
        router.push('/catalogo');
      }
    }
  }, [user, loading, router, toast]);

  // Si el usuario está cargando o no es admin, mostrar pantalla de carga
  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Función para manejar el envío del formulario
  async function onSubmit(values: z.infer<typeof bookSchema>) {
    setIsSubmitting(true);

    try {
      await bookService.createBook(values);
      toast({
        title: "Libro creado",
        description: "El libro ha sido agregado correctamente al catálogo",
      });
      router.push('/catalogo');
    } catch (error) {
      console.error("Error al crear libro:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el libro. Inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-1 p-0">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookMarked className="h-5 w-5" />
              Nuevo Libro
            </CardTitle>
            <CardDescription>
              Complete el formulario para agregar un nuevo libro al catálogo
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título del libro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autor</FormLabel>
                      <FormControl>
                        <Input placeholder="Autor del libro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unidad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Número de unidad"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clasificacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clasificación</FormLabel>
                        <FormControl>
                          <Input placeholder="Clasificación del libro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción o sinopsis del libro"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.push('/catalogo')}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar libro
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
} 