"use client";

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { loanService } from '@/services/loanService';

interface DeleteLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string | null;
  documentId?: string | null;
  onSuccess: () => void;
}

export function DeleteLoanModal({ isOpen, onClose, loanId, documentId, onSuccess }: DeleteLoanModalProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!loanId) return;
    
    try {
      setIsDeleting(true);
      console.log(`Eliminando préstamo - ID: ${loanId}, DocumentID: ${documentId || 'No disponible'}`);
      
      // Usar documentId si está disponible
      await loanService.deleteLoan(loanId, documentId);
      
      toast({
        title: "Préstamo eliminado",
        description: "El préstamo ha sido eliminado correctamente.",
        variant: "default",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al eliminar préstamo:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el préstamo. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmar Eliminación
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro que deseas eliminar este préstamo? Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Eliminando...
              </>
            ) : (
              <>Eliminar Préstamo</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}