import { supabase } from "@/lib/supabase";

export default async function CustomiseById({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  if (!supabase) {
    return (
      <main className="px-4 py-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold">Cake Not Found</h1>
        <p className="mt-2 text-foreground/70">Supabase is not configured.</p>
      </main>
    );
  }
  const { data, error } = await supabase
    .from("cakes")
    .select(
      "id,name,phone,weight_kg,icing,flavour,cake_type,shape,message,reference_image_url,created_at"
    )
    .eq("id", id)
    .single();
  if (error || !data) {
    return (
      <main className="px-4 py-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold">Cake Not Found</h1>
        <p className="mt-2 text-foreground/70">Please check your link.</p>
      </main>
    );
  }

  return (
    <main className="px-4 py-6 max-w-5xl mx-auto">
      <h1 className="text-3xl md:text-4xl">Saved Cake</h1>
      <p className="text-foreground/70 mt-1">
        for {data.name} • {data.phone}
      </p>

      <section className="mt-6 rounded-2xl border border-[var(--muted)] bg-white p-4 md:p-6">
        <h2 className="text-lg font-semibold">Details</h2>
        <div className="mt-2 text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>Weight: {data.weight_kg}kg</div>
          <div>Icing: {data.icing}</div>
          <div>Flavour: {data.flavour}</div>
          <div>Type: {data.cake_type}</div>
          <div>Shape: {data.shape}</div>
          {data.message && <div>Text: {data.message}</div>}
        </div>
        {data.reference_image_url && (
          <div className="mt-4">
            <p className="text-sm font-medium">Design reference</p>
            <img
              src={data.reference_image_url}
              alt="Design reference"
              className="mt-2 max-h-60 rounded-md border border-[var(--muted)]"
            />
          </div>
        )}
      </section>
    </main>
  );
}
