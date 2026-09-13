"use client";

import { useMemo, useState } from "react";
import { useDeletePettyCash, usePettyCash } from "@/hooks/useOperations";
import { useUsers } from "@/hooks/useUsers";
import PettyCashModal from "./PettyCashModal";
import { DatePicker, Popconfirm } from "antd";
import { Button } from "@/components/ui/button";
import { AgGridReact } from "ag-grid-react";
import { Plus, Trash2, Wallet, User, RefreshCw } from "lucide-react";
import "@/lib/agGrid";
import GenericDropdown from "../ui/GenericDropdown";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs"; // Ant Design DatePicker uses dayjs

const { RangePicker } = DatePicker;

export default function PettyCashTab() {
  const queryClient = useQueryClient();

  // Helper to get today's date in YYYY-MM-DD
  const getToday = () => new Date().toISOString().split("T")[0];
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<[string, string]>([
    getToday(),
    getToday(),
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gridApi, setGridApi] = useState<any>(null);

  const { data, isFetching } = usePettyCash(
    dateRange[0],
    dateRange[1],
    selectedUserId === "ALL" ? undefined : selectedUserId,
    selectedCategory === "ALL" ? undefined : selectedCategory,
  );

  const { data: users = [] } = useUsers();
  const deleteMutation = useDeletePettyCash();

  const handleRefresh = () => {
    // 1. Reset filters to today
    const today = new Date().toISOString().split("T")[0];
    setDateRange([today, today]);
    setSelectedUserId("ALL");

    // 2. Clear grid search and column filters (v35+ syntax)
    gridApi?.setFilterModel(null);
    gridApi?.setGridOption("quickFilterText", "");

    // 3. Refetch data
    queryClient.invalidateQueries({ queryKey: ["petty-cash"] });
  };

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      filter: true,
      floatingFilter: true,
      flex: 1,
    }),
    [],
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: "STAFF MEMBER",
        field: "user.name",
        flex: 1.5,
        filter: false,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-3 h-full">
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-slate-800 tracking-tight">
                {params.value}
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                {params.data.user?.role}
              </span>
            </div>
          </div>
        ),
      },
      {
        headerName: "DATE",
        field: "createdAt",
        sortable: true,
        filter: false,
        valueFormatter: (params: any) => {
          if (!params.value) return "";
          const d = new Date(params.value);
          return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
        },
        flex: 1,
        cellClass:
          "flex items-center text-slate-800 font-medium font-mono h-full p-2",
      },
      {
        headerName: "REASON",
        field: "reason",
        floatingFilter: true,
        filter: "agTextColumnFilter",
        filterParams: {
          filterOptions: ["contains"],
          suppressAndOrCondition: true,
        },
        flex: 2,
        cellClass:
          "flex items-center p-2 text-slate-800 transition-all outline-none h-full",
      },
      {
        headerName: "AMOUNT",
        field: "amount",
        sortable: true,
        filter: false,
        headerClass: "header-right",
        cellRenderer: (params: any) => (
          <span className="flex items-center p-2 text-slate-800 font-bold h-full">
            ₹{params.value?.toLocaleString() || 0}
          </span>
        ),
        flex: 1,
      },
      {
        headerName: "Actions",
        field: "id",
        width: 100,
        maxWidth: 100,
        suppressMenu: true,
        filter: false,
        sortable: false,
        headerClass: "flex justify-center",
        cellClass: "flex items-center justify-center",
        cellRenderer: (params: any) => (
          <Popconfirm
            title="Delete record?"
            onConfirm={() => deleteMutation.mutate(params.value)}
            okButtonProps={{ danger: true }}
          >
            <button className="flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 rounded-xl transition-all h-full cursor-pointer">
              <Trash2 size={18} />
            </button>
          </Popconfirm>
        ),
      },
    ],
    [deleteMutation],
  );

  return (
    <div className="p-2 lg:p-4 space-y-8 bg-[#f8fafc] min-h-screen font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex items-center gap-3 justify-between w-full">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Total Outflow
              </p>
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-indigo-500" />
                <span className="text-2xl font-black text-slate-900">
                  ₹{data?.totalAmount?.toLocaleString() || "0"}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant={"default"}
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 h-12 shadow-lg shadow-slate-200"
          >
            <Plus size={20} className="mr-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              New Entry
            </span>
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center justify-end gap-3 w-full">
        <div className="w-full md:w-64">
          <RangePicker
            format="DD/MM/YYYY"
            className="w-full rounded-xl border-slate-200 h-10 font-medium"
            // Ensure the picker shows today's date based on state
            value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
            onChange={(values) => {
              if (values && values[0] && values[1]) {
                setDateRange([
                  values[0].format("YYYY-MM-DD"),
                  values[1].format("YYYY-MM-DD"),
                ]);
              }
            }}
          />
        </div>

        <div className="w-full md:w-64">
          <GenericDropdown
            options={users.map((u: any) => ({ id: u.id, name: u.name }))}
            selectedValue={selectedUserId}
            onSelect={(id) => setSelectedUserId(id)}
            placeholder="Filter by Staff"
            allLabel="All Staff Members"
            icon={User}
          />
        </div>

        <GenericDropdown
          options={[
            { id: "STAFF_ADVANCE", name: "Staff Advances" },
            { id: "GENERAL_EXPENSE", name: "General Expenses" },
          ]}
          selectedValue={selectedCategory}
          onSelect={(val) => setSelectedCategory(val)}
          placeholder="Filter by Type"
          allLabel="All Types"
          icon={Wallet} // or any icon you prefer
        />

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          className={`rounded-xl border-slate-200 h-10 w-10 hover:bg-slate-50 transition-all ${isFetching ? "animate-spin" : ""}`}
        >
          <RefreshCw size={18} className="text-slate-600" />
        </Button>
      </div>

      {/* TABLE */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-[2.5rem] blur opacity-[0.05] group-hover:opacity-[0.08] transition duration-1000"></div>
        <div className="ag-theme-alpine w-full h-[600px] relative bg-white rounded-xl overflow-hidden border border-slate-100 shadow-xl">
          <AgGridReact
            rowData={data?.logs || []}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={(params) => setGridApi(params.api)}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
            rowHeight={60}
            headerHeight={50}
          />
        </div>
      </div>

      <PettyCashModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        users={users}
      />
    </div>
  );
}
