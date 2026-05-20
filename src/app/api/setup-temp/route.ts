// TEMPORAL — BORRAR DESPUÉS DE USAR
// Resetea contraseña y confirma emails via Supabase Admin API

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const users = [
    {
      id: "a0000000-0000-0000-0000-000000000001",
      email: "admin@sastrace.com",
      password: "SasTrace2026!",
      fullName: "Andrés Rodríguez",
    },
    {
      id: "a0000000-0000-0000-0000-000000000002",
      email: "operador@sastrace.com",
      password: "SasTrace2026!",
      fullName: "Leo Martínez",
    },
  ];

  const results: Record<string, unknown> = {};

  for (const u of users) {
    const { data, error } = await supabase.auth.admin.updateUserById(u.id, {
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.fullName },
    });
    results[u.email] = error ? `ERROR: ${error.message}` : `OK — id: ${data.user?.id}`;
  }

  return NextResponse.json({
    message: "Contraseñas reseteadas via Supabase Admin API",
    results,
    next: "Borrá el archivo src/app/api/setup-temp/route.ts después de usar",
  });
}
