// route.ts — /api/reportes/secuencia — PDF de verificación de secuencia correlativa

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { SecuenciaAuditoriaDocument } from "@/lib/pdf/report-auditoria-template";
import { BRANCHES } from "@/lib/constants";
import React from "react";

function parseSeq(orderNumber: string): number | null {
  const m = orderNumber.match(/^(OTS?)-\d{4}-[A-Z]+(\d+)$/);
  return m ? parseInt(m[2], 10) : null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const year = searchParams.get("year") ?? String(new Date().getFullYear());
  const branch = searchParams.get("branch") ?? "all";
  const type = searchParams.get("type") ?? "all";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any).from("work_orders")
    .select("order_number, status")
    .like("order_number", `%-${year}-%`)
    .order("order_number");

  if (branch !== "all") {
    const code = BRANCHES.find(b => b.id === branch)?.code ?? branch.toUpperCase();
    q = q.like("order_number", `%-${year}-${code}%`);
  }
  if (type !== "all") {
    q = q.like("order_number", `${type}-%`);
  }

  const { data } = await q;
  const rows = (data ?? [])
    .map((r: { order_number: string; status: string }) => ({ ...r, seq: parseSeq(r.order_number) ?? 0 }))
    .filter((r: { seq: number }) => r.seq > 0)
    .sort((a: { seq: number }, b: { seq: number }) => a.seq - b.seq);

  const gaps: { missing: number; around: string }[] = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].seq - rows[i - 1].seq > 1) {
      for (let g = rows[i - 1].seq + 1; g < rows[i].seq; g++) {
        gaps.push({ missing: g, around: `entre ${rows[i - 1].order_number} y ${rows[i].order_number}` });
      }
    }
  }

  const buffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(SecuenciaAuditoriaDocument, { data: { year, branch, type, rows, gaps } }) as any
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Auditoria_Secuencia_${year}.pdf"`,
    },
  });
}
