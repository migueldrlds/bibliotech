"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUser } from '@/context/user-context';
import { Loader2, Book } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({
    message: "Por favor ingrese un correo electrónico válido.",
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres.",
  }),
});

export default function Login() {
  const { login, loading, user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Redireccionar si ya está autenticado
  useEffect(() => {
    if (!loading && user) {
      // El usuario ya está autenticado, redirigir al dashboard
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
    } finally {
      setIsLoading(false);
    }
  }

  // Si está cargando o el usuario ya está autenticado, mostrar pantalla de carga
  if (loading || user) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen px-4">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">
            {user ? "Ya has iniciado sesión, redirigiendo..." : "Cargando..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full min-h-screen px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center mb-4">
            <Book className="h-8 w-8 mr-2 text-blue-600" />
            <h1 className="text-3xl font-bold">BiblioTech</h1>
          </div>
          <p className="text-muted-foreground text-center">
            Sistema de Gestión Bibliotecaria
          </p>
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Iniciar sesión</CardTitle>
            <CardDescription>
              Ingrese sus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="correo@ejemplo.com" 
                          type="email"
                          autoComplete="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type="password"
                          autoComplete="current-password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || loading}
                >
                  {(isLoading || loading) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Iniciar sesión
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center text-sm">
              <p className="text-muted-foreground">
                
              </p>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div>
                 
                </div>
                <div>
                  
                </div>
                <div>
                  
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="text-center text-sm text-muted-foreground">
              ¿No tiene una cuenta?{" "}
              <Link
                href="/registro"
                className="text-primary underline-offset-4 hover:underline"
              >
                Registrarse
              </Link>
            </p>
          </CardFooter>
        </Card>
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
}