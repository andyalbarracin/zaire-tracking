// page.tsx — src/app/(dashboard)/ordenes/page.tsx — 2026-05-27
// Lista principal de órdenes de trabajo con TanStack Table y filtros

import { createClient } from "@/lib/supabase/server";
import { OrdersTable } from "@/components/orders/orders-table";

export const dynamic = "force-dynamic";

export default async function OrdenesPage() {
  const supabase = await createClient();

  const [{ data: orders }, { data: clients }] = await Promise.all([
    supabase
      .from("work_orders")
      .select(`
        id, order_number, order_type, status, date_in, date_due,
        currency, subtotal, total, branch_id, general_notes, created_at,
        clients(id, business_name),
        work_order_items(is_quoted, is_remitted, is_delivered, is_invoiced, status, serial_number, custom_description, origen_abastecimiento, total_price_ars)
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, business_name")
      .eq("is_active", true)
      .order("business_name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--sas-text)">Órdenes de Trabajo</h1>
        <p className="text-sm text-(--sas-text-muted) mt-0.5">
          {orders?.length ?? 0} órdenes registradas
        </p>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <OrdersTable initialOrders={(orders ?? []) as any} clients={clients ?? []} />
    </div>
  );
}
