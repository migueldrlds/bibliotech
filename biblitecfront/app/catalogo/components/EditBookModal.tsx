"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { bookService } from '@/services/bookService';
import { useToast } from '@/hooks/use-toast';
import { Book } from '../page';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  id_libro: z.string().min(1, "El ID del libro es obligatorio"),
  titulo: z.string().min(1, "El título es obligatorio"),
  autor: z.string().min(1, "El autor es obligatorio"),
  clasificacion: z.string().min(1, "La clasificación es obligatoria"),
  unidad: z.coerce.number().int().min(1, "La unidad debe ser un número mayor a 0"),
  coverImage: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditBookModalProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookUpdated: () => void;
}

export default function EditBookModal({ book, open, onOpenChange, onBookUpdated }: EditBookModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_libro: book?.id_libro?.toString() || book?.id?.toString() || "",
      titulo: book?.titulo || book?.title || "",
      autor: book?.autor || book?.author || "",
      clasificacion: book?.clasificacion || book?.genre || "",
      unidad: book?.unidad || 1,
      coverImage: book?.coverImage || "",
    },
  });
  
  useEffect(() => {
    if (book && open) {
      form.reset({
        id_libro: book.id_libro?.toString() || book.id?.toString() || "",
        titulo: book.titulo || book.title || '',
        autor: book.autor || book.author || '',
        clasificacion: book.clasificacion || book.genre || '',
        unidad: book.unidad || 1,
        coverImage: book.coverImage || '',
      });
    }
  }, [book, open, form]);
  
  const onSubmit = async (values: FormValues) => {
    if (!book?.id && !book?.documentId) {
      toast({
        title: "Error",
        description: "No se pudo identificar el libro a editar",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const bookId = book.documentId || book.id;
      
      console.log('Actualizando libro con ID:', bookId);
      console.log('Valores del formulario:', values);
      
      await bookService.updateBook(bookId, {
        id_libro: values.id_libro,
        titulo: values.titulo,
        autor: values.autor,
        clasificacion: values.clasificacion,
        unidad: values.unidad
      });
      
      toast({
        title: "¡Éxito!",
        description: "Libro actualizado correctamente",
      });
      
      onOpenChange(false);
      onBookUpdated();
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
  };
  
  if (!book) {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Libro</DialogTitle>
          <DialogDescription>
            Modifique los detalles del libro y guarde para actualizar la información.
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
                  "Guardar cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 