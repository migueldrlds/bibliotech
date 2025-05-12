"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpenText,
  BookMarked,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
} from "lucide-react";

type SidebarItem = {
  href: string;
  icon: React.ReactNode;
  title: string;
};

const sidebarItems: SidebarItem[] = [
  {
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    title: "Dashboard",
  },
  {
    href: "/catalogo",
    icon: <BookOpenText className="h-5 w-5" />,
    title: "Catálogo",
  },
  {
    href: "/prestamos",
    icon: <BookMarked className="h-5 w-5" />,
    title: "Préstamos y Devoluciones",
  },
  {
    href: "/usuarios",
    icon: <Users className="h-5 w-5" />,
    title: "Usuarios",
  },
  {
    href: "/reportes",
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Reportes",
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("pb-12 border-r h-full", className)}>
      <div className="space-y-4 py-4">
        <div className="px-6 py-2">
          <h2 className="mb-2 text-lg font-semibold tracking-tight">
            Navegación
          </h2>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out hover:text-primary",
                  pathname === item.href 
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="px-6 py-2">
          <h2 className="mb-2 text-lg font-semibold tracking-tight">
            Soporte
          </h2>
          <div className="space-y-1">
            <Link
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-primary"
            >
              <Settings className="h-5 w-5" />
              Configuración
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-primary"
            >
              <HelpCircle className="h-5 w-5" />
              Ayuda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}