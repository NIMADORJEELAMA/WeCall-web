"use client";

import { useState, useMemo } from "react";
import { useUsers, useDeleteUser } from "@/hooks/useUsers";
import StaffModal from "@/components/staff/StaffModal";
import {
  Plus,
  Shield,
  User,
  Trash2,
  Edit3,
  Settings2,
  UserIcon,
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

export default function StaffPage() {
  const router = useRouter();
  const { data: users = [], isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [search, setSearch] = useState("");

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Confirm permanent removal of ${name}?`)) {
      deleteUser.mutate(id, {
        onSuccess: () => toast.success("Employee removed from records"),
        onError: (err: any) => {
          const message =
            err?.response?.data?.message || "Failed to remove employee";
          toast.error(message);
        },
      });
    }
  };

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Employee",
        field: "name",
        flex: 2,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-3 h-full">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 text-[10px] uppercase">
              {params.data.name.charAt(0)}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">
                {params.data.name}
              </p>
              <p className="text-[11px] text-slate-500">{params.data.email}</p>
            </div>
          </div>
        ),
      },
      {
        headerName: "Role",
        field: "role",
        width: 150,
        cellRenderer: (params: any) => (
          /* Added h-full to allow vertical centering */
          <div className="flex items-center justify-start gap-2 h-full">
            {params.value === "ADMIN" ? (
              <Shield size={14} className="text-indigo-500" />
            ) : (
              <User size={14} className="text-slate-400" />
            )}
            <span className="text-xs font-medium text-slate-700 uppercase">
              {params.value?.replace("_", " ")}
            </span>
          </div>
        ),
      },
      {
        headerName: "Status",
        field: "isActive",
        width: 130,
        cellRenderer: (params: any) => (
          <span
            className={`flex items-center justify-start gap-2 h-full  ${
              params.value ? "  text-emerald-700  " : "  text-slate-500  "
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-2xl ${params.value ? "bg-emerald-500" : "bg-slate-400"}`}
            />
            {params.value ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        headerName: "Actions",
        field: "id",
        width: 120,
        sortable: false,
        filter: false,
        pinned: "right",
        cellRenderer: (params: any) => (
          <div className="flex justify-center items-center gap-1 h-full">
            <button
              onClick={() => router.push(`/dashboard/staff/${params.data.id}`)}
              className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-md"
            >
              <UserIcon size={15} />
            </button>
            <button
              onClick={() => {
                setSelectedUser(params.data);
                setIsModalOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:  rounded-md transition-all cursor-pointer"
            >
              <Edit3 size={15} />
            </button>
            <button
              onClick={() => handleDelete(params.data.id, params.data.name)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover: rounded-md transition-all cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    [],
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
            Add Employee
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

      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingUser={selectedUser}
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
