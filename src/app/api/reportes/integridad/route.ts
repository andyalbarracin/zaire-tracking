// route.ts — /api/reportes/integridad — PDF de informe de integridad

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { IntegridadAuditoriaDocument } from "@/lib/pdf/report-auditoria-template";
import { BRANCHES } from "@/lib/constants";
import React from "react";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const year = searchParams.get("year") ?? String(new Date().getFullYear());
  const branch = searchParams.get("branch") ?? "all";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any).from("work_orders")
    .select("order_number, order_type, status, total")
    .like("order_number", `%-${year}-%`);

  if (branch !== "all") {
    const code = BRANCHES.find(b => b.id === branch)?.code ?? branch.toUpperCase();
    q = q.like("order_number", `%-${year}-${code}%`);
  }

  const { data: orders } = await q;
  const all = orders ?? [];

  const numbers = all.map((o: { order_number: string }) => o.order_number).filter(Boolean);
  const data = {
    year, branch,
    total: all.length,
    ot: all.filter((o: { order_type: string }) => o.order_type === "OT").length,
    ots: all.filter((o: { order_type: string }) => o.order_type === "OTS").length,
    facturadas: all.filter((o: { status: string }) => o.status === "facturada").length,
    canceladas: all.filter((o: { status: string }) => o.status === "cancelada").length,
    activas: all.filter((o: { status: string }) => !["facturada", "cancelada"].includes(o.status)).length,
    totalFacturadoUsd: all.filter((o: { status: string }) => o.status === "facturada").reduce((s: number, o: { total: number }) => s + (o.total ?? 0), 0),
    totalPendienteUsd: all.filter((o: { status: string }) => !["facturada", "cancelada"].includes(o.status)).reduce((s: number, o: { total: number }) => s + (o.total ?? 0), 0),
    hasDuplicates: new Set(numbers).size < numbers.length,
    hasNoNumber: all.some((o: { order_number: string }) => !o.order_number),
  };

  const buffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(IntegridadAuditoriaDocument, { data }) as any
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Auditoria_Integridad_${year}.pdf"`,
    },
  });
}
