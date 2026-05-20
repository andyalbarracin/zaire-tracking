// order-pdf-template.tsx — src/lib/pdf/order-pdf-template.tsx — 2026-05-19
// Template PDF de órdenes de trabajo con @react-pdf/renderer

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { EMPRESA_INFO, ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { OrderStatus, OrderType, Currency } from "@/lib/types/database";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, padding: 40, color: "#0F172A" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: "#0B2447" },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: "flex-end" },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0B2447", marginBottom: 2 },
  companySubtitle: { fontSize: 8, color: "#576CBC" },
  companyInfo: { fontSize: 7.5, color: "#64748B", marginTop: 1 },
  orderTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#0B2447" },
  orderNumber: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#576CBC", marginTop: 2 },
  infoBox: { flexDirection: "row", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 4, padding: 10, marginBottom: 16, gap: 16 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 7, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#0B2447", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  table: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 4, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#0B2447", padding: 6 },
  tableRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#E2E8F0", padding: 6 },
  tableRowAlt: { backgroundColor: "#F8FAFC" },
  th: { color: "#FFFFFF", fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  td: { fontSize: 8 },
  colNum: { width: 24 },
  colQty: { width: 28 },
  colDesc: { flex: 1 },
  colSerie: { width: 70 },
  colEquipo: { width: 50 },
  colUnit: { width: 50, textAlign: "right" },
  colTotal: { width: 55, textAlign: "right" },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  totalsBox: { width: 180 },
  totalsLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: "#64748B" },
  totalValue: { fontSize: 9 },
  totalFinalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0B2447" },
  totalFinalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0B2447" },
  totalFinalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTopWidth: 1.5, borderTopColor: "#0B2447", marginTop: 2 },
  notesBox: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 4, padding: 10, marginTop: 12 },
  notesText: { fontSize: 8.5, color: "#64748B" },
  signatureArea: { flexDirection: "row", gap: 20, marginTop: 24 },
  signatureBox: { flex: 1, borderTopWidth: 1, borderTopColor: "#0B2447", paddingTop: 4 },
  signatureLabel: { fontSize: 7.5, color: "#64748B", textAlign: "center" },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#94A3B8" },
});

interface OrderPdfProps {
  order: {
    order_number: string; order_type: string; status: string;
    date_in: string; date_due: string | null; currency: string;
    subtotal: number; total: number; general_notes: string | null; created_at: string;
    clients: { business_name: string; tax_id: string | null; contact_name: string | null; email: string | null; phone: string | null; } | null;
  };
  items: Array<{
    item_number: number; quantity: number; custom_description: string | null;
    serial_number: string | null; equipment_number: string | null;
    additional_observation: string | null; unit_price: number; total_price: number;
    products: { code: string | null; name: string; brand: string | null; } | null;
  }>;
}

export function OrderPdfDocument({ order, items }: OrderPdfProps) {
  const currency = order.currency as Currency;
  const isOTS = order.order_type === "OTS";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{EMPRESA_INFO.nombre}</Text>
            <Text style={styles.companySubtitle}>Sellos Mecánicos · Bombas · Equipos Industriales</Text>
            <Text style={styles.companyInfo}>CUIT: {EMPRESA_INFO.cuit}</Text>
            <Text style={styles.companyInfo}>{EMPRESA_INFO.direccion}</Text>
            <Text style={styles.companyInfo}>{EMPRESA_INFO.telefono} · {EMPRESA_INFO.email}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.orderTitle}>
              {isOTS ? "ORDEN DE TRABAJO DE SERVICIO" : "ORDEN DE TRABAJO"}
            </Text>
            <Text style={styles.orderNumber}>{order.order_number}</Text>
          </View>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValue}>{order.clients?.business_name ?? "—"}</Text>
            {order.clients?.tax_id && <Text style={styles.infoValue}>CUIT: {order.clients.tax_id}</Text>}
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Fecha Ingreso</Text>
            <Text style={styles.infoValue}>{format(new Date(order.date_in), "dd/MM/yyyy", { locale: es })}</Text>
          </View>
          {order.date_due && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Fecha Entrega Estimada</Text>
              <Text style={styles.infoValue}>{format(new Date(order.date_due), "dd/MM/yyyy", { locale: es })}</Text>
            </View>
          )}
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Estado</Text>
            <Text style={styles.infoValue}>{ORDER_STATUS_LABELS[order.status as OrderStatus]}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Moneda</Text>
            <Text style={styles.infoValue}>{currency}</Text>
          </View>
        </View>

        {/* Items table */}
        <Text style={styles.sectionTitle}>Ítems</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colNum]}>#</Text>
            <Text style={[styles.th, styles.colQty]}>Cant.</Text>
            <Text style={[styles.th, styles.colDesc]}>Descripción</Text>
            <Text style={[styles.th, styles.colSerie]}>Nro. Serie</Text>
            <Text style={[styles.th, styles.colEquipo]}>Equipo</Text>
            <Text style={[styles.th, styles.colUnit]}>P. Unit.</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.td, styles.colNum]}>{item.item_number}</Text>
              <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colDesc]}>
                {item.products?.name ?? item.custom_description ?? "—"}
                {item.products?.brand ? `\n${item.products.brand}` : ""}
                {item.additional_observation ? `\n${item.additional_observation}` : ""}
              </Text>
              <Text style={[styles.td, styles.colSerie]}>{item.serial_number ?? "—"}</Text>
              <Text style={[styles.td, styles.colEquipo]}>{item.equipment_number ?? "—"}</Text>
              <Text style={[styles.td, styles.colUnit]}>{formatCurrency(item.unit_price, currency)}</Text>
              <Text style={[styles.td, styles.colTotal]}>{formatCurrency(item.total_price, currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totalsRow}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsLine}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.subtotal, currency)}</Text>
            </View>
            <View style={styles.totalFinalLine}>
              <Text style={styles.totalFinalLabel}>TOTAL</Text>
              <Text style={styles.totalFinalValue}>{formatCurrency(order.total, currency)}</Text>
            </View>
          </View>
        </View>

        {/* Observaciones */}
        {order.general_notes && (
          <>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{order.general_notes}</Text>
            </View>
          </>
        )}

        {/* Firma */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Firma y aclaración — Cliente</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Firma y aclaración — SAS Supplier</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Sistema de Trazabilidad SAS Trace — ISO 9001:2015
          </Text>
          <Text style={styles.footerText}>
            Generado el {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
