"use client";
// order-form.tsx — src/components/orders/order-form.tsx — 2026-05-19
// Formulario completo para crear y editar órdenes de trabajo con ítems

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ClientSelect } from "@/components/clients/client-select";
import { ProductSelect } from "@/components/products/product-select";
import { formatCurrency } from "@/lib/utils";
import type { Client, Product, WorkOrder, WorkOrderItem, Currency } from "@/lib/types/database";

const itemSchema = z.object({
  product_id: z.string().nullable(),
  custom_description: z.string().optional(),
  quantity: z.number().min(1, "Cantidad mínima: 1"),
  serial_number: z.string().optional(),
  equipment_number: z.string().optional(),
  additional_observation: z.string().optional(),
  unit_price: z.number().min(0),
  repair_required: z.boolean(),
  notes: z.string().optional(),
});

const orderSchema = z.object({
  order_type: z.enum(["OT", "OTS"]),
  client_id: z.string().nullable(),
  date_in: z.string().min(1),
  date_due: z.string().optional(),
  currency: z.enum(["USD", "ARS"]),
  general_notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "Debe agregar al menos un ítem"),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  clients: Pick<Client, "id" | "business_name" | "tax_id">[];
  products: Pick<Product, "id" | "code" | "name" | "brand" | "model" | "category" | "unit" | "default_currency" | "default_unit_price">[];
  defaultClientId?: string;
  order?: WorkOrder;
  orderItems?: WorkOrderItem[];
}

export function OrderForm({ clients, products, defaultClientId, order, orderItems }: OrderFormProps) {
  const router = useRouter();
  const isEdit = !!order;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: order
      ? {
          order_type: order.order_type,
          client_id: order.client_id,
          date_in: order.date_in.split("T")[0],
          date_due: order.date_due?.split("T")[0] ?? "",
          currency: order.currency,
          general_notes: order.general_notes ?? "",
          items: orderItems?.map((item) => ({
            product_id: item.product_id,
            custom_description: item.custom_description ?? "",
            quantity: item.quantity,
            serial_number: item.serial_number ?? "",
            equipment_number: item.equipment_number ?? "",
            additional_observation: item.additional_observation ?? "",
            unit_price: item.unit_price,
            repair_required: item.repair_required,
            notes: item.notes ?? "",
          })) ?? [],
        }
      : {
          order_type: "OTS",
          client_id: defaultClientId ?? null,
          date_in: new Date().toISOString().split("T")[0],
          currency: "USD",
          items: [{ product_id: null, quantity: 1, unit_price: 0, repair_required: false }],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const orderType = watch("order_type");
  const currency = watch("currency") as Currency;
  const watchedItems = watch("items");

  const total = watchedItems.reduce((sum, item) => sum + (item.quantity ?? 0) * (item.unit_price ?? 0), 0);

  function handleProductSelect(index: number, productId: string | null) {
    setValue(`items.${index}.product_id`, productId);
    if (productId) {
      const product = products.find((p) => p.id === productId);
      if (product?.default_unit_price) {
        setValue(`items.${index}.unit_price`, product.default_unit_price);
      }
    }
  }

  async function onSubmit(data: OrderFormData) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data: { user } } = await supabase.auth.getUser();

    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

    if (isEdit && order) {
      const { error: orderError } = await sb.from("work_orders").update({
        order_type: data.order_type, client_id: data.client_id, date_in: data.date_in,
        date_due: data.date_due || null, currency: data.currency,
        general_notes: data.general_notes || null, subtotal, total: subtotal, updated_by: user?.id,
      }).eq("id", order.id);

      if (orderError) { toast.error("Error al actualizar la orden"); return; }

      await sb.from("work_order_items").delete().eq("work_order_id", order.id);
      const itemsToInsert = data.items.map((item, i) => ({
        work_order_id: order.id, item_number: i + 1, product_id: item.product_id,
        custom_description: item.custom_description || null, quantity: item.quantity,
        serial_number: item.serial_number || null, equipment_number: item.equipment_number || null,
        additional_observation: item.additional_observation || null,
        unit_price: item.unit_price, total_price: item.quantity * item.unit_price,
        repair_required: item.repair_required, notes: item.notes || null, status: "pendiente",
      }));
      await sb.from("work_order_items").insert(itemsToInsert);
      toast.success("Orden actualizada");
      router.push(`/ordenes/${order.id}`);
      return;
    }

    const { data: orderNumber, error: seqError } = await sb.rpc("generate_order_number", { p_order_type: data.order_type });
    if (seqError || !orderNumber) { toast.error("Error al generar número de orden"); return; }

    const { data: newOrder, error: orderError } = await sb.from("work_orders").insert({
      order_number: orderNumber, order_type: data.order_type, client_id: data.client_id,
      date_in: data.date_in, date_due: data.date_due || null, status: "ingresada",
      currency: data.currency, subtotal, total: subtotal,
      general_notes: data.general_notes || null, created_by: user?.id,
    }).select("id").single();

    if (orderError || !newOrder) { toast.error("Error al crear la orden"); return; }

    const itemsToInsert = data.items.map((item, i) => ({
      work_order_id: newOrder.id, item_number: i + 1, product_id: item.product_id,
      custom_description: item.custom_description || null, quantity: item.quantity,
      serial_number: item.serial_number || null, equipment_number: item.equipment_number || null,
      additional_observation: item.additional_observation || null,
      unit_price: item.unit_price, total_price: item.quantity * item.unit_price,
      repair_required: item.repair_required, notes: item.notes || null, status: "pendiente",
    }));
    await sb.from("work_order_items").insert(itemsToInsert);
    await sb.from("work_order_status_history").insert({
      work_order_id: newOrder.id, old_status: null, new_status: "ingresada",
      changed_by: user?.id, notes: "Orden creada",
    });
    await sb.from("audit_logs").insert({
      entity_type: "work_order", entity_id: newOrder.id, action: "create",
      description: `Orden ${orderNumber} creada`, user_id: user?.id, user_name: user?.email,
    });

    toast.success(`Orden ${orderNumber} creada exitosamente`);
    router.push(`/ordenes/${newOrder.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Card 1: Datos Generales */}
      <div className="sas-card p-6">
        <h2 className="font-semibold text-(--sas-text) mb-5">Datos Generales</h2>

        {/* Tipo de orden */}
        <div className="mb-6">
          <Label className="mb-2 block">Tipo de orden *</Label>
          <div className="flex gap-3">
            {(["OT", "OTS"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue("order_type", type)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                  orderType === type
                    ? type === "OT"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-(--sas-border) text-(--sas-text-muted) hover:border-slate-300"
                }`}
              >
                {type === "OT" ? "OT — Venta / Mercadería nueva" : "OTS — Servicio / Reparación"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-1.5 lg:col-span-2">
            <Label>Cliente</Label>
            <ClientSelect
              clients={clients as Client[]}
              value={watch("client_id")}
              onChange={(id) => setValue("client_id", id)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Fecha de ingreso *</Label>
            <Input type="date" {...register("date_in")} />
            {errors.date_in && <p className="text-xs text-red-600">{errors.date_in.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Fecha estimada de entrega</Label>
            <Input type="date" {...register("date_due")} />
          </div>

          <div className="space-y-1.5">
            <Label>Moneda</Label>
            <Select value={currency} onValueChange={(v) => setValue("currency", (v ?? "USD") as "USD" | "ARS")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD — Dólares</SelectItem>
                <SelectItem value="ARS">ARS — Pesos argentinos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <Label>Observaciones generales</Label>
            <Textarea
              {...register("general_notes")}
              placeholder="Notas sobre la orden, condiciones especiales, referencias..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Card 2: Ítems */}
      <div className="sas-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-(--sas-text)">Ítems</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ product_id: null, quantity: 1, unit_price: 0, repair_required: false })}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Agregar ítem
          </Button>
        </div>

        {errors.items && typeof errors.items === "object" && "message" in errors.items && (
          <p className="text-sm text-red-600 mb-3">{(errors.items as { message?: string }).message}</p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => {
            const itemQty = watchedItems[index]?.quantity ?? 1;
            const itemPrice = watchedItems[index]?.unit_price ?? 0;
            const itemTotal = itemQty * itemPrice;

            return (
              <div key={field.id} className="border border-(--sas-border) rounded-lg p-4 space-y-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-(--sas-text-muted) uppercase tracking-wide">
                    Ítem #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-2 space-y-1.5">
                    <Label>Producto / Servicio</Label>
                    <ProductSelect
                      products={products as Product[]}
                      value={watchedItems[index]?.product_id ?? null}
                      onChange={(id) => handleProductSelect(index, id)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cantidad *</Label>
                    <Input
                      type="number"
                      min={1}
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {!watchedItems[index]?.product_id && (
                  <div className="space-y-1.5">
                    <Label>Descripción libre *</Label>
                    <Input
                      {...register(`items.${index}.custom_description`)}
                      placeholder="Descripción del ítem o servicio..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Número de serie</Label>
                    <Input {...register(`items.${index}.serial_number`)} placeholder="SN-..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Número de equipo</Label>
                    <Input {...register(`items.${index}.equipment_number`)} placeholder="P-101, K-201..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Precio unitario</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Precio total</Label>
                    <div className="h-10 px-3 rounded-md border border-(--sas-border) bg-slate-100 flex items-center text-sm font-medium">
                      {formatCurrency(itemTotal, currency)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Observación adicional</Label>
                  <Input {...register(`items.${index}.additional_observation`)} placeholder="Observaciones específicas del ítem..." />
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id={`repair_${index}`}
                    checked={watchedItems[index]?.repair_required ?? false}
                    onCheckedChange={(v) => setValue(`items.${index}.repair_required`, v)}
                  />
                  <Label htmlFor={`repair_${index}`}>Requiere reparación</Label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-4 flex justify-end">
          <div className="bg-sas-navy text-white px-6 py-3 rounded-lg flex items-center gap-4">
            <span className="text-sm font-medium opacity-80">Total de la orden:</span>
            <span className="text-xl font-bold">{formatCurrency(total, currency)}</span>
          </div>
        </div>
      </div>

      {/* Card 3: Acciones */}
      <div className="sas-card p-5">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" asChild>
            <Link href="/ordenes"><ArrowLeft className="w-4 h-4 mr-1.5" /> Cancelar</Link>
          </Button>
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-sas-navy-mid hover:bg-sas-navy text-white px-8"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Guardar orden"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
