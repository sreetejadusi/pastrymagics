import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const body = (await req.json()) as { dataUrl: string };
  const { dataUrl } = body;
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }
  const [meta, base64] = dataUrl.split(",");
  const contentType = meta.split(":")[1].split(";")[0] || "image/png";
  const buffer = Buffer.from(base64, "base64");
  const filename = `${uuidv4()}` + (contentType.includes("png") ? ".png" : contentType.includes("jpeg") ? ".jpg" : "");
  const { data, error } = await supabase.storage.from("cake-images").upload(filename, buffer, {
    contentType,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: pub } = supabase.storage.from("cake-images").getPublicUrl(data.path);
  return NextResponse.json({ url: pub.publicUrl });
}


