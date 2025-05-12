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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  User, 
  AtSign, 
  Lock, 
  ArrowLeft, 
  BadgeInfo,
  Eye,
  EyeOff,
  GraduationCap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const careers = [
  "Arquitectura",
  "Lic. en Administración",
  "Contador Público",
  "Ing. Ambiental",
  "Ing. Biomédica",
  "Ing. Civil",
  "Ing. en Diseño Industrial",
  "Ing. Electrónica",
  "Ing. en Gestión Empresarial",
  "Ing. en Logística",
  "Ing. en Nanotecnología",
  "Ing. Química",
  "Ing. Aeronáutica",
  "Ing. Bioquímica",
  "Ing. Electromecánica",
  "Ing. Informática",
  "Ing. en Sistemas Computacionales",
  "Ing. en Tecnologías de la Información y Comunicaciones",
  "Ing. en Ciberseguridad",
  "Ing. en Inteligencia Artificial",
  "Ing. Industrial",
  "Ing. Mecánica"
];

const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  controlNumber: z
    .string()
    .min(1, { message: "El número de control es requerido" })
    .regex(/^\d+$/, { message: "Debe contener solo números" }),
  email: z
    .string()
    .min(1, { message: "El correo es requerido" })
    .email({ message: "Debe ser un correo electrónico válido" })
    .endsWith("tectijuana.edu.mx", { message: "Debe ser un correo institucional (@tectijuana.edu.mx)" }),
  career: z
    .string()
    .min(1, { message: "La carrera es requerida" }),
  gender: z
    .string()
    .min(1, { message: "El género es requerido" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  confirmPassword: z
    .string()
    .min(1, { message: "La confirmación de contraseña es requerida" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export default function Register() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      controlNumber: "",
      email: "",
      career: "",
      gender: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada correctamente",
      });
      router.push("/auth/login");
    }, 1500);
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
        <div className="w-full max-w-lg space-y-8 py-8">
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
              Crear cuenta
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Completa el formulario para registrarte en el sistema
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-sm">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="Nombre Apellido"
                            className="pl-10"
                            disabled={isLoading}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="controlNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de control</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <BadgeInfo className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="12345678"
                            className="pl-10"
                            disabled={isLoading}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico institucional</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <AtSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="correo@tectijuana.edu.mx"
                            className="pl-10"
                            disabled={isLoading}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="career"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrera</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <div className="relative">
                            <SelectTrigger className="pl-10">
                              <GraduationCap className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                              <SelectValue placeholder="Selecciona tu carrera" />
                            </SelectTrigger>
                          </div>
                        </FormControl>
                        <SelectContent>
                          {careers.map((career) => (
                            <SelectItem key={career} value={career}>
                              {career}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Género</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu género" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="femenino">Femenino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                              disabled={isLoading}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
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

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pl-10 pr-10"
                              disabled={isLoading}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
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
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Creando cuenta..." : "Registrarse"}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">¿Ya tienes cuenta?</span>{" "}
                  <Link
                    href="/auth/login"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    Iniciar sesión
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