// constants.ts — src/lib/constants.ts — 2026-05-27
// Constantes globales: estados, categorías, monedas, workflow de estados

import type { OrderStatus, ProductCategory } from "@/lib/types/database";

export const ORDER_STATUSES = [
  { value: "ingresada", label: "Ingresada", color: "slate" },
  { value: "en_revision", label: "En Revisión", color: "blue" },
  { value: "cotizada", label: "Cotizada", color: "violet" },
  { value: "aprobada", label: "Aprobada", color: "cyan" },
  { value: "en_reparacion", label: "En Reparación", color: "amber" },
  { value: "lista_para_entregar", label: "Lista para Entregar", color: "lime" },
  { value: "remitido", label: "Remitido", color: "green" },
  { value: "facturada", label: "Facturada", color: "indigo" },
  { value: "cancelada", label: "Cancelada", color: "red" },
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ingresada: "Ingresada",
  en_revision: "En Revisión",
  cotizada: "Cotizada",
  aprobada: "Aprobada",
  en_reparacion: "En Reparación",
  lista_para_entregar: "Lista para Entregar",
  remitido: "Remitido",
  facturada: "Facturada",
  cancelada: "Cancelada",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  ingresada: "bg-slate-100 text-slate-700 border-slate-200",
  en_revision: "bg-blue-100 text-blue-700 border-blue-200",
  cotizada: "bg-violet-100 text-violet-700 border-violet-200",
  aprobada: "bg-cyan-100 text-cyan-700 border-cyan-200",
  en_reparacion: "bg-amber-100 text-amber-700 border-amber-200",
  lista_para_entregar: "bg-lime-100 text-lime-700 border-lime-200",
  remitido: "bg-green-100 text-green-700 border-green-200",
  facturada: "bg-indigo-100 text-indigo-700 border-indigo-200",
  cancelada: "bg-red-100 text-red-700 border-red-200",
};

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  ingresada: ["en_revision", "cancelada"],
  en_revision: ["cotizada", "en_reparacion", "cancelada"],
  cotizada: ["aprobada", "cancelada"],
  aprobada: ["en_reparacion", "cancelada"],
  en_reparacion: ["lista_para_entregar", "cancelada"],
  lista_para_entregar: ["remitido"],
  remitido: ["facturada"],
  facturada: [],
  cancelada: [],
};

// Alias para compatibilidad con código existente que usa ORDER_STATUS_NEXT
export const ORDER_STATUS_NEXT = STATUS_TRANSITIONS as Record<OrderStatus, OrderStatus[]>;

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  sello_mecanico: "Sello Mecánico",
  bomba: "Bomba",
  empaquetadura: "Empaquetadura",
  spare_part: "Spare Part",
  otro: "Otro",
};

export const PRODUCT_CATEGORY_COLORS: Record<ProductCategory, string> = {
  sello_mecanico: "bg-blue-100 text-blue-700",
  bomba: "bg-orange-100 text-orange-700",
  empaquetadura: "bg-purple-100 text-purple-700",
  spare_part: "bg-gray-100 text-gray-700",
  otro: "bg-slate-100 text-slate-600",
};

export const CURRENCY_LABELS = { USD: "USD ($)", ARS: "ARS ($)" } as const;

export const USER_ROLE_LABELS = {
  admin: "Administrador",
  operator: "Operador",
  viewer: "Visualizador",
} as const;

export const ITEM_STATUS_LABELS = {
  pendiente: "Pendiente",
  en_proceso: "En Proceso",
  completado: "Completado",
  entregado: "Entregado",
} as const;

export const AUDIT_ACTION_LABELS = {
  create: "Creación",
  update: "Actualización",
  delete: "Eliminación",
  status_change: "Cambio de Estado",
} as const;

export const MARCAS = [
  "AESSEAL",
  "JOHN CRANE",
  "BURGMANN",
  "FLOWSERVE",
  "LATTY",
  "CHESTERTON",
  "SEALMATIC",
  "RUHR PUMPEN",
  "OTRO",
] as const;

export const UNIDADES_MEDIDA = ["MM", "PULG"] as const;

export const BRANCHES = [
  { id: "bb", name: "Bahía Blanca", code: "BB" },
  { id: "nqn", name: "Neuquén", code: "NQN" },
  { id: "noa", name: "NOA", code: "NOA" },
  { id: "bue", name: "Buenos Aires", code: "BUE" },
] as const;

export const EMPRESA_INFO = {
  nombre: "Empresa Demo S.A.",
  cuit: "30-00000000-0",
  direccion: "Dirección 1234",
  ciudad: "Buenos Aires, Argentina",
  telefono: "+54 11 0000-0000",
  email: "demo@empresa.com",
  web: "www.empresa.com",
} as const;
