import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  price: number;
  qty: number;
};

export async function POST(req: Request) {
  if (!supabase) {
    console.error("Supabase client not initialized.");
    return NextResponse.json(
      { error: "Supabase client not available" },
      { status: 500 }
    );
  }

  const { name, phone, tableNumber, items } = await req.json();

  // Calculate total
  const total = Array.isArray(items)
    ? items.reduce(
        (sum: number, item: OrderItem) => sum + item.price * item.qty,
        0
      )
    : 0;

  const today = new Date();
  const orderDate = today.toISOString().split("T")[0]; // YYYY-MM-DD
  let orderNumber = "";

  try {
    // Create or increment counter safely
    const { data: existingData, error: selectError } = await supabase
      .from("daily_order_counter")
      .select("*")
      .eq("order_date", orderDate)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 = not found, we will insert
      throw selectError;
    }

    let counter = 1;
    if (!existingData) {
      // Insert new row for today
      const { data: insertData, error: insertError } = await supabase
        .from("daily_order_counter")
        .insert({ order_date: orderDate, counter })
        .select()
        .single();

      if (insertError) throw insertError;
      counter = insertData.counter;
    } else {
      // Increment existing counter atomically
      const { data: updateData, error: updateError } = await supabase
        .from("daily_order_counter")
        .update({ counter: existingData.counter + 1 })
        .eq("order_date", orderDate)
        .select()
        .single();

      if (updateError) throw updateError;
      counter = updateData.counter;
    }

    // Format: MMDD-XXX
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const num = String(counter).padStart(3, "0");
    orderNumber = `${mm}${dd}-${num}`;
  } catch (e) {
    console.error("Error generating order number:", e);
    return NextResponse.json(
      { error: "Could not generate order number" },
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
      .select("id, order_number")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { id: data.id, orderNumber: data.order_number },
      { status: 201 }
    );
  } catch (e) {
    console.error("Error placing order:", e);
    return NextResponse.json(
      { error: "Could not place order" },
      { status: 500 }
    );
  }
}
