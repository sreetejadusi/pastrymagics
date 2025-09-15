import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idOrNumber = searchParams.get("id");
  if (!idOrNumber)
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );

  // Lookup by id or order_number
  const { data, error } = await supabase
    .from("orders")
    .select("id,order_number,created_at,status")
    .or(`id.eq.${idOrNumber},order_number.eq.${idOrNumber}`)
    .single();
  if (error || !data)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ageMs = Date.now() - new Date(data.created_at as string).getTime();
  if (ageMs > 60_000)
    return NextResponse.json(
      { error: "Cancellation window expired" },
      { status: 400 }
    );

  const { error: updErr } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", data.id);
  if (updErr)
    return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
