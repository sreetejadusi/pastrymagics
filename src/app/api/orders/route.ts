import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  price: number;
  qty: number;
};

export async function POST(req: Request) {
  try {
    const { name, phone, tableNumber, items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item." },
        { status: 400 }
      );
    }

    // Calculate total
    const total = items.reduce(
      (sum: number, item: OrderItem) => sum + item.price * item.qty,
      0
    );

    if (!supabase) {
      console.error("Supabase client is not initialized.");
      return NextResponse.json(
        { error: "Supabase client is not available." },
        { status: 500 }
      );
    }

    // Use sequence to get next order number
    const { data: orderNumberData, error: orderNumberError } =
      await supabase.rpc("get_next_order_number");

    if (orderNumberError || orderNumberData === null) {
      console.error("Error getting next order number:", orderNumberError);
      return NextResponse.json(
        { error: "Could not generate order number." },
        { status: 500 }
      );
    }

    const orderNumber = orderNumberData;

    // Insert order
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
      .select("id, order_number");

    if (error) {
      console.error("Error placing order:", error);
      return NextResponse.json(
        { error: "Could not place order." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data[0].id,
      orderNumber: data[0].order_number,
    });
  } catch (e) {
    console.error("Unexpected error in POST /orders:", e);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
