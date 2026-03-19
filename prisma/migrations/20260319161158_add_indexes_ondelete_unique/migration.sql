/*
  Warnings:

  - A unique constraint covering the columns `[pin]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "combo_items" DROP CONSTRAINT "combo_items_menuItemId_fkey";

-- CreateIndex
CREATE INDEX "menu_items_categoryId_idx" ON "menu_items"("categoryId");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_menuItemId_idx" ON "order_items"("menuItemId");

-- CreateIndex
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");

-- CreateIndex
CREATE INDEX "orders_staffId_idx" ON "orders"("staffId");

-- CreateIndex
CREATE INDEX "orders_tableId_idx" ON "orders"("tableId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_orderDate_idx" ON "orders"("orderDate");

-- CreateIndex
CREATE INDEX "price_history_menuItemId_idx" ON "price_history"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "users_pin_key" ON "users"("pin");

-- AddForeignKey
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
