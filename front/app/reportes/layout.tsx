"use client";

import { DashboardLayout } from "@/components/dashboard/layout";

export default function ReportesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}