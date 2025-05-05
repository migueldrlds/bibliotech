'use client';
 
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error global:', error);
  }, [error]);
 
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3">Error crítico en la aplicación</h1>
          <p className="text-gray-600 mb-8 max-w-md">
            Ha ocurrido un error grave que impide que la aplicación funcione correctamente. 
            Por favor, intente refrescar la página o contacte con soporte si el problema persiste.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline" 
              onClick={() => reset()}
              className="px-6 py-2"
            >
              Intentar de nuevo
            </Button>
            <Button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-2"
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
} 