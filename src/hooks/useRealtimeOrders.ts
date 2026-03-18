// src/hooks/useRealtimeOrders.ts
// Supabase Realtime — Lắng nghe đơn hàng mới cho màn hình bếp

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

interface RealtimeOrder {
  id: string;
  order_code: string;
  customer_name: string | null;
  type: string;
  status: string;
  total: number;
  created_at: string;
  note: string | null;
}

interface UseRealtimeOrdersOptions {
  statuses?: string[];
  onNewOrder?: (order: RealtimeOrder) => void;
}

export function useRealtimeOrders({
  statuses = ["NEW", "CONFIRMED", "PREPARING"],
  onNewOrder,
}: UseRealtimeOrdersOptions = {}) {
  const [orders, setOrders] = useState<RealtimeOrder[]>([]);
  const [connected, setConnected] = useState(false);

  const handleNewOrder = useCallback(
    (order: RealtimeOrder) => {
      setOrders((prev) => {
        // Tránh duplicate
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev].slice(0, 50); // Giữ tối đa 50 đơn
      });
      onNewOrder?.(order);
    },
    [onNewOrder]
  );

  const handleStatusUpdate = useCallback((updated: RealtimeOrder) => {
    setOrders((prev) =>
      prev
        .map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
        // Lọc ra những đơn không còn trong filter statuses
        .filter((o) => statuses.includes(o.status))
    );
  }, [statuses]);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("[Realtime] Supabase chưa được cấu hình");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const order = payload.new as RealtimeOrder;
          if (statuses.includes(order.status)) {
            handleNewOrder(order);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          handleStatusUpdate(payload.new as RealtimeOrder);
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleNewOrder, handleStatusUpdate, statuses]);

  return { orders, connected };
}
