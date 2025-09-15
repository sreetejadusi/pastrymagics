import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Assuming you still want this function
function generateOrderNumber(): string {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PM-${y}${m}${day}-${rand}`;
}

export async function POST(req: Request) {
  const { name, phone, tableNumber, items } = await req.json();
  const orderNumber = generateOrderNumber();
  const total = items.reduce(
    (sum: number, item: any) => sum + item.price * item.qty,
    0
  );

  try {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        name,
        phone,
        table_number: tableNumber,
        items, // Supabase automatically handles JSONB conversion
        status: "placed",
        total,
        payment: "pay-at-counter",
      })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ id: data[0].id });
  } catch (e) {
    console.error("Error placing order:", e);
    return NextResponse.json(
      { error: "Could not place order." },
      { status: 500 }
    );
  }
}
