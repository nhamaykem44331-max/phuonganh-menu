// src/components/admin/DashboardChart.tsx
"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

interface DayData {
  date: string;
  revenue: number;
  orders: number;
}

function formatVND(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return value.toString();
}

export function DashboardChart() {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports/revenue?period=week")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          // Build 7-day array from today backwards
          const days: DayData[] = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString("vi-VN", {
              day: "2-digit", month: "2-digit",
            });
            days.push({ date: label, revenue: 0, orders: 0 });
          }
          // Merge actual data
          const recent = json.data.recentOrders ?? [];
          recent.forEach((o: { createdAt: string; total: number }) => {
            const label = new Date(o.createdAt).toLocaleDateString("vi-VN", {
              day: "2-digit", month: "2-digit",
            });
            const day = days.find((d) => d.date === label);
            if (day) {
              day.revenue += o.total;
              day.orders += 1;
            }
          });
          setData(days);
        }
      })
      .catch(() => {
        // Fallback: show empty chart
        const days: DayData[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          days.push({
            date: d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
            revenue: 0,
            orders: 0,
          });
        }
        setData(days);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-52 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-jade border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="rgb(17,68,45)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="rgb(17,68,45)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatVND}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          formatter={(value: number) =>
            new Intl.NumberFormat("vi-VN", {
              style: "currency", currency: "VND", maximumFractionDigits: 0,
            }).format(value)
          }
          labelStyle={{ color: "#1a1612", fontWeight: 600 }}
          contentStyle={{
            border: "1px solid #e1d7c8",
            borderRadius: 12,
            fontSize: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Doanh thu"
          stroke="rgb(17,68,45)"
          strokeWidth={2}
          fill="url(#revGrad)"
          dot={{ r: 3, fill: "rgb(17,68,45)", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "rgb(17,68,45)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
