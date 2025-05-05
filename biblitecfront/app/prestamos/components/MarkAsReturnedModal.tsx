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

interface MarkAsReturnedModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string | null;
  documentId?: string | null;
  onSuccess: () => void;
}

export function MarkAsReturnedModal({ isOpen, onClose, loanId, documentId, onSuccess }: MarkAsReturnedModalProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMarkAsReturned = async () => {
    if (!loanId) return;
    try {
      setIsProcessing(true);
      console.log(`Marcando préstamo como devuelto - ID: ${loanId}, DocumentID: ${documentId || 'No disponible'}`);
      
      // Usar documentId si está disponible
      await loanService.returnLoan(loanId, documentId);
      
      toast({
        title: "Éxito",
        description: "Préstamo marcado como devuelto correctamente",
        variant: "default",
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al marcar como devuelto:", error);
      toast({
        title: "Error",
        description: "No se pudo marcar como devuelto. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmar Devolución
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro que deseas marcar este préstamo como devuelto? Esta acción actualizará el estado y la fecha de devolución real.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleMarkAsReturned();
            }}
            disabled={isProcessing}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Procesando...
              </>
            ) : (
              <>Marcar como Devuelto</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
