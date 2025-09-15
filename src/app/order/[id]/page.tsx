import { supabase } from "@/lib/supabase";
import OrderActions from "./OrderActions"; // Import the new client component

type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type Order = {
  id: string;
  orderNumber: string;
  name: string;
  phone: string;
  tableNumber?: string;
  items: OrderItem[];
  status: "placed" | "preparing" | "ready" | "completed" | "cancelled";
  total: number;
  createdAt: string;
  payment: "pay-at-counter";
};

type OrdersState = { orders: Order[] };

export default async function OrderStatusPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  if (!supabase) {
    return (
      <main className="px-4 py-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold">Order Not Found</h1>
        <p className="mt-2 text-foreground/70">Supabase is not configured.</p>
      </main>
    );
  }
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,name,phone,table_number,items,status,total,created_at,payment"
    )
    .or(`id.eq.${id},order_number.eq.${id}`)
    .single();
  if (error || !data) {
    return (
      <main className="px-4 py-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold">Order Not Found</h1>
        <p className="mt-2 text-foreground/70">Please check your link.</p>
      </main>
    );
  }
  const order = {
    id: data.id,
    orderNumber: data.order_number as string,
    name: data.name as string,
    phone: data.phone as string,
    tableNumber: data.table_number as string | undefined,
    items: (data.items as any[]) || [],
    status: data.status as any,
    total: Number(data.total) || 0,
    createdAt: data.created_at as string,
    payment: data.payment as any,
  } as Order;

  const createdMs = new Date(order.createdAt).getTime();
  const cancellable = Date.now() - createdMs < 60_000;

  return (
    <main className="px-4 py-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-[var(--muted)] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[var(--muted)]">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Order Ticket</h1>
            <span className="text-sm">#{order.orderNumber}</span>
          </div>
          <p className="text-xs text-foreground/60 mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="p-5 grid grid-cols-1 gap-4">
          <div>
            <p className="text-sm">
              Customer: <span className="font-medium">{order.name}</span> •{" "}
              {order.phone}
            </p>
            {order.tableNumber && (
              <p className="text-sm mt-1">
                Table: <span className="font-medium">{order.tableNumber}</span>
              </p>
            )}
            <p className="text-sm mt-1">
              Status: <span className="font-medium">{order.status}</span>
            </p>
          </div>

          <div className="rounded-lg border border-[var(--muted)]">
            <div className="p-3 border-b border-[var(--muted)] text-sm font-medium">
              Items
            </div>
            <div className="p-3 space-y-2 text-sm">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between">
                  <span>
                    {it.name} × {it.qty}
                  </span>
                  <span>₹{it.price * it.qty}</span>
                </div>
              ))}
              <hr className="my-2" />
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Use the new client component here */}
          <OrderActions order={order} cancellable={cancellable} />
        </div>

        <div
          id="invoice-section"
          className="p-5 border-t border-[var(--muted)] text-xs text-foreground/70"
        >
          <div className="flex items-center justify-between">
            <span>Invoice</span>
            <span>#{order.orderNumber}</span>
          </div>
          <div className="mt-2 text-xs">Name: {order.name}</div>
          <div className="text-xs">Phone: {order.phone}</div>
          {order.tableNumber && (
            <div className="text-xs">Table: {order.tableNumber}</div>
          )}
          <div className="mt-2 text-xs">Total: ₹{order.total}</div>
        </div>
      </div>
    </main>
  );
}
