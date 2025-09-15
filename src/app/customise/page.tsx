"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";

type WeightOption = 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 4 | 5;
type IcingOption = "frost" | "fondant" | "semi-fondant";
type FlavourOption =
  | "vanilla"
  | "chocolate"
  | "red-velvet"
  | "strawberry"
  | "butterscotch";
type CakeTypeOption = "pastry" | "normal" | "step";
type ShapeOption = "circle" | "square" | "heart";

export default function Customise() {
  const [weightKg, setWeightKg] = useState<WeightOption>(1);
  const [icing, setIcing] = useState<IcingOption>("frost");
  const [flavour, setFlavour] = useState<FlavourOption>("vanilla");
  const [cakeType, setCakeType] = useState<CakeTypeOption>("normal");
  const [shape, setShape] = useState<ShapeOption>("circle");
  const [message, setMessage] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [withEgg, setWithEgg] = useState(true);
  const [photoCount, setPhotoCount] = useState(0);
  const [options, setOptions] = useState<
    Array<{ option_type: string; option_name: string; base_price: number }>
  >([]);
  const [extraPricing, setExtraPricing] = useState<
    Array<{
      addon_name: string;
      weight_range: string;
      addon_price: number;
    }>
  >([]);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("cake_options")
        .select("option_type,option_name,base_price");
      if (!error && data) setOptions(data as any);

      const { data: extraData, error: extraError } = await supabase
        .from("extra_pricing")
        .select("addon_name,weight_range,addon_price");
      if (!extraError && extraData) setExtraPricing(extraData as any);
    })();
  }, []);

  const sellingPrice = useMemo(() => {
    const getPrice = (type: string, name: string | number) => {
      const found = options.find(
        (o) => o.option_type === type && String(o.option_name) === String(name)
      );
      return found ? Number(found.base_price) : 0;
    };

    const eggSuffix = withEgg ? "with_egg" : "eggless";
    const flavourWithWeight = `${flavour}_${weightKg}kg_${eggSuffix}`;
    let total = getPrice("flavour_weight", flavourWithWeight);

    const getExtraPrice = (
      addonName: string,
      currentWeight: number,
      count = 1
    ) => {
      const addon = extraPricing.find((e) => e.addon_name === addonName);
      if (!addon) return 0;
      if (addon.weight_range === "per photo") {
        return addon.addon_price * count;
      }
      const [min, max] = addon.weight_range.split("-").map(parseFloat);
      if (currentWeight >= min && currentWeight <= max) {
        return addon.addon_price;
      }
      return 0;
    };

    if (icing === "fondant" || icing === "semi-fondant") {
      total += getExtraPrice(icing, weightKg);
    }
    total += getExtraPrice("Photo Cake", weightKg, photoCount);

    return total;
  }, [
    options,
    extraPricing,
    weightKg,
    icing,
    flavour,
    cakeType,
    shape,
    withEgg,
    photoCount,
  ]);

  const isStepCake = cakeType === "step";
  const minWeightForStep = 3;
  const weightOptions: WeightOption[] = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5];

  const icingColor = useMemo(() => {
    const map: Record<IcingOption, string> = {
      frost: "#fff1f3",
      fondant: "#f5c6cf",
      "semi-fondant": "#f8d9e0",
    };
    return map[icing];
  }, [icing]);

  const flavourColor = useMemo(() => {
    const map: Record<FlavourOption, string> = {
      vanilla: "#fef3c7",
      chocolate: "#9f7046",
      "red-velvet": "#e57373",
      strawberry: "#f8b4c0",
      butterscotch: "#f6c56c",
    };
    return map[flavour];
  }, [flavour]);

  const layersForWeight = useMemo(() => {
    // Simple mapping: 1-2kg single layer, 3-4kg double, 5kg triple (for preview only)
    if (isStepCake) return Math.max(2, Math.min(3, Math.floor(weightKg / 2)));
    if (weightKg <= 2) return 1;
    if (weightKg <= 4) return 2;
    return 3;
  }, [weightKg, isStepCake]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReferenceImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // QR is generated after saving; no URL param syncing.

  const shapePath = useMemo(() => {
    if (shape === "circle") return { rx: 100, ry: 60, d: "" };
    if (shape === "square") return { rx: 8, ry: 8, d: "" };
    // heart path
    return {
      rx: 0,
      ry: 0,
      d: "M150 60 C 150 30, 110 30, 110 60 C 110 90, 150 110, 150 130 C 150 110, 190 90, 190 60 C 190 30, 150 30, 150 60 Z",
    };
  }, [shape]);

  const invalidStep = isStepCake && weightKg < minWeightForStep;

  return (
    <main className="px-4 py-6 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl text-center">Customise Your Cake</h1>
      <p className="text-center mt-2 text-foreground/70">
        Pick options below and watch your cake come to life.
      </p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <section className="rounded-2xl border border-[var(--muted)] bg-white p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Weight */}
            <div>
              <label className="block text-sm font-medium">Weight</label>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {weightOptions.map((w) => (
                  <button
                    key={w}
                    onClick={() => setWeightKg(w)}
                    className={`px-3 py-2 rounded-md text-sm border ${
                      weightKg === w
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-white text-foreground border-[var(--muted)] hover:bg-[var(--muted)]/50"
                    }`}
                    aria-pressed={weightKg === w}
                  >
                    {w}kg
                  </button>
                ))}
              </div>
            </div>

            {/* Icing */}
            <div>
              <label className="block text-sm font-medium">Icing Type</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  ["frost", "fondant", "semi-fondant"] as IcingOption[]
                ).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setIcing(opt)}
                    className={`px-3 py-2 rounded-md text-sm border ${
                      icing === opt
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-white text-foreground border-[var(--muted)] hover:bg-[var(--muted)]/50"
                    }`}
                    aria-pressed={icing === opt}
                  >
                    {opt === "frost"
                      ? "Frost Icing"
                      : opt === "fondant"
                      ? "Fondant"
                      : "Semi Fondant"}
                  </button>
                ))}
              </div>
            </div>

            {/* Flavour */}
            <div>
              <label className="block text-sm font-medium">Flavour</label>
              <select
                className="mt-2 w-full rounded-md border border-[var(--muted)] bg-white px-3 py-2 text-sm"
                value={flavour}
                onChange={(e) => setFlavour(e.target.value as FlavourOption)}
              >
                <option value="vanilla">Vanilla</option>
                <option value="chocolate">Chocolate</option>
                <option value="red-velvet">Red Velvet</option>
                <option value="strawberry">Strawberry</option>
                <option value="butterscotch">Butterscotch</option>
              </select>
            </div>

            {/* Egg/Eggless */}
            <div>
              <label className="block text-sm font-medium">Cake Type</label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setWithEgg(true)}
                  className={`px-3 py-2 rounded-md text-sm border ${
                    withEgg
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-white text-foreground border-[var(--muted)] hover:bg-[var(--muted)]/50"
                  }`}
                  aria-pressed={withEgg}
                >
                  With Egg
                </button>
                <button
                  onClick={() => setWithEgg(false)}
                  className={`px-3 py-2 rounded-md text-sm border ${
                    !withEgg
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-white text-foreground border-[var(--muted)] hover:bg-[var(--muted)]/50"
                  }`}
                  aria-pressed={!withEgg}
                >
                  Eggless
                </button>
              </div>
            </div>

            {/* Photo Cake */}
            <div>
              <label className="block text-sm font-medium">Photo Cake</label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={photoCount}
                  onChange={(e) => setPhotoCount(parseInt(e.target.value))}
                  className="w-20 rounded-md border border-[var(--muted)] bg-white px-3 py-2 text-sm"
                />
                <span>photos</span>
              </div>
            </div>

            {/* Cake Type */}
            <div>
              <label className="block text-sm font-medium">Cake Style</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["pastry", "normal", "step"] as CakeTypeOption[]).map(
                  (opt) => (
                    <button
                      key={opt}
                      onClick={() => setCakeType(opt)}
                      className={`px-3 py-2 rounded-md text-sm border ${
                        cakeType === opt
                          ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                          : "bg-white text-foreground border-[var(--muted)] hover:bg-[var(--muted)]/50"
                      }`}
                      aria-pressed={cakeType === opt}
                    >
                      {opt === "step"
                        ? "Step Cake"
                        : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  )
                )}
              </div>
              {isStepCake && (
                <p className="mt-2 text-xs text-[var(--primary-600)]">
                  Minimum total weight {minWeightForStep}kg. Adjust weight if
                  needed.
                </p>
              )}
            </div>

            {/* Shape */}
            <div>
              <label className="block text-sm font-medium">Cake Shape</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["circle", "square", "heart"] as ShapeOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setShape(opt)}
                    className={`px-3 py-2 rounded-md text-sm border ${
                      shape === opt
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-white text-foreground border-[var(--muted)] hover:bg-[var(--muted)]/50"
                    }`}
                    aria-pressed={shape === opt}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Text on Cake */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Text on Cake</label>
              <input
                type="text"
                placeholder="Happy Birthday..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 w-full rounded-md border border-[var(--muted)] bg-white px-3 py-2 text-sm"
                maxLength={40}
              />
              <p className="mt-1 text-xs text-foreground/60">
                Max 40 characters
              </p>
            </div>

            {/* Upload reference */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">
                Design reference (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-sm"
                onChange={onFileChange}
              />
              {referenceImage && (
                <div className="mt-3">
                  <img
                    src={referenceImage}
                    alt="Design reference"
                    className="max-h-40 rounded-md border border-[var(--muted)]"
                  />
                </div>
              )}
            </div>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Your Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="mt-2 w-full rounded-md border border-[var(--muted)] bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Phone Number
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone"
                  className="mt-2 w-full rounded-md border border-[var(--muted)] bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {invalidStep && (
            <div className="mt-4 rounded-md border border-[var(--primary-600)] bg-[var(--primary-50)] p-3 text-sm text-[var(--primary-600)]">
              Step cake requires at least {minWeightForStep}kg total weight.
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="px-5 py-2 rounded-full bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-600)] disabled:opacity-60"
              disabled={invalidStep || saving}
              onClick={async () => {
                if (!name.trim() || !phone.trim()) {
                  alert("Please enter your name and phone number");
                  return;
                }
                try {
                  setSaving(true);
                  let referenceImageUrl: string | null = null;
                  if (referenceImage) {
                    const up = await fetch("/api/upload", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ dataUrl: referenceImage }),
                    });
                    if (up.ok) {
                      const j = await up.json();
                      referenceImageUrl = j.url;
                    }
                  }
                  const res = await fetch("/api/cakes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
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
                      price: sellingPrice,
                      referenceImage: referenceImageUrl,
                    }),
                  });
                  if (!res.ok) throw new Error("Save failed");
                  const data = await res.json();
                  setSavedId(data.id);
                  const link = `${window.location.origin}/customise/${data.id}`;
                  const qr = await QRCode.toDataURL(link, {
                    margin: 1,
                    width: 160,
                  });
                  setQrDataUrl(qr);
                } catch {
                  alert("Could not save configuration. Please try again.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving..." : "Save & Share"}
            </button>
            <button
              className="px-5 py-2 rounded-full border border-[var(--muted)] text-sm hover:bg-[var(--muted)]/50"
              onClick={async () => {
                const canvas = document.createElement("canvas");
                const width = 800;
                const height = 1000;
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                // Background
                ctx.fillStyle = "#fff8f3";
                ctx.fillRect(0, 0, width, height);
                // Title
                ctx.fillStyle = "#2b1a12";
                ctx.font = "bold 28px Montserrat, sans-serif";
                ctx.fillText("Pastry Magics — Cake Customisation", 40, 60);
                // Details
                ctx.font = "16px Montserrat, sans-serif";
                let y = 110;
                const line = (label: string, value: string) => {
                  ctx.fillText(`${label}: ${value}`, 40, y);
                  y += 28;
                };
                line("Name", name || "-");
                line("Phone", phone || "-");
                line("Weight", `${weightKg}kg`);
                line("Icing", icing);
                line("Flavour", flavour);
                line("Type", cakeType);
                line("Shape", shape);
                if (message) line("Text", message);
                // Reference image thumbnail
                if (referenceImage) {
                  const refImg = new Image();
                  refImg.onload = () => {
                    const maxW = 260,
                      maxH = 260;
                    let w = refImg.width,
                      h = refImg.height;
                    const ratio = Math.min(maxW / w, maxH / h);
                    w *= ratio;
                    h *= ratio;
                    ctx.drawImage(refImg, 40, 340, w, h);
                  };
                  refImg.src = referenceImage;
                }
                // QR code
                if (qrDataUrl) {
                  const qr = new Image();
                  qr.onload = () => {
                    ctx.drawImage(qr, width - 260, 120, 200, 200);
                    // Footer note
                    ctx.font = "12px Montserrat, sans-serif";
                    ctx.fillText(
                      "Scan to view this customisation",
                      width - 260,
                      340
                    );
                    canvas.toBlob((blob) => {
                      if (!blob) return;
                      const dl = document.createElement("a");
                      dl.href = URL.createObjectURL(blob);
                      dl.download = "pastrymagics-cake.png";
                      document.body.appendChild(dl);
                      dl.click();
                      dl.remove();
                    });
                  };
                  qr.src = qrDataUrl;
                } else {
                  canvas.toBlob((blob) => {
                    if (!blob) return;
                    const dl = document.createElement("a");
                    dl.href = URL.createObjectURL(blob);
                    dl.download = "pastrymagics-cake.png";
                    document.body.appendChild(dl);
                    dl.click();
                    dl.remove();
                  });
                }
              }}
            >
              Save Cake Image
            </button>
          </div>
        </section>
        {/* Price summary */}
        <section className="rounded-2xl border border-[var(--muted)] bg-white p-4 md:p-6">
          <h2 className="text-lg font-semibold">Price</h2>
          <p className="mt-2 text-2xl font-semibold">₹{sellingPrice}</p>
        </section>
        {/* Saved link and QR */}
        {savedId && (
          <section className="rounded-2xl border border-[var(--muted)] bg-white p-4 md:p-6">
            <h2 className="text-lg font-semibold">Saved Link</h2>
            <div className="mt-3 flex items-center gap-3">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Share QR"
                  className="h-20 w-20 rounded-md border border-[var(--muted)]"
                />
              )}
              <a
                href={`/customise/${savedId}`}
                className="text-sm text-[var(--primary)] underline"
              >
                {`${
                  typeof window !== "undefined" ? window.location.origin : ""
                }/customise/${savedId}`}
              </a>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
