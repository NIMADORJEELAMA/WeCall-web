"use client";

import PrinterSelector from "@/components/PrinterSelector";

export default function PrinterPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Printer Settings</h1>
      <PrinterSelector />
    </div>
  );
}
