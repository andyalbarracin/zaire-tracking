// page.tsx — src/app/(dashboard)/clientes/[id]/page.tsx — 2026-05-19
// Detalle de cliente con sus órdenes de trabajo asociadas

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { OrderStatusBadge, OrderTypeBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Mail, Phone, MapPin, FileText } from "lucide-react";
import type { OrderStatus, OrderType, Currency, Client, WorkOrder } from "@/lib/types/database";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: clientRaw }, { data: ordersRaw }] = await Promise.all([
    supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single(),
    supabase
      .from("work_orders")
      .select("id, order_number, order_type, status, date_in, date_due, currency, total")
      .eq("client_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const client = clientRaw as Client | null;
  const orders = ordersRaw as Pick<WorkOrder, "id" | "order_number" | "order_type" | "status" | "date_in" | "date_due" | "currency" | "total">[] | null;

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/clientes">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-(--sas-text)">{client.business_name}</h1>
          {client.tax_id && (
            <p className="text-sm text-(--sas-text-muted) font-mono">CUIT: {client.tax_id}</p>
          )}
        </div>
        <span className={`ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${client.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {client.is_active ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Info card */}
        <div className="sas-card p-5 space-y-4">
          <h2 className="font-semibold text-(--sas-text)">Información de contacto</h2>
          <div className="space-y-3 text-sm">
            {client.contact_name && (
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-(--sas-text-muted) mt-0.5" />
                <span>{client.contact_name}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-(--sas-text-muted) mt-0.5" />
                <a href={`mailto:${client.email}`} className="text-sas-blue hover:underline">{client.email}</a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-(--sas-text-muted) mt-0.5" />
                <span>{client.phone}</span>
              </div>
            )}
            {(client.address || client.city) && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-(--sas-text-muted) mt-0.5" />
                <span>{[client.address, client.city].filter(Boolean).join(", ")}</span>
              </div>
            )}
            {client.notes && (
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-(--sas-text-muted) mt-0.5" />
                <span className="text-(--sas-text-muted)">{client.notes}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-(--sas-text-muted)">
            Cliente desde {formatDate(client.created_at)}
          </p>
        </div>

        {/* Orders */}
        <div className="sas-card lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-(--sas-border)">
            <h2 className="font-semibold text-(--sas-text)">
              Órdenes de trabajo ({orders?.length ?? 0})
            </h2>
            <Button asChild size="sm" className="bg-sas-navy-mid text-white hover:bg-sas-navy">
              <Link href={`/ordenes/nueva?clientId=${id}`}>Nueva orden</Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-(--sas-border)">
                <tr>
                  {["Nro Orden", "Tipo", "Estado", "Fecha Ingreso", "Vencimiento", "Total"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-(--sas-text-muted) uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-(--sas-border)">
                {orders?.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/ordenes/${order.id}`} className="font-mono text-sm font-medium text-sas-blue hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><OrderTypeBadge type={order.order_type as OrderType} /></td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status as OrderStatus} /></td>
                    <td className="px-4 py-3 text-(--sas-text-muted)">{formatDate(order.date_in)}</td>
                    <td className="px-4 py-3 text-(--sas-text-muted)">{formatDate(order.date_due)}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(order.total, order.currency as Currency)}</td>
                  </tr>
                ))}
                {!orders?.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-(--sas-text-muted)">
                      Sin órdenes registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
