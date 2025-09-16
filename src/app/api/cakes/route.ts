import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { name, phone, price, referenceImage, ...customization } =
    await req.json();

  try {
    const { data, error } = await supabase
      .from("cakes")
      .insert({
        name,
        phone,
        total_price: price, // Now uses total_price
        customization, // Stores all details in a single JSONB object
        reference_image_url: referenceImage,
      })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ id: data[0].id });
  } catch (e) {
    console.error("Error saving cake configuration:", e);
    return NextResponse.json(
      { error: "Could not save configuration." },
      { status: 500 }
    );
  }
}
