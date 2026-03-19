// src/store/useCartStore.ts
// Global State Management - Giỏ hàng tạm tính
// Sử dụng Zustand + persist middleware (lưu localStorage)

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// =============================================
// TYPES
// =============================================

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  nameEn?: string | null;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  note?: string; // Ghi chú món: "không hành", "ít cay"
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;        // Trạng thái popup giỏ hàng
  tableId?: string;       // Bàn đang phục vụ (staff mode)
  tableName?: string;

  // Computed values (actions)
  getTotalItems: () => number;
  getTotalPrice: () => number;

  // Cart actions
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateNote: (menuItemId: string, note: string) => void;
  clearCart: () => void;

  // UI actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Table actions (staff mode)
  setTable: (tableId: string, tableName: string) => void;
  clearTable: () => void;
}

// =============================================
// STORE
// =============================================

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      tableId: undefined,
      tableName: undefined,

      // ----------------------------------------
      // Computed Values
      // ----------------------------------------

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + (item.price === -1 ? 0 : item.price) * item.quantity,
          0
        );
      },

      // ----------------------------------------
      // Cart Actions
      // ----------------------------------------

      addItem: (newItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.menuItemId === newItem.menuItemId
          );

          if (existingIndex >= 0) {
            // Món đã có → tăng số lượng
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity:
                updatedItems[existingIndex].quantity + (newItem.quantity ?? 1),
            };
            return { items: updatedItems };
          }

          // Món mới → thêm vào cuối
          return {
            items: [
              ...state.items,
              {
                ...newItem,
                id: `${newItem.menuItemId}-${Date.now()}`,
                quantity: newItem.quantity ?? 1,
              },
            ],
          };
        });
      },

      removeItem: (menuItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.menuItemId !== menuItemId),
        }));
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.menuItemId === menuItemId ? { ...item, quantity } : item
          ),
        }));
      },

      updateNote: (menuItemId, note) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.menuItemId === menuItemId ? { ...item, note } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], tableId: undefined, tableName: undefined });
      },

      // ----------------------------------------
      // UI Actions
      // ----------------------------------------

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // ----------------------------------------
      // Table Actions (Staff Mode)
      // ----------------------------------------

      setTable: (tableId, tableName) => {
        set({ tableId, tableName });
      },

      clearTable: () => {
        set({ tableId: undefined, tableName: undefined });
      },
    }),
    {
      name: "phuonganh-cart-storage",
      storage: createJSONStorage(() => localStorage),
      // Chỉ persist items, không persist isOpen
      partialize: (state) => ({
        items: state.items,
        tableId: state.tableId,
        tableName: state.tableName,
      }),
    }
  )
);
