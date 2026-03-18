// src/components/menu/OrderForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

const FormSchema = z.object({
  customerName: z.string().min(2, "Tên tối thiểu 2 ký tự"),
  customerPhone: z
    .string()
    .regex(/^(0|\+84)[0-9]{8,10}$/, "Số điện thoại không hợp lệ"),
  guestCount: z.coerce.number().min(1, "Tối thiểu 1 người").max(500),
  deliveryTime: z.string().min(1, "Vui lòng chọn ngày giờ"),
  note: z.string().max(300).optional(),
  serviceType: z.enum(["ONLINE", "BANQUET"]).default("ONLINE"),
});

type FormValues = z.infer<typeof FormSchema>;

// Min datetime = now + 1 hour
function minDateTime() {
  const d = new Date();
  d.setHours(d.getHours() + 1);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
}

interface OrderFormProps {
  cartItems?: Array<{ name: string; quantity: number; price: number }>;
}

export function OrderForm({ cartItems = [] }: OrderFormProps) {
  const [success, setSuccess] = useState<{ code: string } | null>(null);
  const { items: storeItems, getTotalPrice, clearCart } = useCartStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allItems = mounted && storeItems.length > 0 ? storeItems : cartItems;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { serviceType: "ONLINE", guestCount: 2 },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        ...data,
        guestCount: Number(data.guestCount),
        deliveryTime: new Date(data.deliveryTime).toISOString(),
        items: allItems.map((item) => ({
          menuItemId: "menuItemId" in item ? item.menuItemId : "",
          quantity: item.quantity,
          note: "note" in item ? item.note : undefined,
        })).filter((i) => i.menuItemId),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lỗi đặt bàn");

      setSuccess({ code: json.data.orderCode });
      clearCart();
      reset();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  if (success) {
    return (
      <div className="bg-ivory py-12 px-6 text-center border border-gold/30">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border border-gold text-gold rounded-full">
          <span className="text-2xl">✓</span>
        </div>
        <h3 className="font-display text-3xl text-navy mb-3">Yêu Cầu Thành Công</h3>
        <p className="text-charcoal/70 mb-6 font-light max-w-sm mx-auto">
          Cảm ơn quý khách. Chúng tôi sẽ liên hệ để xác nhận trong thời gian sớm nhất.
        </p>
        <p className="font-body text-xs uppercase tracking-widest text-charcoal/50 mb-1">Mã tham chiếu</p>
        <p className="font-mono text-xl text-navy tracking-wider mb-8">
          {success.code}
        </p>
        <button
          onClick={() => setSuccess(null)}
          className="text-xs uppercase tracking-widest text-gold hover:text-navy transition-colors border-b border-gold hover:border-navy pb-1"
        >
          Đặt thêm bàn khác
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white p-6 sm:p-10 shadow-sm border border-border/60"
    >
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl text-navy">Thông Tin Đặt Bàn</h2>
        <p className="text-muted-gold italic text-sm mt-1 font-display">Reservation Details</p>
      </div>

      {/* Cart summary */}
      {allItems.length > 0 && (
        <div className="bg-ivory border border-gold/20 p-5 mb-8">
          <p className="text-xs uppercase tracking-widest text-navy mb-4 font-medium text-center border-b border-gold/20 pb-2">
            Thực đơn đã chọn ({allItems.length} món)
          </p>
          <ul className="space-y-3 mb-4">
            {allItems.map((item, i) => (
              <li key={i} className="flex justify-between text-sm text-charcoal">
                <span className="font-display text-lg">{item.name}</span>
                <span className="font-mono text-xs mt-1 text-charcoal/60">x{item.quantity}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-gold/20 pt-3 flex justify-between items-center text-navy">
            <span className="text-xs uppercase tracking-widest font-medium">Tổng tậm tính</span>
            <span className="price-tag text-lg">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency", currency: "VND", maximumFractionDigits: 0,
              }).format(getTotalPrice())}
            </span>
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
        {/* Name */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] text-charcoal/50 mb-1 uppercase tracking-widest font-ui">
            Họ và tên quý khách *
          </label>
          <input
            {...register("customerName")}
            className="w-full bg-transparent px-0 py-2 border-b border-charcoal/20 text-charcoal focus:outline-none focus:border-navy transition-colors placeholder:text-charcoal/30 placeholder:font-light"
            placeholder="Ví dụ: Nguyễn Văn A"
          />
          {errors.customerName && (
            <p className="text-[10px] text-red-500 mt-1 uppercase tracking-wider">{errors.customerName.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[10px] text-charcoal/50 mb-1 uppercase tracking-widest font-ui">
            Số điện thoại *
          </label>
          <input
            {...register("customerPhone")}
            type="tel"
            className="w-full bg-transparent px-0 py-2 border-b border-charcoal/20 text-charcoal focus:outline-none focus:border-navy transition-colors placeholder:text-charcoal/30 placeholder:font-light"
            placeholder="098.648.2222"
          />
          {errors.customerPhone && (
            <p className="text-[10px] text-red-500 mt-1 uppercase tracking-wider">{errors.customerPhone.message}</p>
          )}
        </div>

        {/* Guest count */}
        <div>
          <label className="block text-[10px] text-charcoal/50 mb-1 uppercase tracking-widest font-ui">
            Số lượng khách *
          </label>
          <input
            {...register("guestCount")}
            type="number"
            min={1}
            max={500}
            className="w-full bg-transparent px-0 py-2 border-b border-charcoal/20 text-charcoal focus:outline-none focus:border-navy transition-colors placeholder:text-charcoal/30 placeholder:font-light"
            placeholder="2"
          />
          {errors.guestCount && (
            <p className="text-[10px] text-red-500 mt-1 uppercase tracking-wider">{errors.guestCount.message}</p>
          )}
        </div>

        {/* Datetime */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] text-charcoal/50 mb-1 uppercase tracking-widest font-ui">
            Ngày & Giờ đến *
          </label>
          <input
            {...register("deliveryTime")}
            type="datetime-local"
            min={minDateTime()}
            className="w-full bg-transparent px-0 py-2 border-b border-charcoal/20 text-charcoal focus:outline-none focus:border-navy transition-colors font-light"
          />
          {errors.deliveryTime && (
            <p className="text-[10px] text-red-500 mt-1 uppercase tracking-wider">{errors.deliveryTime.message}</p>
          )}
        </div>

        {/* Service type */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] text-charcoal/50 mb-1 uppercase tracking-widest font-ui">
            Loại dịch vụ
          </label>
          <select
            {...register("serviceType")}
            className="w-full bg-transparent px-0 py-2 border-b border-charcoal/20 text-charcoal focus:outline-none focus:border-navy transition-colors appearance-none font-light"
          >
            <option value="ONLINE">Dùng bữa tại nhà hàng</option>
            <option value="BANQUET">Đặt tiệc / Sự kiện riêng</option>
          </select>
        </div>

        {/* Note */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] text-charcoal/50 mb-1 uppercase tracking-widest font-ui">
            Yêu cầu đặc biệt (Ghi chú)
          </label>
          <textarea
            {...register("note")}
            rows={2}
            className="w-full bg-transparent px-0 py-2 border-b border-charcoal/20 text-charcoal focus:outline-none focus:border-navy transition-colors resize-none placeholder:text-charcoal/30 placeholder:font-light"
            placeholder="Dị ứng thực phẩm, yêu cầu phòng riêng, trang trí..."
          />
        </div>
      </div>

      {/* Submit */}
      <div className="mt-10 mb-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 border border-navy text-navy hover:bg-navy hover:text-gold
            disabled:opacity-50 disabled:cursor-not-allowed
            py-4 uppercase tracking-[0.2em] text-xs font-medium font-ui transition-all"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Gửi yêu cầu"
          )}
        </button>
      </div>

      <p className="text-center text-[10px] uppercase tracking-widest text-charcoal/40">
        Khách sạn Phương Anh rát hân hạnh được phục vụ
      </p>
    </form>
  );
}
