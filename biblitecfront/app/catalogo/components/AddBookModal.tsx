"use client";

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { bookService } from '@/services/bookService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';

const formSchema = z.object({
  id_libro: z.string().min(1, "El ID del libro es obligatorio"),
  titulo: z.string().min(1, "El título es obligatorio"),
  autor: z.string().min(1, "El autor es obligatorio"),
  clasificacion: z.string().min(1, "La clasificación es obligatoria"),
  unidad: z.coerce.number().int().min(1, "La unidad debe ser un número mayor a 0"),
  coverImage: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookAdded: () => void;
}

export default function AddBookModal({ open, onOpenChange, onBookAdded }: AddBookModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Generar un ID único para el libro si no se proporciona uno
  const defaultIdLibro = `AUTO-${Date.now()}`;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_libro: defaultIdLibro,
      titulo: '',
      autor: '',
      clasificacion: '',
      unidad: 1,
      coverImage: '',
    },
  });
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Asegurarnos de que unidad sea un número
      const unidadValue = typeof values.unidad === 'number' ? values.unidad : 1;
      
      // Imprimir los valores para depurar
      console.log('Valores del formulario:', values);
      console.log('Tipo de unidad:', typeof values.unidad);
      
      const bookData = {
        id_libro: values.id_libro,
        titulo: values.titulo,
        autor: values.autor,
        clasificacion: values.clasificacion,
        unidad: unidadValue
      };
      
      console.log('Datos a enviar:', bookData);
      
      // Solo enviamos los campos del modelo Book
      await bookService.createBook(bookData);
      
      toast({
        title: "¡Éxito!",
        description: `Libro "${values.titulo}" agregado correctamente con ID: ${values.id_libro}`,
      });
      
      // Resetear el formulario
      form.reset({
        id_libro: defaultIdLibro,
        titulo: '',
        autor: '',
        clasificacion: '',
        unidad: 1,
        coverImage: '',
      });
      
      onOpenChange(false);
      onBookAdded();
    } catch (error) {
      console.error("Error al agregar libro:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el libro. Inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Libro</DialogTitle>
          <DialogDescription>
            Complete los detalles del libro y guarde para agregarlo al catálogo. 
            Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="id_libro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID del Libro*</FormLabel>
                  <FormControl>
                    <Input placeholder="ID único del libro" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">ID generado automáticamente. Puede cambiarlo si lo desea.</p>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título*</FormLabel>
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
                    <FormLabel>Autor*</FormLabel>
                    <FormControl>
                      <Input placeholder="Autor del libro" {...field} />
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
                    <FormLabel>Clasificación*</FormLabel>
                    <FormControl>
                      <Input placeholder="Categoría o género" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Unidad o localización"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la imagen de portada (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="URL de la imagen" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Guardar libro
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 