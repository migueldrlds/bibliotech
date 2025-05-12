"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ReportExport() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Formato de exportación</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {}}>
          Exportar como Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {}}>
          Exportar como CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {}}>
          Exportar como PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {}}>
          Imprimir reporte
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}