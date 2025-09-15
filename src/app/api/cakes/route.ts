import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const {
    name,
    phone,
    weightKg,
    icing,
    flavour,
    cakeType,
    shape,
    message,
    withEgg,
    photoCount,
    price,
    referenceImage,
  } = await req.json();

  try {
    const { data, error } = await supabase
      .from("cakes")
      .insert({
        name,
        phone,
        weight_kg: weightKg,
        icing,
        flavour,
        cake_type: cakeType,
        shape,
        message,
        with_egg: withEgg,
        photo_count: photoCount,
        price,
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
