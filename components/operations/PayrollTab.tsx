"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import * as qz from "qz-tray";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Printer, Download, X, IndianRupee, Zap } from "lucide-react";
import { DatePicker, ConfigProvider, Modal, Button } from "antd";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";

// AG Grid
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "@/lib/agGrid";

export default function PayrollTab() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [isQzConnected, setIsQzConnected] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);

  // Initialize QZ Tray
  useEffect(() => {
    const connect = async () => {
      try {
        if (!qz.websocket.isActive()) {
          await qz.websocket.connect();
          setIsQzConnected(true);
        }
      } catch (err) {
        console.warn("QZ Tray not detected");
      }
    };
    connect();
  }, []);

  const { data: payroll = [], isLoading } = useQuery({
    queryKey: ["payroll", currentDate.year(), currentDate.month() + 1],
    queryFn: async () => {
      const { data } = await api.get(`/operations/payroll`, {
        params: { year: currentDate.year(), month: currentDate.month() + 1 },
      });
      return data;
    },
  });

  // Action: Standard Print / PDF
  const handlePdfPrint = useReactToPrint({
    contentRef: pdfRef,
    documentTitle: `Salary_Slip_${selectedPayroll?.name}`,
  });

  // Action: Thermal Print
  const handleThermalPrint = async () => {
    if (!selectedPayroll) return;
    try {
      if (!qz.websocket.isActive()) await qz.websocket.connect();
      const config = qz.configs.create("Thermal"); // Ensure this matches your printer name
      const printData = [
        {
          type: "html",
          format: "plain",
          data: thermalTemplate(selectedPayroll, currentDate),
        },
      ];
      await qz.print(config, printData);
      toast.success("Thermal receipt sent!");
    } catch (err: any) {
      toast.error("Thermal Error: " + err.message);
    }
  };
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Employee",
        field: "name",
        flex: 2,
        cellRenderer: (p: any) => (
          <div className="flex flex-col justify-center h-full leading-tight">
            <span className="font-bold text-slate-900 uppercase text-[11px]">
              {p.data.name}
            </span>
            <span className="text-[10px] text-slate-400 font-medium uppercase">
              {p.data.role}
            </span>
          </div>
        ),
      },

      { headerName: "Attendance", field: "presentDays", width: 110 },
      {
        headerName: "Daily Rate",
        field: "dailyRate",
        width: 130,
        cellClass: "text-emerald-600 font-bold",
        valueFormatter: (p) => `₹${p.value.toLocaleString()}`,
      },
      {
        headerName: "Gross Pay",
        field: "grossPay",
        width: 130,
        cellClass: "text-emerald-600 font-bold",
        valueFormatter: (p) => `₹${p.value.toLocaleString()}`,
      },
      {
        headerName: "Advance",
        field: "totalAdvances",
        width: 130,
        cellClass: "text-emerald-600 font-bold",
        valueFormatter: (p) => `₹${p.value.toLocaleString()}`,
      },
      {
        headerName: "Net Payout",
        field: "netPay",
        width: 130,
        cellClass: "text-emerald-600 font-bold",
        valueFormatter: (p) => `₹${p.value.toLocaleString()}`,
      },
      {
        headerName: "Action",
        width: 100,
        pinned: "right",
        cellRenderer: (p: any) => (
          <div className="flex items-center justify-center h-full">
            <button
              onClick={() => {
                setSelectedPayroll(p.data);
                setIsModalOpen(true);
              }}
              className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
            >
              <Printer size={18} />
            </button>
          </div>
        ),
      },
    ],
    [currentDate, isQzConnected],
  );

  return (
    <div className="space-y-6 p-6 bg-[#fcfcfd] min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Payroll Dashboard</h1>
        <DatePicker
          picker="month"
          value={currentDate}
          onChange={(d) => d && setCurrentDate(d)}
          allowClear={false}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="ag-theme-quartz w-full h-[550px]">
          <AgGridReact
            rowData={payroll}
            columnDefs={columnDefs}
            rowHeight={56}
            loading={isLoading}
            pagination
            paginationPageSize={20}
          />
        </div>
      </div>

      {/* --- RECEIPT MODAL --- */}
      <Modal
        title={null}
        footer={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={500}
        centered
      >
        <div className="p-2">
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <IndianRupee size={20} className="text-emerald-600" />
              Payment Receipt
            </h2>
          </div>

          {/* This is the part that gets printed as PDF */}
          <div
            ref={pdfRef}
            className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-6"
          >
            <div className="text-center mb-6">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Salary Slip
              </p>
              <h3 className="text-lg font-bold uppercase">
                {selectedPayroll?.name}
              </h3>
              <p className="text-xs text-slate-500">
                {currentDate.format("MMMM YYYY")}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <span className="text-slate-500">Days Present</span>
                <span className="font-bold">
                  {selectedPayroll?.presentDays}
                </span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <span className="text-slate-500">Daily Rate</span>
                <span className="font-bold">₹{selectedPayroll?.dailyRate}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Gross Salary</span>
                <span className="font-bold">
                  ₹{selectedPayroll?.grossPay.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Staff Advances</span>
                <span className="font-bold">
                  - ₹{selectedPayroll?.totalAdvances.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-4 mt-2 border-t-2 border-slate-900 font-black text-lg">
                <span>Net Payout</span>
                <span className="text-emerald-600">
                  ₹{selectedPayroll?.netPay.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              block
              icon={<Download size={16} />}
              onClick={() => handlePdfPrint()}
              className="h-10 font-bold border-slate-200 shadow-sm"
            >
              Print / PDF
            </Button>
            <Button
              block
              type="primary"
              icon={<Zap size={16} />}
              onClick={handleThermalPrint}
              className="h-10 font-bold bg-orange-600 hover:bg-orange-700 border-none shadow-orange-200"
            >
              Thermal Print
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Thermal Template String
const thermalTemplate = (data: any, date: any) => `
  <div style="width: 260px; font-family: 'Courier New', monospace; font-size: 12px; color: #000;">
    <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px;">
      <h3 style="margin: 0;">SALARY SLIP</h3>
      <p style="margin: 0; font-size: 10px;">${date.format("MMMM YYYY")}</p>
    </div>
    <div style="margin-bottom: 10px;">
      <b>${data.name.toUpperCase()}</b><br/>
      ${data.role}
    </div>
    <div style="display: flex; justify-content: space-between;"><span>Rate/Day:</span> <span>₹${data.dailyRate}</span></div>
    <div style="display: flex; justify-content: space-between;"><span>Days:</span> <span>${data.presentDays}</span></div>
    <div style="border-top: 1px solid #000; margin: 5px 0;"></div>
    <div style="display: flex; justify-content: space-between;"><span>Gross:</span> <span>₹${data.grossPay}</span></div>
    <div style="display: flex; justify-content: space-between;"><span>Advance:</span> <span>-₹${data.totalAdvances}</span></div>
    <div style="border-top: 2px solid #000; margin-top: 5px; padding-top: 5px; font-weight: bold; font-size: 14px;">
      <div style="display: flex; justify-content: space-between;"><span>NET:</span> <span>₹${data.netPay}</span></div>
    </div>
  </div>
`;
