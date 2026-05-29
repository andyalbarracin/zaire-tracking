// page.tsx — src/app/(dashboard)/page.tsx — 2026-05-27
// Dashboard principal con bento grid: métricas, órdenes recientes, vencimientos

import { createClient } from "@/lib/supabase/server";
import { ClipboardList, Truck, Receipt, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { OrderStatusBadge, OrderTypeBadge } from "@/components/orders/order-status-badge";
import { formatDate, formatDateTime, isOverdue, getDueDaysLabel } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OrderStatus, OrderType, AuditAction } from "@/lib/types/database";

export const dynamic = "force-dynamic";

type RecentOrder = {
  id: string; order_number: string; order_type: string; status: string;
  date_in: string; clients: { business_name: string } | null;
};

type UpcomingOrder = {
  id: string; order_number: string; order_type: string; status: string;
  date_due: string | null; clients: { business_name: string } | null;
};

type RecentLog = {
  id: string; action: string; description: string | null;
  user_name: string | null; entity_type: string; created_at: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parallel counts
  const [
    { count: activeCount },
    { count: pendingDeliveryCount },
    { count: pendingInvoiceCount },
    { count: todayCount },
  ] = await Promise.all([
    supabase.from("work_orders").select("*", { count: "exact", head: true }).is("deleted_at", null).not("status", "in", '("facturada","cancelada")'),
    supabase.from("work_orders").select("*", { count: "exact", head: true }).is("deleted_at", null).eq("status", "lista_para_entregar"),
    supabase.from("work_orders").select("*", { count: "exact", head: true }).is("deleted_at", null).eq("status", "remitido"),
    supabase.from("work_orders").select("*", { count: "exact", head: true }).is("deleted_at", null).gte("created_at", today.toISOString()),
  ]);

  // Status counts — todos los estados del workflow actual
  const statusesToCount: OrderStatus[] = ORDER_STATUSES
    .filter((s) => s.value !== "cancelada")
    .map((s) => s.value as OrderStatus);

  const statusCountResults = await Promise.all(
    statusesToCount.map(async (s) => {
      const { count } = await supabase.from("work_orders").select("*", { count: "exact", head: true }).is("deleted_at", null).eq("status", s);
      return { status: s, count: count ?? 0 };
    })
  );

  // Data queries
  const [{ data: recentOrdersRaw }, { data: upcomingDueRaw }, { data: recentActivityRaw }] = await Promise.all([
    supabase.from("work_orders")
      .select("id, order_number, order_type, status, date_in, clients(business_name)")
      .is("deleted_at", null).order("created_at", { ascending: false }).limit(8),
    supabase.from("work_orders")
      .select("id, order_number, order_type, status, date_due, clients(business_name)")
      .is("deleted_at", null).not("date_due", "is", null)
      .not("status", "in", '("facturada","cancelada","remitido")')
      .order("date_due", { ascending: true }).limit(6),
    supabase.from("audit_logs")
      .select("id, action, description, user_name, entity_type, created_at")
      .order("created_at", { ascending: false }).limit(5),
  ]);

  const recentOrders = recentOrdersRaw as RecentOrder[] | null;
  const upcomingDue = upcomingDueRaw as UpcomingOrder[] | null;
  const recentActivity = recentActivityRaw as RecentLog[] | null;

  const stats = [
    { label: "OTs Activas", value: activeCount ?? 0, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Lista para Entregar", value: pendingDeliveryCount ?? 0, icon: Truck, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Pendientes de Facturación", value: pendingInvoiceCount ?? 0, icon: Receipt, color: "text-red-600", bg: "bg-red-50" },
    { label: "Ingresadas Hoy", value: todayCount ?? 0, icon: Plus, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--sas-text)">Dashboard</h1>
        <p className="text-sm text-(--sas-text-muted) mt-0.5">Resumen operativo del sistema de trazabilidad</p>
      </div>

      {/* Fila 1: Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="sas-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-(--sas-text-muted) font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-(--sas-text) mt-1">{stat.value}</p>
              </div>
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fila 2: Recientes + Por estado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="sas-card lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-(--sas-border)">
            <h2 className="font-semibold text-(--sas-text)">Órdenes Recientes</h2>
            <Link href="/ordenes" className="text-xs text-sas-blue hover:underline">Ver todas →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--sas-border)">
                  {["Nro Orden", "Tipo", "Cliente", "Estado", "Fecha"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-(--sas-text-muted) uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-(--sas-border)">
                {recentOrders?.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/ordenes/${order.id}`} className="font-mono text-sm font-medium text-sas-blue hover:underline">{order.order_number}</Link>
                    </td>
                    <td className="px-3 py-3"><OrderTypeBadge type={order.order_type as OrderType} /></td>
                    <td className="px-3 py-3 text-(--sas-text-muted) max-w-40 truncate">
                      {order.clients?.business_name ?? "—"}
                    </td>
                    <td className="px-3 py-3"><OrderStatusBadge status={order.status as OrderStatus} /></td>
                    <td className="px-5 py-3 text-(--sas-text-muted) whitespace-nowrap">{formatDate(order.date_in)}</td>
                  </tr>
                ))}
                {!recentOrders?.length && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-(--sas-text-muted) text-sm">No hay órdenes registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sas-card">
          <div className="px-5 py-4 border-b border-(--sas-border)">
            <h2 className="font-semibold text-(--sas-text)">Por Estado</h2>
          </div>
          <div className="p-4 space-y-2">
            {statusCountResults.filter((s) => s.count > 0).map((item) => (
              <div key={item.status} className="flex items-center justify-between py-1.5">
                <OrderStatusBadge status={item.status} />
                <span className="text-sm font-semibold text-(--sas-text)">{item.count}</span>
              </div>
            ))}
            {!statusCountResults.some((s) => s.count > 0) && (
              <p className="text-sm text-center py-4 text-(--sas-text-muted)">Sin datos</p>
            )}
          </div>
        </div>
      </div>

      {/* Fila 3: Vencimientos + Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="sas-card">
          <div className="px-5 py-4 border-b border-(--sas-border)">
            <h2 className="font-semibold text-(--sas-text)">Próximos Vencimientos</h2>
          </div>
          <div className="divide-y divide-(--sas-border)">
            {upcomingDue?.map((order) => {
              const overdue = isOverdue(order.date_due);
              return (
                <div key={order.id} className="flex items-center gap-3 px-5 py-3.5">
                  {overdue && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <Link href={`/ordenes/${order.id}`} className="text-sm font-medium text-sas-blue hover:underline font-mono">{order.order_number}</Link>
                    <p className="text-xs text-(--sas-text-muted) truncate">{order.clients?.business_name ?? "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-xs font-medium", overdue ? "text-red-600" : "text-amber-600")}>{getDueDaysLabel(order.date_due)}</p>
                    <p className="text-xs text-(--sas-text-muted)">{formatDate(order.date_due)}</p>
                  </div>
                </div>
              );
            })}
            {!upcomingDue?.length && (
              <p className="px-5 py-8 text-sm text-center text-(--sas-text-muted)">Sin vencimientos próximos</p>
            )}
          </div>
        </div>

        <div className="sas-card">
          <div className="px-5 py-4 border-b border-(--sas-border)">
            <h2 className="font-semibold text-(--sas-text)">Actividad Reciente</h2>
          </div>
          <div className="divide-y divide-(--sas-border)">
            {recentActivity?.map((log) => (
              <div key={log.id} className="px-5 py-3.5">
                <p className="text-sm text-(--sas-text) truncate">{log.description ?? log.action}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-(--sas-text-muted)">{log.user_name ?? "Sistema"}</span>
                  <span className="text-xs text-(--sas-text-muted)">·</span>
                  <span className="text-xs text-(--sas-text-muted)">{formatDateTime(log.created_at)}</span>
                </div>
              </div>
            ))}
            {!recentActivity?.length && (
              <p className="px-5 py-8 text-sm text-center text-(--sas-text-muted)">Sin actividad reciente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
