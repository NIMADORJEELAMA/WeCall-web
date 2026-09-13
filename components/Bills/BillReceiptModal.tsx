"use client";
import { X, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import { useRef } from "react";
import dayjs from "dayjs";
import { toPng } from "html-to-image";
import toast from "react-hot-toast";

interface BillReceiptModalProps {
  order: any;
  onClose: () => void;
}

declare global {
  interface window {
    qz: any;
  }
}

export default function BillReceiptModal({
  order,
  onClose,
}: BillReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  if (!order) return null;

  const isSplit = order.paymentMode === "SPLIT";
  const shortId = order.id.slice(-8).toUpperCase();

  // Helper to ensure numeric values
  const misc = Number(order.miscCharges || 0);
  const discount = Number(order.discount || 0);
  const rawItemsTotal = (order.items || [])
    .filter((i: any) => i.status === "SERVED")
    .reduce(
      (acc: number, item: any) => acc + item.priceAtOrder * item.quantity,
      0,
    );

  /* ================= PRINT LOGIC (80mm Optimized) ================= */

  const printThermalESC = async () => {
    try {
      if (typeof window === "undefined" || !window.qz) {
        alert("QZ Tray is not installed or running.");
        return;
      }

      if (!window.qz.websocket.isActive()) {
        await window.qz.websocket.connect();
      }

      const ESC = "\x1B";
      const CENTER = ESC + "a" + "\x01";
      const LEFT = ESC + "a" + "\x00";
      const BOLD_ON = ESC + "E" + "\x01";
      const BOLD_OFF = ESC + "E" + "\x00";
      const LINE_WIDTH = 48;

      const padRight = (text: string, len: number) =>
        text.length >= len
          ? text.slice(0, len)
          : text + " ".repeat(len - text.length);

      const padLeft = (text: string, len: number) =>
        text.length >= len
          ? text.slice(0, len)
          : " ".repeat(len - text.length) + text;

      const itemsText = (order.items || [])
        .filter((item: any) => item.status === "SERVED")
        .map((item: any) => {
          const name = padRight(
            (item.menuItem?.name || "Unknown").toUpperCase(),
            22,
          );
          const qty = padLeft(String(item.quantity), 6);
          const rate = padLeft(String(item.priceAtOrder), 10);
          const amt = padLeft(String(item.priceAtOrder * item.quantity), 10);
          return `${name}${qty}${rate}${amt}`;
        })
        .join("\n");

      const receipt = [
        CENTER,
        BOLD_ON,
        "GAIRIGAON HILL ECO TOURISM\n",
        BOLD_OFF,
        "Jaigaon, West Bengal\n",
        "+91-7547957222\n",
        LEFT,
        "-".repeat(LINE_WIDTH) + "\n",
        `BILL NO : #${shortId}\n`,
        `TABLE   : ${order.table?.number || "N/A"}\n`,
        `WAITER   : ${order.waiter?.name || "N/A"}\n`,
        `DATE    : ${dayjs(order.updatedAt).format("DD/MM/YYYY hh:mm A")}\n`,
        "-".repeat(LINE_WIDTH) + "\n",
        padRight("ITEM", 22) +
          padLeft("QTY", 6) +
          padLeft("RATE", 10) +
          padLeft("AMT", 10) +
          "\n",
        "-".repeat(LINE_WIDTH) + "\n",
        itemsText + "\n",
        "-".repeat(LINE_WIDTH) + "\n",
        padRight("ITEMS TOTAL", 38) + padLeft(String(rawItemsTotal), 10) + "\n",
        misc > 0
          ? padRight("MISC CHARGES (+)", 38) + padLeft(String(misc), 10) + "\n"
          : "",
        discount > 0
          ? padRight("DISCOUNT (-)", 38) + padLeft(String(discount), 10) + "\n"
          : "",
        "-".repeat(LINE_WIDTH) + "\n",
        BOLD_ON,
        padRight("GRAND TOTAL", 38) +
          padLeft("Rs." + String(order.totalAmount), 10) +
          "\n",
        BOLD_OFF,
        "-".repeat(LINE_WIDTH) + "\n",
        CENTER,
        "THANK YOU! VISIT AGAIN\n\n\n\x1Bm",
      ].join("");

      const printerName = localStorage.getItem("printer");
      if (!printerName) {
        alert("Please select a printer in settings.");
        return;
      }

      const config = window.qz.configs.create(printerName);
      await window.qz.print(config, [
        { type: "raw", format: "plain", data: receipt },
      ]);
    } catch (err: any) {
      toast.error("Printing failed: " + (err.message || "Check QZ Tray"));
    }
  };
  /* ================= PDF DOWNLOAD LOGIC ================= */
  const downloadPDF = async () => {
    const element = receiptRef.current;
    if (!element) return;

    try {
      const dataUrl = await toPng(element, { quality: 1.0, pixelRatio: 3 });
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 200], // 80mm width, height can be auto or long
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, 80, 0); // '0' for height maintains aspect ratio
      pdf.save(`Receipt_${shortId.slice(0, 4)}.pdf`);
    } catch (err) {
      console.error("PDF Generation failed", err);
    }
  };
  /* ================= UI PREVIEW ================= */
  const ReceiptContent = () => (
    <div className="w-[72mm] mx-auto text-black p-2 leading-tight text-left font-mono">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold uppercase m-0">Gairigaon Hill</h2>
        <p className="text-[12px] m-0">Eco Tourism</p>
        <p className="text-[11px] m-0">Jaigaon, West Bengal</p>
        <p className="text-[11px] m-0">+91-7547957222</p>
      </div>

      <div className="text-[12px] space-y-1">
        <div className="flex justify-between">
          <span>BILL:</span>
          <span className="font-bold">#{shortId}</span>
        </div>
        <div className="flex justify-between">
          <span>TABLE:</span>
          <span className="font-bold">{order.table?.number}</span>
        </div>
        <div className="flex justify-between">
          <span>WAITER:</span>
          <span className="font-bold">{order.waiter?.name}</span>
        </div>
        {order?.customerName && (
          <div className="flex justify-between">
            <span>CUSTOMER :</span>
            <span className="font-bold">{order?.customerName}</span>
          </div>
        )}
        {order?.customerPhone && (
          <div className="flex justify-between">
            <span>Phone Number :</span>
            <span className="font-bold">{order?.customerPhone}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>DATE:</span>
          <span>{dayjs(order.updatedAt).format("DD/MM/YYYY HH:mm")}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">ITEM</th>
            <th className="text-center py-1">QTY</th>
            <th className="text-right py-1">AMT</th>
          </tr>
        </thead>
        <tbody>
          {order.items
            ?.filter((item: any) => item.status === "SERVED")
            .map((item: any, i: number) => (
              <tr key={i}>
                <td className="py-1 uppercase text-[11px]">
                  {item.menuItem.name}
                </td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">
                  ₹{item.priceAtOrder * item.quantity}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <div className="border-t border-black pt-2 mt-2 space-y-1 text-[12px]">
        <div className="flex justify-between">
          <span>Items Total:</span>
          <span>₹{rawItemsTotal}</span>
        </div>

        {misc > 0 && (
          <div className="flex justify-between">
            <span>Misc Charges (+):</span>
            <span>₹{misc}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount (-):</span>
            <span>₹{discount}</span>
          </div>
        )}

        <div className="border-t border-dashed border-gray-400 my-1" />

        <div className="flex justify-between font-bold text-base">
          <span>GRAND TOTAL</span>
          <span>₹{order.totalAmount}</span>
        </div>

        <div className="pt-2 text-[11px]">
          <div className="flex justify-between">
            <span>MODE:</span>
            <span className="uppercase">{order.paymentMode}</span>
          </div>
          {isSplit && (
            <>
              <div className="flex justify-between text-[10px] pl-2">
                <span>- Cash:</span>
                <span>₹{order.amountCash}</span>
              </div>
              <div className="flex justify-between text-[10px] pl-2">
                <span>- Online:</span>
                <span>₹{order.amountOnline}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="text-center mt-6 text-[11px]">
        <div className="font-bold italic">Status: {order.status}</div>
        <div>Thank You! Please Visit Again.</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="absolute top-6 right-6 flex gap-3">
        <Button size="icon" onClick={printThermalESC}>
          <Printer size={18} />
        </Button>
        <Button size="icon" onClick={downloadPDF}>
          <Download size={18} />
        </Button>
        <Button size="icon" variant="destructive" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>
      <div className="bg-white p-4 shadow-2xl max-h-[90vh] overflow-y-auto rounded-sm">
        <div ref={receiptRef} className="bg-white text-black">
          <ReceiptContent />
        </div>
      </div>
    </div>
  );
}
