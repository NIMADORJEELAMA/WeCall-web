"use client";
import { X, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import { useRef } from "react";
import { toPng } from "html-to-image";
import toast from "react-hot-toast";

export default function BookingReceiptModal({ booking, onClose }: any) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const checkCash = Number(booking.checkoutCash) || 0;
  const checkOnline = Number(booking.checkoutOnline) || 0;
  const netPayable = checkCash + checkOnline;

  // 2. Advance splits (Total - Checkout = Advance)
  // This works because cashAmount and onlineAmount are incremented lifetime totals
  const advCash = Math.max(0, (Number(booking.cashAmount) || 0) - checkCash);
  const advOnline = Math.max(
    0,
    (Number(booking.onlineAmount) || 0) - checkOnline,
  );
  const advanceAmt = advCash + advOnline;

  const advanceMode = booking.advancePaymentMode; // e.g., "SPLIT", "CASH", "ONLINE"
  const checkoutMode = booking.checkoutPaymentMode;
  // --- Advanced Payment Logic ---

  const totalCash = Number(booking.cashAmount) || 0;
  const totalOnline = Number(booking.onlineAmount) || 0;

  // Determine Checkout Split (Net Payable remaining)
  const checkoutCash = totalCash - advCash;
  const checkoutOnline = totalOnline - advOnline;
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB");

  // --- Logic Constants ---
  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  const nights = Math.max(
    1,
    Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)),
  );
  const roomRate = Number(booking.room?.basePrice) || 0;
  const totalRoomCharge = nights * roomRate;

  const foodItems =
    booking.orders?.flatMap((order: any) =>
      order.items.map((item: any) => ({
        name: item.menuItem.name,
        qty: item.quantity,
        rate: item.priceAtOrder,
        total: item.quantity * item.priceAtOrder,
      })),
    ) || [];

  const foodTotal = foodItems.reduce((a: number, b: any) => a + b.total, 0);
  const grossTotal = Number(booking.totalBill) || 0;
  const miscCharges = Number(booking.miscCharges) || 0;
  const discount = Number(booking.discount) || 0;
  const grandTotal = grossTotal - discount;
  const advance = Number(booking.advanceAmount) || 0;

  /* ================= PDF DOWNLOAD LOGIC ================= */
  const downloadPDF = async () => {
    const element = receiptRef.current;
    if (!element) return;

    try {
      const dataUrl = await toPng(element, { quality: 1.0, pixelRatio: 3 });
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 180], // Standard thermal width, adjusted height
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, 80, 180);
      pdf.save(`Receipt_${booking.guestName.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF Downloaded");
    } catch (err) {
      console.error("PDF Generation failed", err);
      toast.error("Failed to generate PDF");
    }
  };

  /* ================= QZ TRAY PRINT LOGIC ================= */
  const printThermalESC = async () => {
    try {
      if (typeof window === "undefined" || !window.qz) {
        alert("QZ Tray is not running.");
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

      const formatRow = (
        name: string,
        qty: string,
        rate: string,
        amt: string,
      ) => {
        return (
          padRight(name.toUpperCase(), 22) +
          padLeft(qty, 6) +
          padLeft(rate, 10) +
          padLeft(amt, 10)
        );
      };

      let itemsText =
        formatRow(
          `Room Stay(${nights}N)`,
          "-",
          String(roomRate),
          String(totalRoomCharge),
        ) + "\n";
      foodItems.forEach((i: any) => {
        itemsText +=
          formatRow(i.name, String(i.qty), String(i.rate), String(i.total)) +
          "\n";
      });

      if (miscCharges > 0) {
        itemsText +=
          formatRow(
            "Misc Charges",
            "1",
            String(miscCharges),
            String(miscCharges),
          ) + "\n";
      }

      const receipt = [
        CENTER,
        BOLD_ON,
        "GAIRIGAON HILL ECO TOURISM\n",
        BOLD_OFF,
        "Jaigaon, West Bengal\n",
        "+91-7547957222\n",
        LEFT,
        "-".repeat(LINE_WIDTH) + "\n",
        `BILL NO : #${booking.id.slice(0, 8).toUpperCase()}\n`,
        `GUEST   : ${booking.guestName}\n`,
        `ROOM    : ${booking.room?.roomNumber}\n`,
        `PERIOD  : ${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}\n`,
        "-".repeat(LINE_WIDTH) + "\n",
        formatRow("ITEM", "QTY", "RATE", "AMT") + "\n",
        "-".repeat(LINE_WIDTH) + "\n",
        itemsText,
        "-".repeat(LINE_WIDTH) + "\n",
        padRight("GROSS TOTAL", 38) + padLeft(String(grossTotal), 10) + "\n",
        discount > 0
          ? padRight("DISCOUNT", 38) + padLeft(`-${discount}`, 10) + "\n"
          : "",
        padRight("GRAND TOTAL", 38) + padLeft(String(grandTotal), 10) + "\n",
        advance > 0
          ? padRight("ADVANCE PAID", 38) + padLeft(`-${advance}`, 10) + "\n"
          : "",
        BOLD_ON,
        padRight("NET PAYABLE", 38) + padLeft(String(netPayable), 10) + "\n",
        BOLD_OFF,
        "-".repeat(LINE_WIDTH) + "\n",
        CENTER,
        "PAYMENT BREAKDOWN\n",
        LEFT,
        booking.cashAmount > 0
          ? padRight("  CASH", 38) +
            padLeft(String(booking.cashAmount), 10) +
            "\n"
          : "",
        booking.onlineAmount > 0
          ? padRight("  UPI/ONLINE", 38) +
            padLeft(String(booking.onlineAmount), 10) +
            "\n"
          : "",
        "-".repeat(LINE_WIDTH) + "\n",
        CENTER,
        `STATUS: ${booking.paymentStatus.toUpperCase()}\n`,
        "THANK YOU FOR STAYING!\n",
        "\n\n\n\x1Bm",
      ].join("");

      const printerName = localStorage.getItem("printer") || "Thermal";
      const config = window.qz.configs.create(printerName);
      await window.qz.print(config, [
        { type: "raw", format: "plain", data: receipt },
      ]);
    } catch (err: any) {
      toast.error("Printing failed: " + (err.message || "Unknown error"));
    }
  };

  /* ================= UI RECEIPT CONTENT ================= */
  const ReceiptContent = () => (
    <div className="w-[72mm] mx-auto text-black p-1 leading-tight bg-white">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold uppercase m-0">GAIRIGAON</h2>
        <p className="text-[10px] m-0">Hill Top Eco Tourism | Jaigaon</p>
      </div>

      <div className="text-[11px] space-y-1">
        <div className="flex justify-between">
          <span>BILL NO:</span>
          <span className="font-bold">
            #{booking.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between">
          <span>GUEST:</span>
          <span className="font-bold">{booking.guestName}</span>
        </div>
        <div className="flex justify-between">
          <span>ROOM:</span>
          <span className="font-bold">{booking.room?.roomNumber}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">ITEM</th>
            <th className="text-right py-1">AMT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1">Room Stay ({nights}N)</td>
            <td className="text-right">₹{totalRoomCharge}</td>
          </tr>
          {foodItems.map((item: any, i: number) => (
            <tr key={i}>
              <td className="py-1">
                {item.name} x{item.qty}
              </td>
              <td className="text-right">₹{item.total}</td>
            </tr>
          ))}
          {miscCharges > 0 && (
            <tr>
              <td className="py-1">Misc Charges</td>
              <td className="text-right">₹{miscCharges}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black my-2" />

      <div className="text-[11px] space-y-1">
        <div className="flex justify-between">
          <span>GROSS TOTAL</span>
          <span>₹{grossTotal}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span>DISCOUNT</span>
            <span>-₹{discount}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold">
          <span>GRAND TOTAL</span>
          <span>₹{grandTotal}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>ADVANCE PAID</span>
          <span>-₹{advance}</span>
        </div>

        <div className="flex justify-between font-bold text-sm border-t-2 border-black pt-1 mt-1 bg-gray-100 p-1">
          <span>NET PAYABLE</span>
          <span>₹{netPayable}</span>
        </div>
      </div>

      <div className="text-[10px] space-y-2 border-t border-black pt-2">
        <p className="text-center font-bold underline italic">
          Detailed Payment History
        </p>

        {/* Advance Section */}
        {advanceAmt > 0 && (
          <div className="flex flex-col border-b border-dotted pb-1">
            <div className="flex justify-between font-bold">
              <span>Advance ({booking.advancePaymentMode})</span>
              <span>₹{advanceAmt}</span>
            </div>
            <div className="pl-2 text-gray-500 flex flex-col text-[9px]">
              {advCash > 0 && <span>• Cash: ₹{advCash}</span>}
              {advOnline > 0 && <span>• Online: ₹{advOnline}</span>}
            </div>
          </div>
        )}

        {/* Checkout Section */}
        <div className="flex flex-col">
          <div className="flex justify-between font-bold">
            <span>Final Payment ({booking.checkoutPaymentMode})</span>
            <span>₹{netPayable}</span>
          </div>
          <div className="pl-2 text-gray-500 flex flex-col text-[9px]">
            {checkCash > 0 && <span>• Cash: ₹{checkCash}</span>}
            {checkOnline > 0 && <span>• Online: ₹{checkOnline}</span>}
          </div>
        </div>
      </div>
      <div className="text-center mt-6 text-[10px]">
        <div className="font-bold uppercase italic">
          Status: {booking.paymentStatus}
        </div>
        <div>Thank You for staying at Gairigaon!</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="absolute top-6 right-6 flex gap-3">
        {/* ACTION BUTTONS */}
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

      <div className="bg-white p-4 shadow-2xl max-h-[90vh] overflow-y-auto font-mono">
        <div ref={receiptRef}>
          <ReceiptContent />
        </div>
      </div>
    </div>
  );
}
