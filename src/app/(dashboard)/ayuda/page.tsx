"use client";
// page.tsx — src/app/(dashboard)/ayuda/page.tsx
// Centro de Ayuda — manual de usuario integrado con búsqueda y accordion

import { useState, useMemo } from "react";
import {
  Rocket, ClipboardList, Users, Package, Search,
  BarChart3, Shield, Printer, Lock, ChevronDown,
  AlertTriangle, Info, CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Step = {
  title: string;
  body: string;
  alert?: { type: "warning" | "info" | "success"; text: string };
};

type Section = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  color: string;
  steps: Step[];
  keywords: string; // extra text for search
};

// ─── Badge inline ─────────────────────────────────────────────────────────────
function OTBadge() {
  return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 mx-0.5">OT</span>;
}
function OTSBadge() {
  return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-700 mx-0.5">OTS</span>;
}
function Code({ children }: { children: string }) {
  return <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono mx-0.5">{children}</code>;
}

// ─── Alert box ────────────────────────────────────────────────────────────────
function AlertBox({ type, text }: { type: "warning" | "info" | "success"; text: string }) {
  const styles = {
    warning: { bg: "bg-amber-50 border-amber-200 text-amber-800", icon: AlertTriangle, iconColor: "text-amber-500" },
    info:    { bg: "bg-blue-50 border-blue-200 text-blue-800",    icon: Info,          iconColor: "text-blue-500" },
    success: { bg: "bg-green-50 border-green-200 text-green-800", icon: CheckCircle2,  iconColor: "text-green-500" },
  }[type];
  const Icon = styles.icon;
  return (
    <div className={cn("flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs mt-2", styles.bg)}>
      <Icon className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", styles.iconColor)} />
      <span>{text}</span>
    </div>
  );
}

// ─── Definición de contenido ─────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: "primeros-pasos",
    icon: Rocket,
    title: "Primeros pasos",
    color: "text-violet-600",
    keywords: "inicio sesión login dashboard stats vencimientos actividad navegación",
    steps: [
      {
        title: "Iniciar sesión",
        body: "Ingresá con tu email y contraseña en la pantalla de login. Si no tenés cuenta, usá el botón 'Registrarse' (requiere aprobación del administrador).",
      },
      {
        title: "El dashboard",
        body: "Al ingresar vas a ver 4 cards de resumen: órdenes activas, pendientes de entrega, pendientes de facturación e ingresadas hoy. Más abajo: tabla de órdenes recientes, distribución por estado, próximos vencimientos y actividad reciente.",
      },
      {
        title: "Navegación",
        body: "La sidebar izquierda tiene acceso a todos los módulos: Dashboard, Órdenes de Trabajo, Clientes, Productos, Historial, Reportes, Configuración. Se puede colapsar con el botón circular a la derecha.",
      },
    ],
  },
  {
    id: "ordenes",
    icon: ClipboardList,
    title: "Órdenes de Trabajo",
    color: "text-blue-600",
    keywords: "nueva orden OT OTS crear editar ítem duplicar PDF planilla reparación estado cambiar exportar Excel CSV serie TAG marca medida materiales precio ARS USD facturada cancelada checklist semáforo",
    steps: [
      {
        title: "Tipos de orden",
        body: "Existen dos tipos: OT (Orden de Trabajo) para venta de productos nuevos, y OTS (Orden de Trabajo de Servicio) para reparaciones y reacondicionamientos. El tipo se elige al crear la orden y no se puede cambiar después.",
        alert: { type: "warning", text: "El tipo (OT/OTS) y la sucursal no pueden modificarse una vez creada la orden." },
      },
      {
        title: "Crear una nueva orden",
        body: "Ir a Órdenes de Trabajo → botón '+ Nueva Orden'. Primero elegir sucursal (BB, NQN, NOA o BUE), luego el tipo. Completar cliente, fechas, moneda y agregar al menos un ítem.",
      },
      {
        title: "Agregar ítems",
        body: "Cada ítem puede tener: producto del catálogo (con precio base autocompletado) o descripción libre, cantidad, número de serie, número de equipo/TAG, marca, medida (en MM o PULG), materiales de caras y o'rings, origen de abastecimiento (PO/NP/STOCK), precios en USD y ARS, y observaciones.",
      },
      {
        title: "Duplicar un ítem",
        body: "El ícono de duplicar (junto al de eliminar, arriba de cada ítem) copia todos los datos del ítem, dejando el número de serie y el TAG en blanco para que los completes con los valores del nuevo ítem.",
      },
      {
        title: "Precios duales USD / ARS",
        body: "Cada ítem tiene precio unitario en USD y en ARS. Los totales se calculan automáticamente. Al pie del formulario se muestra el total en ambas monedas.",
      },
      {
        title: "Workflow de estados",
        body: "Ingresada → En Revisión → Cotizada → Aprobada → En Reparación → Lista para Entregar → Remitido → Facturada. También existe el estado Cancelada. Para cambiar el estado, ir al detalle de la orden → pestaña 'Cambiar Estado'.",
      },
      {
        title: "Estado de trabajo del ítem",
        body: "Dentro del detalle de cada ítem (expandir con ▼), hay pills para cambiar el estado de trabajo: Pendiente, En Proceso, Completado, Entregado. El ítem activo queda resaltado en azul.",
      },
      {
        title: "Checklist del ítem (Cotizado / Remitido / Entregado / Facturado)",
        body: "Cada ítem tiene un checklist con 4 estados comerciales. Se puede marcar/desmarcar tanto en la vista de Detalle como en la de Edición. Al marcar, se guarda inmediatamente en la base de datos.",
      },
      {
        title: "Semáforo de estado en la tabla",
        body: "Las columnas Remitido, Entregado y Facturado en la tabla muestran un punto de color: verde = todos los ítems marcados, amarillo = algunos, rojo = ninguno. El semáforo 'Procesado' en el detalle indica avance de trabajo.",
      },
      {
        title: "Generar PDF de la orden",
        body: "En el detalle de una orden, botón 'PDF' arriba a la derecha. Genera el formulario RC 009-00 con datos de empresa, cliente, ítems, precios y espacio para firma.",
      },
      {
        title: "Planilla de Reparación (solo OTS)",
        body: "En el detalle de una OTS con ítems que requieren reparación, aparece el botón 'Planilla Reparación'. Genera el documento RC 010-00 con datos técnicos del sello y tabla de componentes.",
      },
      {
        title: "Exportar la tabla a Excel o CSV",
        body: "Botones 'Excel' y 'CSV' arriba de la tabla de órdenes. La exportación respeta todos los filtros activos. El CSV usa separador punto y coma (;), estándar Argentina.",
      },
    ],
  },
  {
    id: "clientes",
    icon: Users,
    title: "Clientes",
    color: "text-green-600",
    keywords: "nuevo cliente razón social CUIT contacto email teléfono dirección código buscar",
    steps: [
      {
        title: "Crear un cliente nuevo",
        body: "Ir a Clientes → botón 'Nuevo Cliente'. La Razón Social es el único campo obligatorio. Se pueden agregar: CUIT, nombre de contacto, email, teléfono, dirección, ciudad y un código interno propio.",
      },
      {
        title: "Código de cliente",
        body: "Campo opcional para asignar un identificador propio (ej: C-0001, TEC-001). Aparece en los PDFs de órdenes como 'Código Cliente' para facilitar la referencia cruzada con el sistema del cliente.",
      },
      {
        title: "Buscar y ver historial",
        body: "Usar la barra de búsqueda en la tabla de clientes para filtrar por nombre, CUIT o contacto. Al hacer clic en un cliente se accede a su página de detalle con todas sus órdenes asociadas.",
      },
    ],
  },
  {
    id: "productos",
    icon: Package,
    title: "Productos",
    color: "text-orange-600",
    keywords: "nuevo producto categoría sello mecánico bomba empaquetadura spare part precio base catálogo",
    steps: [
      {
        title: "Agregar un producto al catálogo",
        body: "Ir a Productos → botón 'Nuevo Producto'. Completar nombre, código, categoría (sello mecánico, bomba, empaquetadura, spare part u otro), marca, modelo, precio base y moneda por defecto.",
      },
      {
        title: "Precio base en órdenes",
        body: "Al seleccionar un producto en una orden, el precio unitario se autocompleta con el precio base del catálogo. Es modificable por ítem sin afectar el precio base del catálogo.",
      },
      {
        title: "Productos vs. descripción libre",
        body: "Si un ítem no está en el catálogo, se puede ingresar como descripción libre directamente en el formulario del ítem. Esto es útil para servicios o piezas únicas que no justifican estar en el catálogo.",
      },
    ],
  },
  {
    id: "filtros",
    icon: Search,
    title: "Filtros y búsqueda",
    color: "text-cyan-600",
    keywords: "buscar filtrar búsqueda global número serie estado sucursal cliente fechas combinar tabla",
    steps: [
      {
        title: "Búsqueda global",
        body: "El campo 'Buscar por orden, cliente, serie...' busca simultáneamente en: número de orden, razón social del cliente, estado, número de serie de ítems, descripción de ítems y origen de abastecimiento.",
      },
      {
        title: "Filtros disponibles",
        body: "Tipo: OT, OTS o Todos. Estado: selección múltiple (se pueden elegir varios estados a la vez). Sucursal: BB, NQN, NOA, BUE. Cliente: selector con todos los clientes. Rango de fechas: Desde / Hasta por fecha de ingreso.",
      },
      {
        title: "Filtros combinados",
        body: "Todos los filtros se aplican simultáneamente. Por ejemplo: OTS + estado 'En Reparación' + cliente 'Tecpetrol' mostrará solo las OTS en reparación de ese cliente.",
      },
      {
        title: "Navegar al detalle",
        body: "Hacer clic en cualquier fila de la tabla de órdenes navega directamente al detalle de esa orden. No hace falta usar el ícono de ojo.",
        alert: { type: "info", text: "El número de orden también es un link clickeable que lleva al detalle." },
      },
    ],
  },
  {
    id: "reportes",
    icon: BarChart3,
    title: "Reportes",
    color: "text-indigo-600",
    keywords: "reporte operativo financiero auditoría período cliente facturación proyección pendiente Excel PDF secuencia integridad trazabilidad",
    steps: [
      {
        title: "Tab Operativos",
        body: "Cuatro reportes: Órdenes por Período (con filtro de fecha, sucursal y tipo), Órdenes por Cliente (ranking por volumen), Proyección Financiera (total proyectado de órdenes activas) y Pendientes de Facturación (ítems entregados sin facturar).",
      },
      {
        title: "Tab Financieros",
        body: "Dos reportes: Facturación por Período (total facturado con detalle por orden) e Ingresos por Cliente (ranking de clientes por monto facturado). Exportables a Excel.",
      },
      {
        title: "Tab Auditoría — Verificación de Secuencia",
        body: "Verifica que la numeración de órdenes sea continua sin huecos. Permite filtrar por año, sucursal y tipo. Genera un PDF formal para presentar en auditorías.",
      },
      {
        title: "Tab Auditoría — Trazabilidad por Orden",
        body: "Buscar una orden por número. Genera un informe completo con: datos generales, datos del cliente, tabla de ítems con estados, timeline completo de cambios de estado y log de todas las modificaciones.",
      },
      {
        title: "Tab Auditoría — Informe de Integridad",
        body: "Resumen ejecutivo del sistema para un período y sucursal. Incluye: totales por tipo y estado, montos facturados y pendientes, y verificación de consistencia (sin duplicados, sin registros sin número, soft-delete verificado).",
        alert: { type: "info", text: "Los reportes de auditoría usan números de orden como identificadores, nunca IDs técnicos internos." },
      },
    ],
  },
  {
    id: "trazabilidad",
    icon: Shield,
    title: "Trazabilidad y auditoría",
    color: "text-emerald-600",
    keywords: "historial auditoría log registro cambio estado automático correlativo número cancelada huecos borrar eliminar",
    steps: [
      {
        title: "Registro automático",
        body: "El sistema registra automáticamente cada acción: creación de órdenes, modificaciones, cambios de estado. Cada registro incluye fecha y hora exacta, usuario que realizó la acción y descripción del cambio.",
      },
      {
        title: "Historial clickeable",
        body: "En la página de Historial, cada registro es clickeable: las órdenes llevan al detalle de la orden, los clientes al detalle del cliente, los productos al catálogo. Hay un ícono de flecha que indica los registros navegables.",
      },
      {
        title: "Numeración correlativa automática",
        body: "Cada orden recibe un número automático e irrepetible (ej: OT-2026-BB0001). El formato es: tipo + año + código de sucursal + secuencia numérica. Este número no se puede editar ni reutilizar.",
      },
      {
        title: "Las órdenes no se borran",
        body: "Ninguna orden se elimina físicamente del sistema. Solo pueden ser canceladas, y el registro permanece con su historial completo intacto.",
        alert: { type: "success", text: "Esto garantiza la integridad del registro para auditorías ISO 9001:2015." },
      },
      {
        title: "Huecos en la numeración",
        body: "Si el reporte de secuencia detecta un número faltante, significa que esa orden fue cancelada. Las órdenes canceladas mantienen su número pero cambian su estado a 'Cancelada'.",
        alert: { type: "warning", text: "Un hueco real (número que nunca existió) debería ser reportado al administrador del sistema." },
      },
    ],
  },
  {
    id: "impresion",
    icon: Printer,
    title: "Impresión y documentos",
    color: "text-slate-600",
    keywords: "PDF imprimir planilla reparación formulario RC009 RC010 Excel CSV exportar firma",
    steps: [
      {
        title: "PDF de Orden de Trabajo (RC 009-00)",
        body: "Disponible en el detalle de cualquier orden. Genera el formulario RC 009-00 con: datos de empresa, datos del cliente, tabla de ítems con códigos, precios, y columnas de estado (R/F). Orientación horizontal.",
      },
      {
        title: "Planilla de Reparación (RC 010-00)",
        body: "Solo disponible en órdenes OTS que tienen ítems con 'Requiere reparación' activado. Genera una planilla por cada ítem, con datos técnicos del sello, tabla de componentes fija y campos para pruebas neumática e hidráulica.",
      },
      {
        title: "Exportar a Excel (.xlsx)",
        body: "Botón 'Excel' sobre la tabla de órdenes. El archivo incluye el encabezado y todos los registros con los filtros aplicados. Columnas: Nro. Orden, Sucursal, Tipo, Cliente, Estado, Fechas, Moneda, Total USD, Total ARS.",
      },
      {
        title: "Exportar a CSV",
        body: "Mismo contenido que Excel pero en formato CSV con separador punto y coma (;). Compatible con Excel argentino y herramientas como LibreOffice Calc. La codificación es UTF-8 con BOM para caracteres especiales.",
      },
    ],
  },
  {
    id: "roles",
    icon: Lock,
    title: "Roles y permisos",
    color: "text-red-600",
    keywords: "rol administrador operador visor auditor permisos acceso configuración usuarios",
    steps: [
      {
        title: "Administrador",
        body: "Acceso total al sistema. Puede gestionar usuarios, acceder a Configuración y modificar cualquier registro. Es el único rol que ve el ítem 'Configuración' en la sidebar.",
      },
      {
        title: "Operador",
        body: "Puede crear, editar y gestionar órdenes, clientes y productos. No tiene acceso a la sección de Configuración ni a la gestión de usuarios.",
      },
      {
        title: "Visor / Auditor",
        body: "Solo lectura. Puede consultar toda la información del sistema, generar reportes y exportar datos, pero no puede crear ni modificar registros.",
        alert: { type: "info", text: "Para cambiar el rol de un usuario, contactar al administrador del sistema." },
      },
    ],
  },
];

// ─── Accordion ────────────────────────────────────────────────────────────────

function AccordionSection({ section, defaultOpen = false }: { section: Section; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = section.icon;

  return (
    <div className="sas-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", "bg-slate-100")}>
          <Icon className={cn("w-5 h-5", section.color)} />
        </div>
        <span className="flex-1 font-semibold text-(--sas-text) text-[15px]">{section.title}</span>
        <ChevronDown className={cn("w-4 h-4 text-(--sas-text-muted) transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t border-(--sas-border) px-6 pb-6 pt-4 space-y-5">
          {section.steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-sas-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-(--sas-text) text-sm mb-1">{step.title}</p>
                <p className="text-sm text-(--sas-text-muted) leading-relaxed">{step.body}</p>
                {step.alert && <AlertBox type={step.alert.type} text={step.alert.text} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AyudaPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return SECTIONS;
    const q = query.toLowerCase();
    return SECTIONS.filter((s) => {
      const searchable = `${s.title} ${s.keywords} ${s.steps.map(st => `${st.title} ${st.body} ${st.alert?.text ?? ""}`).join(" ")}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [query]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-(--sas-text)">Centro de Ayuda</h1>
        <p className="text-sm text-(--sas-text-muted) mt-0.5">Guía de uso del sistema</p>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--sas-text-muted)" />
        <Input
          placeholder="Buscar en la ayuda... (ej: PDF, semáforo, duplicar)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-10 bg-white"
        />
      </div>

      {/* Tip rápido */}
      {!query && (
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          <span>
            Hacé clic en cualquier sección para expandirla. Usá la búsqueda para encontrar un tema específico.
            Términos útiles: <OTBadge /> <OTSBadge /> o palabras como "PDF", "semáforo", "estado", "exportar".
          </span>
        </div>
      )}

      {/* Secciones */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((section, i) => (
            <AccordionSection
              key={section.id}
              section={section}
              defaultOpen={!!query || i === 0}
            />
          ))
        ) : (
          <div className="sas-card px-6 py-12 text-center">
            <Search className="w-8 h-8 text-(--sas-text-muted) mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-(--sas-text-muted)">
              No se encontraron resultados para &quot;{query}&quot;
            </p>
            <p className="text-xs text-(--sas-text-muted) mt-1">
              Intentá con otras palabras clave
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
