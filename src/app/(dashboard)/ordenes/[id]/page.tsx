// page.tsx — src/app/(dashboard)/ordenes/[id]/page.tsx — 2026-05-19
// Detalle de orden de trabajo: info, ítems, historial de estados, cambio de estado

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OrderDetail } from "@/components/orders/order-detail";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: order },
    { data: items },
    { data: history },
    { data: clients },
    { data: products },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from("work_orders")
      .select(`
        id, order_number, order_type, status, date_in, date_due,
        currency, subtotal, tax_amount, total, is_remitted, is_delivered, is_invoiced,
        general_notes, created_at, updated_at, created_by, client_id, deleted_at,
        clients(id, business_name, tax_id, contact_name, email, phone, city)
      `)
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("work_order_items")
      .select(`
        id, item_number, quantity, product_id, custom_description, serial_number,
        equipment_number, additional_observation, unit_price, total_price,
        repair_required, diagnosis, work_performed, status, notes, created_at,
        products(id, code, name, brand, category)
      `)
      .eq("work_order_id", id)
      .order("item_number"),
    supabase
      .from("work_order_status_history")
      .select(`id, old_status, new_status, notes, created_at, changed_by, profiles(full_name)`)
      .eq("work_order_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("clients").select("id, business_name, tax_id").eq("is_active", true).order("business_name"),
    supabase.from("products").select("id, code, name, brand, model, category, unit, default_currency, default_unit_price").eq("is_active", true).order("name"),
    supabase.auth.getUser(),
  ]);

  if (!order) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user?.id ?? "")
    .single();

  return (
    <OrderDetail
      order={order as never}
      items={items ?? []}
      history={history ?? []}
      clients={clients ?? []}
      products={products ?? []}
      currentProfile={profile}
    />
  );
}
