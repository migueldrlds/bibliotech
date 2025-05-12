"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/dashboard/header";
import { FloatingActionButton } from "@/components/dashboard/floating-action-button";

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={cn("flex-1 pt-6 px-10 pb-16", className)}>
        <div className="container mx-auto">
          {children}
        </div>
        <FloatingActionButton />
      </main>
    </div>
  );
}