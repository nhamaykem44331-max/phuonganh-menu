// src/lib/webhooks.ts
// n8n Webhook Integration - Gửi sự kiện ra n8n để automation

import { createHmac } from "crypto";

type WebhookEvent =
  | "order.created"
  | "order.updated"
  | "order.cancelled"
  | "banquet.created"
  | "banquet.confirmed"
  | "banquet.reminder";

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

// =============================================
// HMAC SIGNATURE (S9)
// =============================================

function signPayload(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

// =============================================
// FIRE AND FORGET WEBHOOK
// =============================================

export async function fireWebhook(
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!n8nBaseUrl) {
    console.warn("[Webhook] N8N_WEBHOOK_BASE_URL chưa được cấu hình, bỏ qua.");
    return;
  }

  // Map event → n8n webhook path
  const pathMap: Record<WebhookEvent, string> = {
    "order.created":     "/webhook/order-created",
    "order.updated":     "/webhook/order-updated",
    "order.cancelled":   "/webhook/order-cancelled",
    "banquet.created":   "/webhook/banquet-created",
    "banquet.confirmed": "/webhook/banquet-confirmed",
    "banquet.reminder":  "/webhook/banquet-reminder",
  };

  const url = `${n8nBaseUrl}${pathMap[event]}`;

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const bodyStr = JSON.stringify(payload);

  // S9: HMAC-SHA256 signature thay vì gửi secret plaintext
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers["X-Webhook-Signature"] = signPayload(bodyStr, secret);
  }

  try {
    // Fire and forget - không await để không block response
    fetch(url, {
      method: "POST",
      headers,
      body: bodyStr,
      signal: AbortSignal.timeout(5000), // Timeout 5s
    })
      .then(async (res) => {
        // S8: Log response status
        if (!res.ok) {
          console.error(
            `[Webhook] Event ${event} → ${res.status} ${res.statusText}`
          );
        }
      })
      .catch((err) => {
        console.error(`[Webhook] Lỗi gửi event ${event}:`, err.message);
      });
  } catch (err) {
    // Log nhưng không throw - webhook fail không nên ảnh hưởng response
    console.error(`[Webhook] Không thể gửi event ${event}:`, err);
  }
}

// =============================================
// SPECIFIC WEBHOOK HELPERS
// =============================================

export async function notifyNewOrder(order: {
  id: string;
  orderCode: string;
  customerName?: string | null;
  customerPhone?: string | null;
  type: string;
  status: string;
  total: number;
  guestCount?: number | null;
  deliveryTime?: Date | null;
  note?: string | null;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    note?: string | null;
  }>;
}) {
  await fireWebhook("order.created", {
    ...order,
    total: order.total,
    deliveryTime: order.deliveryTime?.toISOString(),
    itemCount: order.items.length,
    itemsSummary: order.items
      .map((i) => `${i.name} x${i.quantity}`)
      .join(", "),
  });
}

export async function notifyOrderStatusChange(order: {
  id: string;
  orderCode: string;
  oldStatus: string;
  newStatus: string;
  tableId?: string | null;
  tableName?: string | null;
}) {
  await fireWebhook("order.updated", order);
}

export async function notifyNewBanquet(banquet: {
  id: string;
  eventType: string;
  eventDate: Date;
  guestCount: number;
  customerName?: string | null;
  customerPhone?: string | null;
  roomName?: string | null;
  pricePerPerson?: number | null;
  totalPrice?: number | null;
  note?: string | null;
}) {
  await fireWebhook("banquet.created", {
    ...banquet,
    eventDate: banquet.eventDate.toISOString(),
  });
}

export async function notifyBanquetConfirmed(banquet: {
  id: string;
  eventType: string;
  eventDate: Date;
  guestCount: number;
  customerName?: string | null;
  customerPhone?: string | null;
  totalPrice?: number | null;
}) {
  await fireWebhook("banquet.confirmed", {
    ...banquet,
    eventDate: banquet.eventDate.toISOString(),
  });
}

export async function notifyBanquetReminder(banquet: {
  id: string;
  eventType: string;
  eventDate: Date;
  guestCount: number;
  customerName?: string | null;
  customerPhone?: string | null;
  daysUntil: number;
}) {
  await fireWebhook("banquet.reminder", {
    ...banquet,
    eventDate: banquet.eventDate.toISOString(),
    message:
      `⏰ Nhắc nhở: ${banquet.eventType} của ${banquet.customerName}` +
      ` còn ${banquet.daysUntil} ngày nữa!`,
  });
}
