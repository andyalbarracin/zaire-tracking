// route.ts — src/app/api/pdf/[id]/route.ts — 2026-05-19
// API route para generar el PDF de una orden de trabajo con @react-pdf/renderer

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { OrderPdfDocument } from "@/lib/pdf/order-pdf-template";
import React from "react";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [{ data: orderRaw }, { data: itemsRaw }] = await Promise.all([
    sb.from("work_orders").select(`
      id, order_number, order_type, status, date_in, date_due,
      currency, subtotal, total, general_notes, created_at,
      clients(business_name, tax_id, contact_name, email, phone, address, city)
    `).eq("id", id).single(),
    sb.from("work_order_items").select(`
      item_number, quantity, custom_description, serial_number,
      equipment_number, additional_observation, unit_price, total_price,
      products(code, name, brand)
    `).eq("work_order_id", id).order("item_number"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = orderRaw as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (itemsRaw ?? []) as any[];

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(OrderPdfDocument, { order, items }) as any
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.order_number}.pdf"`,
    },
  });
}
