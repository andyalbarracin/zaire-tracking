"use client";
// orders-table.tsx — src/components/orders/orders-table.tsx — 2026-05-19
// Tabla principal de OTs con TanStack Table v8, filtros múltiples, export Excel/CSV

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Plus, Search, Eye, FileText, Download, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatusBadge, OrderTypeBadge } from "./order-status-badge";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import type { OrderStatus, OrderType, Currency } from "@/lib/types/database";

interface OrderRow {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  date_in: string;
  date_due: string | null;
  currency: string;
  total: number;
  is_remitted: boolean;
  is_delivered: boolean;
  is_invoiced: boolean;
  clients: { id: string; business_name: string } | null;
}

interface OrdersTableProps {
  initialOrders: OrderRow[];
  clients: { id: string; business_name: string }[];
}

export function OrdersTable({ initialOrders, clients }: OrdersTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState("all");
  const [invoicedFilter, setInvoicedFilter] = useState("all");
  const [deliveredFilter, setDeliveredFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const filtered = useMemo(() => {
    return initialOrders.filter((o) => {
      if (typeFilter !== "all" && o.order_type !== typeFilter) return false;
      if (statusFilter.length > 0 && !statusFilter.includes(o.status)) return false;
      if (clientFilter !== "all" && o.clients?.id !== clientFilter) return false;
      if (invoicedFilter === "si" && !o.is_invoiced) return false;
      if (invoicedFilter === "no" && o.is_invoiced) return false;
      if (deliveredFilter === "si" && !o.is_delivered) return false;
      if (deliveredFilter === "no" && o.is_delivered) return false;
      return true;
    });
  }, [initialOrders, typeFilter, statusFilter, clientFilter, invoicedFilter, deliveredFilter]);

  const columns = useMemo<ColumnDef<OrderRow>[]>(
    () => [
      {
        accessorKey: "order_number",
        header: "Nro Orden",
        cell: ({ row }) => (
          <Link
            href={`/ordenes/${row.original.id}`}
            className={cn(
              "font-mono text-sm font-semibold hover:underline",
              row.original.order_type === "OT" ? "text-blue-700" : "text-orange-700"
            )}
          >
            {row.original.order_number}
          </Link>
        ),
      },
      {
        id: "client",
        header: "Cliente",
        accessorFn: (row) => row.clients?.business_name ?? "",
        cell: ({ row }) => (
          <span className="text-sm text-(--sas-text) truncate max-w-[180px] block">
            {row.original.clients?.business_name ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "order_type",
        header: "Tipo",
        cell: ({ getValue }) => <OrderTypeBadge type={getValue() as OrderType} />,
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ getValue }) => <OrderStatusBadge status={getValue() as OrderStatus} />,
      },
      {
        accessorKey: "date_in",
        header: "Ingreso",
        cell: ({ getValue }) => (
          <span className="text-sm text-(--sas-text-muted)">{formatDate(getValue() as string)}</span>
        ),
      },
      {
        accessorKey: "date_due",
        header: "Vencimiento",
        cell: ({ getValue }) => {
          const d = getValue() as string | null;
          return <span className="text-sm text-(--sas-text-muted)">{formatDate(d)}</span>;
        },
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {formatCurrency(row.original.total, row.original.currency as Currency)}
          </span>
        ),
      },
      {
        accessorKey: "is_remitted",
        header: "Remitado",
        cell: ({ getValue }) => (
          <span className={cn("text-center block text-lg", getValue() ? "text-green-600" : "text-slate-300")}>
            {getValue() ? "✓" : "○"}
          </span>
        ),
      },
      {
        accessorKey: "is_delivered",
        header: "Entregado",
        cell: ({ getValue }) => (
          <span className={cn("text-center block text-lg", getValue() ? "text-green-600" : "text-slate-300")}>
            {getValue() ? "✓" : "○"}
          </span>
        ),
      },
      {
        accessorKey: "is_invoiced",
        header: "Facturado",
        cell: ({ getValue }) => (
          <span className={cn("text-center block text-lg", getValue() ? "text-green-600" : "text-slate-300")}>
            {getValue() ? "✓" : "○"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild title="Ver detalle">
              <Link href={`/ordenes/${row.original.id}`}><Eye className="w-3.5 h-3.5" /></Link>
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  function exportExcel() {
    const rows = table.getFilteredRowModel().rows.map((r) => ({
      "Nro Orden": r.original.order_number,
      "Tipo": r.original.order_type,
      "Cliente": r.original.clients?.business_name ?? "",
      "Estado": ORDER_STATUS_LABELS[r.original.status as OrderStatus],
      "Fecha Ingreso": formatDate(r.original.date_in),
      "Vencimiento": formatDate(r.original.date_due),
      "Moneda": r.original.currency,
      "Total": r.original.total,
      "Remitado": r.original.is_remitted ? "Sí" : "No",
      "Entregado": r.original.is_delivered ? "Sí" : "No",
      "Facturado": r.original.is_invoiced ? "Sí" : "No",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Órdenes");
    XLSX.writeFile(wb, `SAS_Trace_Ordenes_${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  function exportCSV() {
    const rows = table.getFilteredRowModel().rows.map((r) => [
      r.original.order_number,
      r.original.order_type,
      r.original.clients?.business_name ?? "",
      ORDER_STATUS_LABELS[r.original.status as OrderStatus],
      formatDate(r.original.date_in),
      formatDate(r.original.date_due),
      r.original.currency,
      r.original.total.toString(),
      r.original.is_remitted ? "Sí" : "No",
      r.original.is_delivered ? "Sí" : "No",
      r.original.is_invoiced ? "Sí" : "No",
    ]);
    const header = ["Nro Orden", "Tipo", "Cliente", "Estado", "Fecha Ingreso", "Vencimiento", "Moneda", "Total", "Remitado", "Entregado", "Facturado"];
    const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SAS_Trace_Ordenes_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const allStatuses = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

  return (
    <div className="sas-card">
      {/* Toolbar */}
      <div className="p-4 border-b border-(--sas-border) space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--sas-text-muted)" />
            <Input placeholder="Buscar órdenes..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="OT">OT</SelectItem>
              <SelectItem value="OTS">OTS</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={(v) => setClientFilter(v ?? "all")}>
            <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Cliente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={invoicedFilter} onValueChange={(v) => setInvoicedFilter(v ?? "all")}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Facturado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Facturado: Todos</SelectItem>
              <SelectItem value="si">Facturado: Sí</SelectItem>
              <SelectItem value="no">Facturado: No</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deliveredFilter} onValueChange={(v) => setDeliveredFilter(v ?? "all")}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Entregado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Entregado: Todos</SelectItem>
              <SelectItem value="si">Entregado: Sí</SelectItem>
              <SelectItem value="no">Entregado: No</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportExcel} className="h-9 gap-1.5">
              <Download className="w-3.5 h-3.5" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} className="h-9 gap-1.5">
              <FileText className="w-3.5 h-3.5" /> CSV
            </Button>
            <Button asChild className="h-9 bg-sas-navy-mid hover:bg-sas-navy text-white">
              <Link href="/ordenes/nueva">
                <Plus className="w-4 h-4 mr-1.5" /> Nueva Orden
              </Link>
            </Button>
          </div>
        </div>
        {/* Estado multiselect */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-(--sas-text-muted)">Estado:</span>
          <button
            type="button"
            onClick={() => setStatusFilter([])}
            className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", statusFilter.length === 0 ? "bg-sas-navy text-white border-sas-navy" : "bg-white text-(--sas-text-muted) border-(--sas-border) hover:border-sas-navy-mid")}
          >
            Todos
          </button>
          {allStatuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
              className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", statusFilter.includes(s) ? "bg-sas-navy-mid text-white border-sas-navy-mid" : "bg-white text-(--sas-text-muted) border-(--sas-border) hover:border-sas-navy-mid")}
            >
              {ORDER_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-(--sas-border)">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left text-xs font-medium text-(--sas-text-muted) uppercase tracking-wide whitespace-nowrap">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-(--sas-border)">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "hover:bg-slate-50 transition-colors",
                  row.original.status === "cancelada" && "opacity-50",
                  row.original.order_type === "OTS" ? "border-l-2 border-l-orange-200" : "border-l-2 border-l-blue-200"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {!table.getRowModel().rows.length && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-(--sas-text-muted)">
                  No se encontraron órdenes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-(--sas-border) text-sm text-(--sas-text-muted)">
        <span>{table.getFilteredRowModel().rows.length} registros</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button>
          <span className="text-xs">Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}</span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente</Button>
        </div>
      </div>
    </div>
  );
}
