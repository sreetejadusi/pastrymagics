import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  price: number;
  qty: number;
};


export async function POST(req: Request) {
  const { name, phone, tableNumber, items } = await req.json();

  // Calculate total from items
  const total = Array.isArray(items)
    ? items.reduce((sum: number, item: OrderItem) => sum + (item.price * item.qty), 0)
    : 0;

  let orderNumber: number;
  if (!supabase) {
    console.error("Supabase client is not initialized.");
    return NextResponse.json(
      { error: "Supabase client is not available." },
      { status: 500 }
    );
  }
  try {
    const { data, error } = await supabase.rpc("get_next_order_number");
    if (error || data === null) {
      console.error("Error getting next order number:", error);
      return NextResponse.json(
        { error: "Could not generate order number." },
        { status: 500 }
      );
    }
    orderNumber = data;
  } catch (e) {
    console.error("Error in RPC call:", e);
    return NextResponse.json(
      { error: "Could not generate order number." },
      { status: 500 }
    );
  }
  if (!supabase) {
    console.error("Supabase client is not initialized.");
    return NextResponse.json(
      { error: "Supabase client is not available." },
      { status: 500 }
    );
  }
  try {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        name,
        phone,
        table_number: tableNumber,
        items,
        status: "placed",
        total,
        payment: "pay-at-counter",
      })
      .select("id, order_number"); // Select the order number to return it to the client

    if (error) {
      throw error;
    }

    return NextResponse.json({
      id: data[0].id,
      orderNumber: data[0].order_number,
    });
  } catch (e) {
    console.error("Error placing order:", e);
    return NextResponse.json(
      { error: "Could not place order." },
      { status: 500 }
    );
  }
}