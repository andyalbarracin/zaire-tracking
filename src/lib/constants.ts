// constants.ts — src/lib/constants.ts — 2026-05-19
// Constantes globales: estados, categorías, monedas, workflow de estados

import type { OrderStatus, ProductCategory } from "@/lib/types/database";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ingresada: "Ingresada",
  en_revision: "En Revisión",
  presupuestada: "Presupuestada",
  aprobada: "Aprobada",
  en_reparacion: "En Reparación",
  lista_para_entrega: "Lista para Entrega",
  entregada: "Entregada",
  facturada: "Facturada",
  cerrada: "Cerrada",
  cancelada: "Cancelada",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  ingresada: "bg-slate-100 text-slate-700 border-slate-200",
  en_revision: "bg-blue-100 text-blue-700 border-blue-200",
  presupuestada: "bg-violet-100 text-violet-700 border-violet-200",
  aprobada: "bg-cyan-100 text-cyan-700 border-cyan-200",
  en_reparacion: "bg-amber-100 text-amber-700 border-amber-200",
  lista_para_entrega: "bg-lime-100 text-lime-700 border-lime-200",
  entregada: "bg-green-100 text-green-700 border-green-200",
  facturada: "bg-blue-200 text-blue-900 border-blue-300",
  cerrada: "bg-gray-200 text-gray-700 border-gray-300",
  cancelada: "bg-red-100 text-red-700 border-red-200",
};

export const ORDER_STATUS_NEXT: Record<OrderStatus, OrderStatus[]> = {
  ingresada: ["en_revision", "cancelada"],
  en_revision: ["presupuestada", "en_reparacion", "cancelada"],
  presupuestada: ["aprobada", "cancelada"],
  aprobada: ["en_reparacion", "cancelada"],
  en_reparacion: ["lista_para_entrega", "cancelada"],
  lista_para_entrega: ["entregada"],
  entregada: ["facturada"],
  facturada: ["cerrada"],
  cerrada: [],
  cancelada: [],
};

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

export const EMPRESA_INFO = {
  nombre: "SAS Supplier S.A.",
  cuit: "30-71234567-8",
  direccion: "Av. Constitución 1234, Parque Industrial",
  ciudad: "Buenos Aires, Argentina",
  telefono: "+54 11 4567-8900",
  email: "info@sassupplier.com.ar",
  web: "www.sassupplier.com.ar",
} as const;
