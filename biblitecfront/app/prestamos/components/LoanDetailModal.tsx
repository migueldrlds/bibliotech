"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Book, User, Calendar, CalendarClock, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { loanService } from '@/services/loanService';
import { Loan } from '@/types';

interface LoanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onReturnSuccess?: () => void;
}

export function LoanDetailModal({ isOpen, onClose, loan, onReturnSuccess }: LoanDetailModalProps) {
  const { toast } = useToast();
  const [returningLoan, setReturningLoan] = useState(false);

  const handleReturnLoan = async () => {
    if (!loan) return;
    try {
      setReturningLoan(true);
      await loanService.returnLoan(loan.id);
      toast({
        title: "Éxito",
        description: "Préstamo marcado como devuelto correctamente",
        variant: "default",
      });
      if (onReturnSuccess) onReturnSuccess();
      onClose();
    } catch (error) {
      console.error("Error al devolver el préstamo:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la devolución. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setReturningLoan(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <Badge className="bg-blue-600">
          <Clock className="h-3 w-3 mr-1" />
          Activo
        </Badge>
      );
    } else if (status === 'returned') {
      return (
        <Badge className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Devuelto
        </Badge>
      );
    } else if (status === 'overdue') {
      return (
        <Badge className="bg-red-600">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Atrasado
        </Badge>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Detalles del Préstamo</DialogTitle>
        </DialogHeader>
        {loan ? (
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium">ID: {loan.id}</h3>
              {getStatusBadge(loan.status)}
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex gap-2 items-start">
                <Book className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">Libro</h4>
                  <p>{loan.bookTitle}</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">Usuario</h4>
                  <p>{loan.userName}</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">Fecha de Préstamo</h4>
                  <p>{formatDate(loan.loanDate)}</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <CalendarClock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">Fecha de Devolución Esperada</h4>
                  <p>{formatDate(loan.dueDate)}</p>
                </div>
              </div>
              {loan.returnDate && (
                <div className="flex gap-2 items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Fecha de Devolución Real</h4>
                    <p>{formatDate(loan.returnDate)}</p>
                  </div>
                </div>
              )}
              {loan.notes && (
                <div className="flex gap-2 items-start">
                  <div className="w-5" />
                  <div>
                    <h4 className="font-medium">Notas</h4>
                    <p className="text-sm text-muted-foreground">{loan.notes}</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">
                  Cerrar
                </Button>
              </DialogClose>
              {loan.status === 'active' && (
                <Button 
                  variant="default"
                  onClick={handleReturnLoan}
                  disabled={returningLoan}
                >
                  {returningLoan ? 'Procesando...' : 'Marcar como Devuelto'}
                </Button>
              )}
            </DialogFooter>
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            No se encontró información del préstamo.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}