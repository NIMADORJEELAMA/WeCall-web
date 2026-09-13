"use client";

import { useState, useMemo } from "react";
import { useCustomers, useDeleteCustomer } from "@/hooks/useCustomers";

import {
  Plus,
  Shield,
  User,
  Trash2,
  Edit3,
  Settings2,
  UserIcon,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/SearchBar";
import { useRouter } from "next/navigation";
// AG Grid Imports
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "@/lib/agGrid";
import Router from "next/router";
import CustomerModal from "./CustomerModal";
import { Popconfirm } from "antd";

export default function CustomerPage() {
  const router = useRouter();
  const { data: users = [], isLoading } = useCustomers();
  console.log("users", users);
  const deleteUser = useDeleteCustomer();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  console.log("selectedUser qq", selectedUser);

  const handleDelete = (id: string, name: string) => {
    // The Popconfirm already handles the confirmation UI
    deleteUser.mutate(id, {
      onSuccess: () => toast.success(`${name} removed from records`),
      onError: (err: any) => {
        const message =
          err?.response?.data?.message || "Failed to remove record";
        toast.error(message);
      },
    });
  };

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Customer",
        field: "name",
        minWidth: 200,
        flex: 1,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-3 h-full">
            <div className="relative">
              {params.data.isVip && (
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 border-2 border-white rounded-full"
                  title="VIP Customer"
                />
              )}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {params.data.name}
              </p>
            </div>
          </div>
        ),
      },

      {
        headerName: "Phone ",
        field: "phone",
        width: 220,
        cellRenderer: (params: any) => (
          <div className="flex flex-col justify-center h-full leading-tight">
            <p className="text-sm text-slate-800">{params.data.phone}</p>
          </div>
        ),
      },
      {
        headerName: "Address ",
        field: "address",
        width: 220,
        cellRenderer: (params: any) => (
          <div className="flex flex-col justify-center h-full leading-tight">
            <p className="text-sm text-slate-800">{params.data.address}</p>
          </div>
        ),
      },

      {
        headerName: "Loyalty",
        field: "loyaltyPoints",
        width: 130,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2 h-full">
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-md text-[10px] font-bold">
              {params.value || 0} PTS
            </span>
          </div>
        ),
      },
      {
        headerName: "Visits",
        field: "visitCount",
        width: 100,
        cellClass: "flex items-center",
        cellRenderer: (params: any) => (
          <span className="text-sm font-medium text-slate-700">
            {params.value} {params.value === 1 ? "visit" : "visits"}
          </span>
        ),
      },
      {
        headerName: "Total Spent",
        field: "totalSpent",
        width: 140,
        cellRenderer: (params: any) => (
          <div className="flex items-center h-full text-sm font-bold text-emerald-600">
            ₹{params.value?.toLocaleString() || 0}
          </div>
        ),
      },
      {
        headerName: "Last Visit",
        field: "updatedAt",
        width: 150,
        cellRenderer: (params: any) => (
          <div className="text-xs text-slate-500 h-full flex items-center">
            {new Date(params.value).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        ),
      },
      {
        headerName: "Actions",
        field: "id",
        width: 140,
        sortable: false,
        filter: false,
        pinned: "right",
        cellRenderer: (params: any) => (
          <div className="flex justify-center items-center gap-1 h-full">
            <button
              onClick={() =>
                router.push(`/dashboard/customer/${params.data.id}`)
              }
              className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors"
              title="View Profile"
            >
              <UserIcon size={16} />
            </button>
            <button
              onClick={() => {
                setSelectedUser(params.data);
                setIsModalOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
              title="Edit"
            >
              <Edit3 size={16} />
            </button>
            <Popconfirm
              title="Delete customer?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(params.data.id, params.data.name)}
              okButtonProps={{ danger: true }}
            >
              <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer">
                <Trash2 size={16} />
              </button>
            </Popconfirm>
          </div>
        ),
      },
    ],
    [router, setSelectedUser, setIsModalOpen, handleDelete],
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    [],
  );

  return (
    <div className="space-y-6 p-6 bg-[#fcfcfd] min-h-screen">
      {/* ENTERPRISE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div></div>
        <div className="flex items-center gap-3">
          <SearchBar
            placeholder="Quick search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            variant="terminal"
            onClick={() => {
              setSelectedUser(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} />
            Add Customer
          </Button>
        </div>
      </div>

      {/* AG GRID TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="ag-theme-quartz w-full h-[600px]">
          <AgGridReact
            rowData={users}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={search}
            pagination={true}
            paginationPageSize={20}
            animateRows={true}
            rowHeight={56}
            headerHeight={48}
          />
        </div>
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingCustomer={selectedUser}
      />
    </div>
  );
}

function StatsCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color?: string;
}) {
  return (
    <div
      className={`bg-white p-4 border border-slate-200 rounded-xl ${color === "blue" ? "border-l-4 border-l-blue-500" : ""}`}
    >
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
        {title}
      </p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
