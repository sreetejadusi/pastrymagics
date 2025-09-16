"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { jsPDF } from "jspdf";
import Link from "next/link";

// No more hardcoded types, they will be dynamic now.
type Option = { option_type: string; option_name: string; base_price: number };
type Rule = { rule_name: string; price: number };

export default function Customise() {
  const [weightKg, setWeightKg] = useState<string | null>(null);
  const [icing, setIcing] = useState<string | null>(null);
  const [flavour, setFlavour] = useState<string | null>(null);
  const [cakeType, setCakeType] = useState<string | null>(null);
  const [shape, setShape] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [withEgg, setWithEgg] = useState(true);
  const [photoCount, setPhotoCount] = useState(0);
  const [options, setOptions] = useState<Option[]>([]);
  const [extraPricing, setExtraPricing] = useState<Rule[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false); // New state for consent

  // Filter options based on type
  const weightOptions = useMemo(
    () =>
      options
        .filter((o) => o.option_type === "weight")
        .map((o) => o.option_name),
    [options]
  );
  const icingOptions = useMemo(
    () =>
      options
        .filter((o) => o.option_type === "icing")
        .map((o) => o.option_name),
    [options]
  );
  const flavourOptions = useMemo(
    () =>
      options
        .filter((o) => o.option_type === "flavor")
        .map((o) => o.option_name),
    [options]
  );
  const cakeTypeOptions = useMemo(
    () =>
      options
        .filter((o) => o.option_type === "cake_type")
        .map((o) => o.option_name),
    [options]
  );
  const shapeOptions = useMemo(
    () =>
      options
        .filter((o) => o.option_type === "shape")
        .map((o) => o.option_name),
    [options]
  );

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("cake_options")
        .select("option_type,option_name,base_price");
      if (!error && data) {
        setOptions(data);
        if (data.length > 0) {
          const initialWeight = data.find(
            (o) => o.option_type === "weight"
          )?.option_name;
          const initialIcing = data.find(
            (o) => o.option_type === "icing"
          )?.option_name;
          const initialFlavour = data.find(
            (o) => o.option_type === "flavor"
          )?.option_name;
          const initialCakeType = data.find(
            (o) => o.option_type === "cake_type"
          )?.option_name;
          const initialShape = data.find(
            (o) => o.option_type === "shape"
          )?.option_name;
          setWeightKg(initialWeight || null);
          setIcing(initialIcing || null);
          setFlavour(initialFlavour || null);
          setCakeType(initialCakeType || null);
          setShape(initialShape || null);
        }
      }

      const { data: extraData, error: extraError } = await supabase
        .from("extra_pricing_rules")
        .select("rule_name,price");
      if (!extraError && extraData) setExtraPricing(extraData);
    })();
  }, []);

  const sellingPrice = useMemo(() => {
    const getOptionPrice = (type: string, name: string | null) => {
      if (!name) return 0;
      const found = options.find(
        (o) => o.option_type === type && o.option_name === name
      );
      return found ? Number(found.base_price) : 0;
    };

    const getRulePrice = (ruleName: string) => {
      const found = extraPricing.find((r) => r.rule_name === ruleName);
      return found ? Number(found.price) : 0;
    };

    let total = 0;

    total += getOptionPrice("weight", weightKg);
    total += getOptionPrice("flavor", flavour);
    total += getOptionPrice("shape", shape);
    total += getOptionPrice("cake_type", cakeType);

    if (!withEgg) {
      total += getRulePrice("Eggless");
    }

    const numericWeight = parseFloat(weightKg || "0");
    if (icing === "Fondant") {
      if (numericWeight >= 1 && numericWeight <= 1.5) {
        total += getRulePrice("Fondant_1_1.5kg");
      } else if (numericWeight >= 2 && numericWeight <= 4) {
        total += getRulePrice("Fondant_2_4kg");
      } else if (numericWeight >= 5) {
        total += getRulePrice("Fondant_5kg_and_above");
      }
    }

    if (icing === "Semi-Fondant") {
      if (numericWeight >= 1 && numericWeight <= 1.5) {
        total += getRulePrice("Semi-Fondant_1_1.5kg");
      } else if (numericWeight >= 2 && numericWeight <= 4) {
        total += getRulePrice("Semi-Fondant_2_4kg");
      } else if (numericWeight >= 5) {
        total += getRulePrice("Semi-Fondant_5kg_and_above");
      }
    }

    if (photoCount > 0) {
      total += getRulePrice("Photo Cake") * photoCount;
    }

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

  // Add this function to your component
  const compressImage = async (
    dataUrl: string,
    maxWidth: number,
    maxHeight: number,
    quality: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
    });
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const compressedImage = await compressImage(dataUrl, 1200, 1200, 0.8); // 1200px max, 80% quality
      setReferenceImage(compressedImage);
    };
    reader.readAsDataURL(file);
  };

  const invalidStep =
    cakeType === "Step Cake / Tier Cake" && parseFloat(weightKg || "0") < 3;

  const createAndDownloadImage = async (orderId: string, qrUrl: string) => {
    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
      orientation: "portrait",
    });
    const margin = 30;
    let y = margin;
    const width = doc.internal.pageSize.getWidth();

    const logo = new Image();
    logo.src = "/logo.png";
    await new Promise((resolve) => {
      logo.onload = () => resolve(true);
    });
    const logoWidth = 100;
    const logoHeight = (logo.height * logoWidth) / logo.width;
    const logoX = width / 2 - logoWidth / 2;
    doc.addImage(logo, "PNG", logoX, y, logoWidth, logoHeight);
    y += logoHeight + 20;

    doc.setFontSize(24);
    doc.setFont("Helvetica", "bold");
    doc.text("Custom Cake Order", width / 2, y, { align: "center" });
    y += 30;

    doc.setFontSize(14);
    doc.setFont("Helvetica", "normal");
    const details = [
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Weight: ${weightKg} kg`,
      `Flavour: ${flavour}`,
      `Icing: ${icing}`,
      `Cake Style: ${cakeType}`,
      `Shape: ${shape}`,
      `Egg Status: ${withEgg ? "With Egg" : "Eggless"}`,
      `Photo Count: ${photoCount}`,
      `Message: ${message || "None"}`,
    ];
    details.forEach((line) => {
      doc.text(line, margin, y);
      y += 20;
    });
    y += 30;

    if (referenceImage) {
      const refImg = new Image();
      refImg.src = referenceImage;
      await new Promise((resolve) => {
        refImg.onload = () => resolve(true);
      });
      const maxImgWidth = width - 2 * margin;
      const maxImgHeight = 200;
      let imgWidth = refImg.width;
      let imgHeight = refImg.height;

      if (imgWidth > maxImgWidth || imgHeight > maxImgHeight) {
        const ratio = Math.min(
          maxImgWidth / imgWidth,
          maxImgHeight / imgHeight
        );
        imgWidth *= ratio;
        imgHeight *= ratio;
      }
      const imgX = width / 2 - imgWidth / 2;
      doc.addImage(refImg, "JPEG", imgX, y, imgWidth, imgHeight);
      y += imgHeight + 20;
    }

    const qrSize = 200;
    const qrX = width / 2 - qrSize / 2;
    doc.addImage(qrUrl, "PNG", qrX, y, qrSize, qrSize);
    y += qrSize + 20;

    doc.setFontSize(12);
    doc.text("Scan to view this customisation", width / 2, y, {
      align: "center",
    });

    doc.save(`PastryMagiccs_Cake_${orderId}.pdf`);
  };

  return (
    <main className="px-4 py-6 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl text-center">Customise Your Cake</h1>
      <p className="text-center mt-2 text-foreground/70">
        Pick options below and watch your cake come to life.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8">
        {/* Controls */}
        <section className="rounded-2xl border border-[var(--muted)] bg-white p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Weight */}
            <div>
              <label className="block text-sm font-medium">Weight</label>
              <div className="mt-2 flex flex-wrap gap-2">
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
                {icingOptions.map((opt) => (
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
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Flavour */}
            <div>
              <label className="block text-sm font-medium">Flavour</label>
              <select
                className="mt-2 w-full rounded-md border border-[var(--muted)] bg-white px-3 py-2 text-sm"
                value={flavour || ""}
                onChange={(e) => setFlavour(e.target.value)}
              >
                {flavourOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Egg/Eggless */}
            <div>
              <label className="block text-sm font-medium">Egg Status</label>
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

            {/* Cake Type */}
            <div>
              <label className="block text-sm font-medium">Cake Style</label>
              <select
                className="mt-2 w-full rounded-md border border-[var(--muted)] bg-white px-3 py-2 text-sm"
                value={cakeType || ""}
                onChange={(e) => setCakeType(e.target.value)}
              >
                {cakeTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {cakeType === "Step Cake / Tier Cake" && (
                <p className="mt-2 text-xs text-[var(--primary-600)]">
                  Minimum total weight 3kg. Adjust weight if needed.
                </p>
              )}
            </div>

            {/* Shape */}
            <div>
              <label className="block text-sm font-medium">Cake Shape</label>
              <select
                className="mt-2 w-full rounded-md border border-[var(--muted)] bg-white px-3 py-2 text-sm"
                value={shape || ""}
                onChange={(e) => setShape(e.target.value)}
              >
                {shapeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Photo Cake */}
            <div>
              <label className="block text-sm font-medium">Photo Count</label>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => setPhotoCount((prev) => Math.max(0, prev - 1))}
                  className="w-8 h-8 rounded-md border border-[var(--muted)] hover:bg-[var(--muted)]/50"
                >
                  -
                </button>
                <span className="text-xl font-semibold w-8 text-center">
                  {photoCount}
                </span>
                <button
                  onClick={() => setPhotoCount((prev) => prev + 1)}
                  className="w-8 h-8 rounded-md border border-[var(--muted)] hover:bg-[var(--muted)]/50"
                >
                  +
                </button>
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
              <label className="mt-2 block w-full rounded-md border border-[var(--muted)] bg-white text-sm cursor-pointer hover:bg-[var(--muted)]/50">
                <span className="px-3 py-2 block">Choose File</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
              </label>
              {referenceImage && (
                <div className="mt-3">
                  <img
                    src={referenceImage ?? undefined}
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
                  type="tel"
                  placeholder="Phone (10 digits)"
                  pattern="[0-9]{10}"
                  className="mt-2 w-full rounded-md border border-[var(--muted)] bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* New consent checkbox */}
          <div className="mt-6 flex items-center gap-2">
            <input
              type="checkbox"
              id="consent-checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <label
              htmlFor="consent-checkbox"
              className="text-sm text-foreground/70"
            >
              I agree to save my name and phone number for order tracking and a
              better experience.
            </label>
          </div>

          {invalidStep && (
            <div className="mt-4 rounded-md border border-[var(--primary-600)] bg-[var(--primary-50)] p-3 text-sm text-[var(--primary-600)]">
              Step cake requires at least 3kg total weight.
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="px-5 py-2 rounded-full bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-600)] disabled:opacity-60"
              disabled={invalidStep || saving}
              onClick={async () => {
                if (!name.trim() || !phone.trim() || !/^\d{10}$/.test(phone)) {
                  alert("Please enter a valid name and 10-digit phone number");
                  return;
                }
                if (!consentChecked) {
                  alert("Please agree to the data storage consent.");
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
                      price: sellingPrice,
                      referenceImage: referenceImageUrl,
                      weightKg,
                      icing,
                      flavour,
                      cakeType,
                      shape,
                      message,
                      withEgg,
                      photoCount,
                    }),
                  });
                  if (!res.ok) throw new Error("Save failed");
                  const data = await res.json();
                  const orderId = data.id;
                  setSavedId(orderId);
                  const link = `${window.location.origin}/customise/${orderId}`;
                  const qr = await QRCode.toDataURL(link, {
                    margin: 1,
                    width: 160,
                  });
                  setQrDataUrl(qr);

                  // Trigger automatic image download
                  createAndDownloadImage(orderId, qr);

                  // Open the dialog
                  setShowDialog(true);
                } catch {
                  alert("Could not save configuration. Please try again.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving..." : "Save & Share"}
            </button>
          </div>
        </section>
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xl bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
            <h2 className="text-xl font-semibold mb-4">
              Your Custom Cake is Saved!
            </h2>
            <p className="text-foreground/70 mb-4">
              Your cake details have been saved. A PDF has been downloaded
              automatically. You can also scan the QR code below to share the
              link.
            </p>
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="mx-auto my-4 w-48 h-48 rounded-md"
              />
            )}
            <Link
              href={`/customise/${savedId}`}
              className="text-sm text-[var(--primary)] underline block mt-2"
            >
              View your customisation link
            </Link>
            <button
              onClick={() => setShowDialog(false)}
              className="mt-6 px-5 py-2 rounded-full bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-600)]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
