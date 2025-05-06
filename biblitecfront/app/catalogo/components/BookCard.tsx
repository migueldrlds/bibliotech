"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Eye, Trash2, Pencil, AlertTriangle, BookOpen, User } from 'lucide-react';
import { Book } from '../page';
import { useUser } from '@/context/user-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BookCardProps {
  book: Book;
  onDelete: (bookId: string | number) => Promise<void>;
  onEdit: (book: Book) => void;
  onViewDetails: (bookId: string | number) => void;
}

export function BookCard({ book, onDelete, onEdit, onViewDetails }: BookCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user } = useUser();
  
  // Depuración del rol de usuario
  console.log("Usuario en BookCard:", user);
  console.log("Rol de usuario en BookCard:", user?.role);
  
  // Verificar si el usuario tiene permisos para editar/eliminar libros
  // Los roles restrictivos están en minúsculas para comparación segura
  const restrictedRoles = ['usuario', 'alumno', 'authenticated']; 
  const userRole = user?.role?.toLowerCase() || '';
  const canEditBooks = user && !restrictedRoles.includes(userRole);
  
  console.log("¿Puede editar libros?", canEditBooks);

  // Verificar que el libro exista
  if (!book) {
    return (
      <Card className="overflow-hidden h-full flex flex-col">
        <CardContent className="pt-6 flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Datos del libro no disponibles</p>
        </CardContent>
      </Card>
    );
  }

  // Función para eliminar libro
  const handleDelete = async () => {
    const bookId = book.documentId || book.id_libro || book.id;
    if (!bookId) {
      console.error("No se pudo identificar el libro a eliminar");
      return;
    }
    
    setIsDeleting(true);
    try {
      await onDelete(bookId);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error al eliminar libro:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Determinar color de la etiqueta de unidades
  let unidadColor = 'bg-green-600 text-white';
  if (book.unidad <= 1) {
    unidadColor = 'bg-red-600 text-white';
  } else if (book.unidad <= 5) {
    unidadColor = 'bg-yellow-400 text-black';
  }

  return (
    <>
      <Card className="overflow-hidden flex flex-col relative group aspect-square min-h-[180px] max-h-[210px] h-full justify-between p-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50">
        <div className="flex-1 flex flex-col justify-between p-2">
          <div>
            <h3 className="font-semibold text-sm mb-2 break-words whitespace-normal leading-snug">{book.titulo || 'Sin título'}</h3>
            <div className="flex items-center gap-1 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">{book.autor || 'Autor desconocido'}</span>
            </div>
            <span className="bg-muted px-2 py-1 rounded font-mono text-xs text-foreground border border-muted-foreground/20">{book.clasificacion || 'Sin clasificación'}</span>
          </div>
        </div>
        <div className="flex justify-between items-end mt-auto">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap ${unidadColor}`}>{book.unidad ? `${book.unidad} unidades` : 'Sin unidades'}</span>
          <div className="flex gap-1">
            {canEditBooks && (
              <Button size="icon" variant="ghost" className="p-0 h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => {
                e.preventDefault();
                onEdit(book);
              }}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="p-0 h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => {
              e.preventDefault();
              const bookId = book.documentId || book.id_libro || book.id;
              if (bookId) {
                onViewDetails(bookId);
              }
            }}>
              <BookOpen className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Diálogo de confirmación para eliminar libro */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar el libro "<span className="font-semibold">{book.titulo || book.title}</span>"?
              <p className="mt-2 text-destructive">Esta acción no se puede deshacer.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Eliminar libro
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}