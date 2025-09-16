"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { jsPDF } from "jspdf";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type Order = {
  id: string;
  order_number: string;
  name: string;
  phone: string;
  table_number?: string;
  items: OrderItem[];
  status: "placed" | "preparing" | "ready" | "completed" | "cancelled";
  total: number;
  created_at: string;
  payment: "pay-at-counter";
};

type Props = {
  order: Order;
};

export default function OrderActions({ order }: Props) {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [canCancel, setCanCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (order.status === "cancelled") {
      setCanCancel(false);
      return;
    }
    const ageInSeconds =
      (Date.now() - new Date(order.created_at).getTime()) / 1000;
    const initialTimeLeft = Math.max(0, 30 - ageInSeconds);
    setTimeRemaining(initialTimeLeft);

    if (initialTimeLeft > 0) {
      setCanCancel(true);
      const timer = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setCanCancel(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [order.created_at, order.status]);

  const handleCancelOrder = async () => {
    if (!canCancel || isCancelling) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/orders/cancel?id=${order.id}`, {
        method: "POST",
      });
      if (res.ok) {
        alert("Order successfully cancelled. The page will now refresh.");
        window.location.reload(); // Refresh the page to reflect the new status
      } else {
        alert("Failed to cancel order.");
      }
    } catch {
      alert("An error occurred while trying to cancel the order.");
    } finally {
      setIsCancelling(false);
      setCanCancel(false);
    }
  };

  const downloadInvoice = async () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 30;
    let y = margin;
    const lineHeight = 18;
    const pageWidth = doc.internal.pageSize.getWidth();
    const invoiceDate = new Date(order.created_at).toLocaleDateString();

    const logo = new Image();
    logo.src = "/logo.png";
    await new Promise((resolve) => {
      logo.onload = () => resolve(true);
    });
    const logoWidth = 100;
    const logoHeight = (logo.height * logoWidth) / logo.width;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(logo, "PNG", logoX, y, logoWidth, logoHeight);
    y += logoHeight + 10;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Pastry Magics", pageWidth / 2, y, { align: "center" });
    y += 20;
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text("123 Baker Street, Sweet City", pageWidth / 2, y, {
      align: "center",
    });
    y += 10;
    doc.text("+91-00000 00000", pageWidth / 2, y, { align: "center" });
    y += 30;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text(`Invoice #${order.order_number}`, margin, y);
    doc.text(`Date: ${invoiceDate}`, pageWidth - margin, y, { align: "right" });
    y += lineHeight;
    doc.setFont("Helvetica", "normal");
    doc.text(`Customer Name: ${order.name}`, margin, y);
    doc.text(`Phone: ${order.phone}`, pageWidth - margin, y, {
      align: "right",
    });
    y += lineHeight;
    if (order.table_number) {
      doc.text(`Table Number: ${order.table_number}`, margin, y);
      y += lineHeight;
    }
    y += 20;

    doc.setFont("Helvetica", "bold");
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - 2 * margin, 20, "F");
    doc.text("Item", margin + 5, y + 14);
    doc.text("Qty", 350, y + 14, { align: "center" });
    doc.text("Price", pageWidth - margin - 5, y + 14, { align: "right" });
    y += 20;

    doc.setFont("Helvetica", "normal");
    order.items.forEach((item) => {
      doc.text(item.name, margin + 5, y + 14);
      doc.text(String(item.qty), 350, y + 14, { align: "center" });
      doc.text(
        `₹${(item.price * item.qty).toFixed(2)}`,
        pageWidth - margin - 5,
        y + 14,
        { align: "right" }
      );
      y += 20;
    });

    y += 20;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Total:", pageWidth - 100, y);
    doc.text(`₹${order.total.toFixed(2)}`, pageWidth - margin - 5, y, {
      align: "right",
    });
    y += 30;
    doc.setFontSize(10);
    doc.text("Payment Method: Pay at Counter", margin, y);
    y += 20;

    doc.setFontSize(8);
    doc.text("Thank you for your business!", pageWidth / 2, y, {
      align: "center",
    });

    doc.save(`invoice-${order.order_number}.pdf`);
  };

  // Conditional rendering based on order status
  if (order.status === "cancelled") {
    return (
      <div className="p-4 bg-red-100 border border-red-400 rounded-md text-red-700 text-sm">
        This order has been cancelled.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
          onClick={downloadInvoice}
        >
          Download Invoice (PDF)
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={!canCancel || isCancelling}
          onClick={handleCancelOrder}
          className={`relative overflow-hidden w-40 px-4 py-2 rounded-full border text-sm text-white ${
            !canCancel
              ? "bg-gray-400 border-gray-400"
              : "bg-red-500 border-red-500 hover:bg-red-600"
          }`}
        >
          <div
            className={`absolute top-0 left-0 h-full bg-red-600 transition-all duration-1000 ease-linear ${
              canCancel ? "" : "hidden"
            }`}
            style={{ width: `${(timeRemaining / 30) * 100}%` }}
          ></div>
          <span className="relative z-10">
            {isCancelling
              ? "Cancelling..."
              : `Cancel Order (${Math.ceil(timeRemaining)})`}
          </span>
        </button>
        {!canCancel && order.status !== "cancelled" && (
          <span className="text-xs text-foreground/60">
            Cancellation window expired.
          </span>
        )}
      </div>
    </div>
  );
}
