"use client";
// header.tsx — src/components/layout/header.tsx — 2026-05-19
// Header superior con breadcrumb dinámico y datos del usuario

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  "": "Dashboard",
  ordenes: "Órdenes de Trabajo",
  nueva: "Nueva Orden",
  clientes: "Clientes",
  productos: "Productos",
  historial: "Historial",
  configuracion: "Configuración",
};

export function Header() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const isUUID = /^[0-9a-f-]{36}$/i.test(seg);
    const label = isUUID ? "Detalle" : (ROUTE_LABELS[seg] ?? seg);
    return { href, label, isLast: i === segments.length - 1 };
  });

  return (
    <header className="h-14 bg-white border-b border-(--sas-border) px-6 flex items-center">
      <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
        <Link
          href="/"
          className="text-(--sas-text-muted) hover:text-sas-navy transition-colors"
        >
          Inicio
        </Link>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-(--sas-text-muted)" />
            {crumb.isLast ? (
              <span className="font-medium text-(--sas-text)">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-(--sas-text-muted) hover:text-sas-navy transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </header>
  );
}
