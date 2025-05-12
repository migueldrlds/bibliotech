"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { User, AtSign, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El correo es requerido" })
    .transform(email => {
      if (!email.includes('@')) {
        return `${email.toLowerCase()}@tectijuana.edu.mx`;
      }
      return email.toLowerCase();
    })
    .refine(email => email.endsWith("tectijuana.edu.mx"), { 
      message: "Debe ser un correo institucional (@tectijuana.edu.mx)" 
    }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

export default function Login() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, loading: authLoading, error: authError, clearError } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userPart, setUserPart] = useState("");

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    clearError();
    
    try {
      await login(values.email, values.password);
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al sistema BiblioTeK",
      });
    } catch (error) {
      console.error("Error en login:", error);
      toast({
        title: "Error al iniciar sesión",
        description: authError || "Verifica tus credenciales e intenta nuevamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-4 px-6 border-b backdrop-blur-sm bg-background/80 fixed w-full z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <User className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-foreground">BiblioTeK</h1>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 pt-24">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Regresar al inicio
            </Link>
            <div className="flex justify-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight">
              Iniciar sesión
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-sm">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico institucional</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center overflow-hidden border rounded-md focus-within:ring-1 focus-within:ring-ring">
                          <AtSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="usuario"
                            className="pl-10 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            disabled={isLoading || authLoading}
                            value={userPart}
                            onChange={(e) => {
                              setUserPart(e.target.value);
                              field.onChange(e.target.value.toLowerCase() + "@tectijuana.edu.mx");
                            }}
                          />
                          <div className="px-3 py-2 h-10 bg-muted text-muted-foreground border-l">
                            @tectijuana.edu.mx
                          </div>
                        </div>
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
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            disabled={isLoading || authLoading}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading || authLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-end">
                  <Link
                    href="#"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full"
                  disabled={isLoading || authLoading}
                >
                  {isLoading || authLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">¿No tienes cuenta?</span>{" "}
                  <Link
                    href="/auth/register"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    Regístrate
                  </Link>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>
    </div>
  );
}