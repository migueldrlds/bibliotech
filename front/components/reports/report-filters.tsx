"use client";

import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export function ReportFilters() {
  const [showBooks, setShowBooks] = useState(true);
  const [showUsers, setShowUsers] = useState(true);
  const [showLoans, setShowLoans] = useState(true);
  const [showReturns, setShowReturns] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filtrar reportes</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Mostrar datos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={showBooks}
          onCheckedChange={setShowBooks}
        >
          Libros
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showUsers}
          onCheckedChange={setShowUsers}
        >
          Usuarios
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showLoans}
          onCheckedChange={setShowLoans}
        >
          Préstamos
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showReturns}
          onCheckedChange={setShowReturns}
        >
          Devoluciones
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Estado de préstamos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={statusFilter === "all"}
          onCheckedChange={() => setStatusFilter("all")}
        >
          Todos
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={statusFilter === "active"}
          onCheckedChange={() => setStatusFilter("active")}
        >
          Activos
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={statusFilter === "overdue"}
          onCheckedChange={() => setStatusFilter("overdue")}
        >
          Atrasados
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={statusFilter === "returned"}
          onCheckedChange={() => setStatusFilter("returned")}
        >
          Devueltos
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}