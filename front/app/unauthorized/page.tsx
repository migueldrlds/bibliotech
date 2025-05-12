"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ShieldAlert, Home } from "lucide-react";
import Link from "next/link";

export default function Unauthorized() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="flex flex-col items-center max-w-md mx-auto space-y-6">
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
          <ShieldAlert className="h-12 w-12 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl">
          Acceso denegado
        </h1>
        
        <p className="text-muted-foreground">
          No tienes permisos para acceder a esta página. Por favor, contacta con un administrador si crees que esto es un error.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            Volver atrás
          </Button>
          
          <Button asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Ir al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 