"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, Trash2, Pencil, AlertTriangle } from 'lucide-react';
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

  return (
    <>
      <Card className="overflow-hidden flex flex-col relative group aspect-square min-h-[180px] max-h-[210px] h-full justify-between p-2">
        {/* Botones flotantes de edición/eliminación - solo mostrados para usuarios con permisos */}
        {canEditBooks && (
          <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="default"
              className="h-8 w-8 bg-primary text-white rounded-full shadow-md"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(book);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8 rounded-full shadow-md"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
        <CardContent className="flex-1 flex flex-col items-center justify-center p-2 text-center">
          <h3 className="font-bold text-sm mb-1 line-clamp-2">{book.titulo || 'Sin título'}</h3>
          <p className="text-muted-foreground text-xs mb-1 line-clamp-1">{book.autor || 'Autor desconocido'}</p>
          <Badge variant="secondary" className="text-[10px] mb-1">Unidad: {book.unidad || 'N/A'}</Badge>
          <Badge variant="outline" className="text-[10px] mt-1">{book.clasificacion || 'Sin clasificación'}</Badge>
        </CardContent>
        <CardFooter className="border-t pt-1 pb-1 px-1">
          <div className="w-full grid grid-cols-2 gap-1">
            {canEditBooks ? (
              <>
                <Button size="sm" variant="outline" className="text-xs px-1 py-1" onClick={(e) => {
                  e.preventDefault();
                  onEdit(book);
                }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" className="text-xs px-1 py-1" onClick={(e) => {
                  e.preventDefault();
                  const bookId = book.documentId || book.id_libro || book.id;
                  if (bookId) {
                    onViewDetails(bookId);
                  }
                }}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" className="text-xs px-1 py-1 col-span-2" onClick={(e) => {
                e.preventDefault();
                const bookId = book.documentId || book.id_libro || book.id;
                if (bookId) {
                  onViewDetails(bookId);
                }
              }}>
                <ArrowRight className="h-4 w-4 mr-1" />
                Ver detalles
              </Button>
            )}
          </div>
        </CardFooter>
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