"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  showControls?: boolean;
  className?: string;
}

export function ChartCard({
  title,
  description,
  children,
  showControls = true,
  className,
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {showControls && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Filtrar por fecha
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}