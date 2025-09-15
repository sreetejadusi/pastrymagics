"use client";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type Order = {
  id: string;
  orderNumber: string;
  name: string;
  phone: string;
  tableNumber?: string;
  items: OrderItem[];
  status: "placed" | "preparing" | "ready" | "completed" | "cancelled";
  total: number;
  createdAt: string;
  payment: "pay-at-counter";
};

type Props = {
  order: Order;
  cancellable: boolean;
};

export default function OrderActions({ order, cancellable }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="px-4 py-2 rounded-full bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-600)]"
        onClick={() => {
          if (typeof window === "undefined") return;
          navigator.share?.({
            title: "Pastry Magics Order",
            url: window.location.href,
          });
        }}
      >
        Share
      </button>
      <button
        className="px-4 py-2 rounded-full border border-[var(--muted)] text-sm hover:bg-[var(--muted)]/50"
        onClick={async () => {
          const { jsPDF } = await import("jspdf");
          const doc = new jsPDF({ unit: "pt", format: "a4" });
          const margin = 28;
          let y = margin;

          // Logo
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("noctx");
                const targetW = 140;
                const ratio = targetW / img.width;
                const targetH = img.height * ratio;
                canvas.width = targetW;
                canvas.height = targetH;
                ctx.drawImage(img, 0, 0, targetW, targetH);
                const dataUrl = canvas.toDataURL("image/png");
                doc.addImage(dataUrl, "PNG", margin, y, targetW, targetH);
              } catch {}
            };
            img.src = "/logo.png";
          } catch {}

          // Brand details
          doc.setFontSize(11);
          doc.text("Pastry Magics", 400, y + 8);
          doc.setFontSize(9);
          doc.text("123 Baker Street, Sweet City", 400, y + 22);
          doc.text("+91-00000 00000", 400, y + 34);
          y += 60;

          // Title/meta
          doc.setFontSize(14);
          doc.text(`Invoice #${order.orderNumber}`, margin, y);
          y += 18;
          doc.setFontSize(10);
          doc.text(
            `Placed: ${new Date(order.createdAt).toLocaleString()}`,
            margin,
            y
          );
          y += 18;
          doc.text(`Name: ${order.name}`, margin, y);
          y += 14;
          doc.text(`Phone: ${order.phone}`, margin, y);
          y += 14;
          if (order.tableNumber) {
            doc.text(`Table: ${order.tableNumber}`, margin, y);
            y += 14;
          }

          // Items
          y += 10;
          doc.setFontSize(11);
          doc.text(`Items`, margin, y);
          y += 12;
          doc.setFontSize(10);
          order.items.forEach((it) => {
            doc.text(`${it.name} x ${it.qty}`, margin, y);
            doc.text(`₹${it.price * it.qty}`, 570, y, { align: "right" });
            y += 14;
          });
          y += 6;
          doc.line(margin, y, 570, y);
          y += 16;
          doc.setFontSize(12);
          doc.text(`Total: ₹${order.total}`, 570, y, { align: "right" });

          doc.save(`invoice-${order.orderNumber}.pdf`);
        }}
      >
        Download Invoice (PDF)
      </button>
      <button
        disabled={!cancellable}
        className="px-4 py-2 rounded-full border border-[var(--muted)] text-sm hover:bg-[var(--muted)]/50 disabled:opacity-50"
        onClick={async () => {
          if (!cancellable) return;
          await fetch(`/api/orders/cancel?id=${order.id}`, {
            method: "POST",
          });
          if (typeof window !== "undefined") window.location.reload();
        }}
      >
        Cancel Order
      </button>
    </div>
  );
}
