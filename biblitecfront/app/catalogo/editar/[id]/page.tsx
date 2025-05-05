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

export default function EditarLibroPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const bookId = params.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingBook, setLoadingBook] = useState(true);
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();

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
    if (!userLoading) {
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
  }, [user, userLoading, router, toast]);

  // Cargar datos del libro
  useEffect(() => {
    if (!userLoading && user && user.role === 'admin') {
      const fetchBook = async () => {
        try {
          const response = await bookService.getBook(bookId);
          if (response.data) {
            // Actualizar valores del formulario
            form.reset({
              titulo: response.data.titulo || response.data.title || "",
              autor: response.data.autor || response.data.author || "",
              unidad: typeof response.data.unidad === 'number' 
                ? response.data.unidad 
                : (response.data.location ? parseInt(response.data.location) : 0),
              clasificacion: response.data.clasificacion || response.data.genre || "",
              description: response.data.description || "",
            });
          } else {
            toast({
              title: "Libro no encontrado",
              description: "No se pudo encontrar el libro solicitado",
              variant: "destructive",
            });
            router.push('/catalogo');
          }
        } catch (error) {
          console.error("Error al cargar libro:", error);
          toast({
            title: "Error",
            description: "No se pudo cargar la información del libro",
            variant: "destructive",
          });
          router.push('/catalogo');
        } finally {
          setLoadingBook(false);
        }
      };

      fetchBook();
    }
  }, [bookId, userLoading, user, router, toast, form]);

  // Si el usuario está cargando o no es admin, mostrar pantalla de carga
  if (userLoading || !user || user.role !== 'admin' || loadingBook) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">
            {loadingBook ? "Cargando información del libro..." : "Verificando acceso..."}
          </p>
        </div>
      </div>
    );
  }

  // Función para manejar el envío del formulario
  async function onSubmit(values: z.infer<typeof bookSchema>) {
    setIsSubmitting(true);

    try {
      await bookService.updateBook(bookId, values);
      toast({
        title: "Libro actualizado",
        description: "El libro ha sido actualizado correctamente",
      });
      router.push(`/catalogo/${bookId}`);
    } catch (error) {
      console.error("Error al actualizar libro:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el libro. Inténtelo de nuevo.",
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
              Editar Libro
            </CardTitle>
            <CardDescription>
              Actualice la información del libro
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
                <Button variant="outline" type="button" onClick={() => router.push(`/catalogo/${bookId}`)}>
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
                  Guardar cambios
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
} 