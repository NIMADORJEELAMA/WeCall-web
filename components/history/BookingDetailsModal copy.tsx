"use client";
import { X, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef } from "react";

export default function BookingReceiptModal({ booking, onClose }: any) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB");

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
  const miscCharges = grossTotal - (totalRoomCharge + foodTotal);
  const discount = Number(booking.discount) || 0;
  const grandTotal = grossTotal - discount;

  const advance = Number(booking.advanceAmount) || 0;
  const paidAtCheckout =
    (Number(booking.cashAmount) || 0) + (Number(booking.onlineAmount) || 0);

  /* ---------------- PDF DOWNLOAD ---------------- */

  const downloadPDF = async () => {
    const element = receiptRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const imgWidth = 80;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [imgWidth, imgHeight],
    });

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    pdf.save(`Receipt_${booking.id.slice(0, 8).toUpperCase()}.pdf`);
  };

  /* ---------------- PRINT RECEIPT ---------------- */

  const printReceipt = () => {
    // Generate food items rows
    const itemsHTML = foodItems
      .map(
        (item: any) => `
        <tr>
          <td class="item">${item.name}</td>
          <td class="qty">${item.qty}</td>
          <td class="price">₹${item.total}</td>
        </tr>`,
      )
      .join("");

    const html = `
<html>
<head>
  <title>Receipt_${booking.id.slice(0, 8)}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body {
      font-family: "Courier New", Courier, monospace;
      width: 72mm; /* Slightly less than 80mm to account for printer margins */
      margin: 0 auto;
      padding: 4mm 0;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
    }
    .header { text-align: center; margin-bottom: 10px; }
    .hotel { font-size: 18px; font-weight: bold; text-transform: uppercase; }
    .sub { font-size: 10px; }
    
    .sep { border-top: 1px dashed #000; margin: 8px 0; width: 100%; }
    
    /* Layout for key-value pairs */
    .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .label { font-weight: normal; }
    .value { font-weight: bold; text-align: right; }

    table { width: 100%; border-collapse: collapse; margin: 5px 0; }
    thead th { border-bottom: 1px solid #000; padding-bottom: 4px; font-size: 11px; }
    td { padding: 4px 0; font-size: 11px; vertical-align: top; }
    
    .item { text-align: left; width: 55%; }
    .qty { text-align: center; width: 15%; }
    .price { text-align: right; width: 30%; }

    .totals-container { margin-top: 5px; }
    .grand-total { 
      font-size: 15px; 
      font-weight: bold; 
      border-top: 1px solid #000; 
      margin-top: 5px; 
      padding-top: 5px;
    }
    .footer { text-align: center; font-size: 10px; margin-top: 15px; line-height: 1.2; }
  </style>
</head>
<body>

  <div class="header">
    <div class="hotel">GAIRIGAON</div>
    <div class="sub">Hill Top Resort</div>
    <div class="sub">North 24 Parganas, West Bengal</div>
  </div>

  <div class="sep"></div>

  <div class="row"><span class="label">BILL NO:</span><span class="value">#${booking.id.slice(0, 8).toUpperCase()}</span></div>
  <div class="row"><span class="label">GUEST:</span><span class="value">${booking.guestName}</span></div>
  <div class="row"><span class="label">ROOM:</span><span class="value">${booking.room?.roomNumber}</span></div>
  <div class="row">
    <span class="label">PERIOD:</span>
    <span class="value">${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}</span>
  </div>

  <div class="sep"></div>

  <table>
    <thead>
      <tr>
        <th class="item">ITEM</th>
        <th class="qty">QTY</th>
        <th class="price">AMT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="item">Room Stay (${nights}N)</td>
        <td class="qty">1</td>
        <td class="price">₹${totalRoomCharge}</td>
      </tr>
      ${itemsHTML}
      ${
        miscCharges > 0
          ? `
      <tr>
        <td class="item">Misc Charges</td>
        <td class="qty">-</td>
        <td class="price">₹${miscCharges}</td>
      </tr>`
          : ""
      }
    </tbody>
  </table>

  <div class="sep"></div>

  <div class="totals-container">
    <div class="row"><span class="label">GROSS TOTAL</span><span class="value">₹${grossTotal}</span></div>
    ${discount > 0 ? `<div class="row"><span class="label">DISCOUNT</span><span class="value">-₹${discount}</span></div>` : ""}
    <div class="row grand-total"><span>GRAND TOTAL</span><span>₹${grandTotal}</span></div>
  </div>

  <div class="sep"></div>

  <div class="payment-details">
    ${advance > 0 ? `<div class="row"><span class="label">ADVANCE PAID</span><span class="value">₹${advance}</span></div>` : ""}
    ${booking.cashAmount > 0 ? `<div class="row"><span class="label">CASH PAYMENT</span><span class="value">₹${booking.cashAmount}</span></div>` : ""}
    ${booking.onlineAmount > 0 ? `<div class="row"><span class="label">UPI PAYMENT</span><span class="value">₹${booking.onlineAmount}</span></div>` : ""}
  </div>

  <div class="footer">
    <div style="text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Status: ${booking.paymentStatus}</div>
    <div>Thank You for staying at Gairigaon!</div>
    <div style="font-style: italic; font-size: 8px; margin-top: 5px;">Computer Generated Receipt</div>
  </div>

</body>
</html>
`;

    const win = window.open("", "_blank", "width=450,height=600");
    if (!win) return;
    win.document.write(html);
    win.document.close();

    // Small delay to ensure styles and fonts are loaded before print dialog
    setTimeout(() => {
      win.print();
      // Note: win.close() is often blocked or happens too fast;
      // it's usually safer to let the user close the tab or use a longer timeout.
    }, 800);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="absolute top-6 right-6 flex gap-3">
        <Button size="icon" onClick={printReceipt}>
          <Printer size={18} />
        </Button>

        <Button size="icon" onClick={downloadPDF}>
          <Download size={18} />
        </Button>

        <Button size="icon" variant="destructive" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>

      <div className="max-h-[90vh] overflow-y-auto shadow-2xl">
        <div
          ref={receiptRef}
          className="bg-white p-6 w-[80mm] text-black font-mono"
        >
          <div className="text-center font-bold text-xl">🏔 GAIRIGAON</div>

          <div className="text-center text-xs">Hill Top Resort</div>
        </div>
      </div>
    </div>
  );
}
