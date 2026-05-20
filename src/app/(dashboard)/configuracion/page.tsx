// page.tsx — src/app/(dashboard)/configuracion/page.tsx — 2026-05-19
// Página de configuración (solo administradores)

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EMPRESA_INFO } from "@/lib/constants";
import type { Profile } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  const profile = profileRaw as Pick<Profile, "role"> | null;
  if (profile?.role !== "admin") redirect("/");

  const { data: usersRaw } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("full_name");

  const users = usersRaw as Pick<Profile, "id" | "full_name" | "email" | "role" | "created_at">[] | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--sas-text)">Configuración</h1>
        <p className="text-sm text-(--sas-text-muted) mt-0.5">Solo visible para administradores</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info de la empresa */}
        <div className="sas-card p-6">
          <h2 className="font-semibold text-(--sas-text) mb-4">Información de la empresa</h2>
          <div className="space-y-3 text-sm">
            {Object.entries(EMPRESA_INFO).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-(--sas-border) pb-2 last:border-0">
                <span className="text-(--sas-text-muted) capitalize">{key.replace(/_/g, " ")}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Usuarios */}
        <div className="sas-card p-6">
          <h2 className="font-semibold text-(--sas-text) mb-4">Usuarios del sistema</h2>
          <div className="space-y-3">
            {users?.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b border-(--sas-border) last:border-0">
                <div className="w-8 h-8 rounded-full bg-sas-blue flex items-center justify-center text-white text-xs font-bold">
                  {u.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{u.full_name}</p>
                  <p className="text-xs text-(--sas-text-muted)">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  u.role === "admin" ? "bg-sas-navy text-white" :
                  u.role === "operator" ? "bg-blue-100 text-blue-700" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {u.role === "admin" ? "Admin" : u.role === "operator" ? "Operador" : "Visualizador"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
