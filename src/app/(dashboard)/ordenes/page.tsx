// page.tsx — src/app/(dashboard)/ordenes/page.tsx — 2026-05-19
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
        currency, subtotal, total, is_remitted, is_delivered, is_invoiced,
        general_notes, created_at,
        clients(id, business_name)
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
      <OrdersTable initialOrders={orders ?? []} clients={clients ?? []} />
    </div>
  );
}
