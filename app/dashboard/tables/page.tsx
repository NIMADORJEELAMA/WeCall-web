"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  Search,
  DoorOpen,
  Coffee,
  X,
  Edit3,
  AlertTriangle,
  Tag,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CategoryManager from "@/components/Tables/CategoryManager";
import { div, span } from "framer-motion/client";
import CategoryDropdown from "@/components/Tables/CategoryDropdown";
import TableModal from "@/components/Tables/TableModal";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/button";

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL"); // For filtering view

  const [modalType, setModalType] = useState<"add" | "edit" | "delete" | null>(
    null,
  );
  const [activeTable, setActiveTable] = useState<any>(null);
  const [formData, setFormData] = useState({
    number: "",
    roomId: "",
    categoryId: "",
    isActive: true,
  });

  const fetchData = useCallback(async () => {
    try {
      const [tablesRes, categoriesRes] = await Promise.all([
        api.get("/tables"),
        api.get("/tables/categories"),
      ]);
      setTables(tablesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, []);
  const onRefreshCategories = async () => {
    try {
      const res = await api.get("/tables/categories");
      // Explicitly update the categories state
      setCategories(res.data);
    } catch (err) {
      console.error("Refresh failed", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onCategoryCreated = (newCat: any) => {
    setCategories((prev) => [...prev, newCat]);
    setFormData((prev) => ({ ...prev, categoryId: newCat.id }));
  };

  const openDeleteModal = (table: any) => {
    setActiveTable(table);
    setModalType("delete");
  };

  const openEditModal = (table: any) => {
    setActiveTable(table);
    setFormData({
      number: table.number,
      roomId: table.roomId || "",
      categoryId: table.categoryId || "",
      isActive: table.status !== "INACTIVE",
    });
    setModalType("edit");
  };

  const handleModalConfirm = async (formData: any) => {
    try {
      if (modalType === "add") {
        await api.post("/tables", {
          number: formData.number,
          categoryId: formData.categoryId || null,
        });
        toast.success("Table created");
      } else if (modalType === "edit") {
        await api.patch(`/tables/${activeTable.id}`, {
          number: formData.number,
          categoryId: formData.categoryId || null,
          isActive: formData.isActive,
        });
        toast.success("Table updated");
      } else if (modalType === "delete") {
        await api.delete(`/tables/${activeTable.id}`);
        toast.success("Table removed");
      }
      fetchData();
      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Action failed");
      throw err; // Allow modal to handle loading state
    }
  };
  // const handleModalConfirm = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsAdding(true);
  //   try {
  //     const payload = {
  //       number: formData.number,
  //       roomId: formData.roomId || null,
  //       categoryId: formData.categoryId || null,
  //     };

  //     if (modalType === "add") {
  //       await api.post("/tables", payload);
  //       toast.success("Table created");
  //     } else if (modalType === "edit") {
  //       await api.patch(`/tables/${activeTable.id}`, {
  //         ...payload,
  //         isActive: formData.isActive,
  //       });
  //       toast.success("Table updated");
  //     } else if (modalType === "delete") {
  //       await api.delete(`/tables/${activeTable.id}`);
  //       toast.success("Table removed");
  //     }
  //     fetchData();
  //     closeModal();
  //   } catch (err: any) {
  //     toast.error(err.response?.data?.message || "Action failed");
  //   } finally {
  //     setIsAdding(false);
  //   }
  // };

  const closeModal = () => {
    setModalType(null);
    setActiveTable(null);
    setFormData({ number: "", roomId: "", categoryId: "", isActive: true });
  };

  // --- FILTER LOGIC ---
  const displayedTables = tables.filter((t: any) => {
    const matchesSearch = t.number.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || t.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderTableCard = (table: any) => (
    <div
      key={table.id}
      className="group relative bg-white p-4 rounded-[1rem] border-2 border-slate-200 hover:border-blue-200 transition-all hover:shadow-xl"
    >
      <div>
        <div className="flex  items-center gap-2">
          {/* ICON CONTAINER */}
          <div
            className={`w-8 h-8 rounded-2xl flex items-center justify-center transition-all duration-300 bg-slate-100 `}
          >
            {table.roomId ? <DoorOpen size={18} /> : <Coffee size={18} />}
          </div>

          {/* STYLED TABLE NUMBER */}
          <h2 className="text-[16px] font-black text-slate-800 tracking-tighter tabular-nums group-hover:text-blue-600 transition-colors duration-200">
            {table.number}
          </h2>
        </div>

        {/* <h5>
          {table.category ? (
            <span className="mb-2 text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
              {table.category.name}
            </span>
          ) : (
            <span className="mb-2 text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
              No Category
            </span>
          )}
        </h5> */}
        <div className="flex justify-center py-4">
          <div className="flex flex-col items-center">
            {table.category ? (
              <span
                className="  text-[8px] font-bold px-2 py-0.5 rounded-md  bg-white border uppercase tracking-wider shadow-sm flex items-center gap-1.5"
                style={{
                  borderColor: `${table.category.color}40`, // 40 adds 25% opacity to the hex border
                  color: table.category.color,
                  borderLeft: `3px solid ${table.category.color}`, // Accent line
                }}
              >
                {table.category.name}
              </span>
            ) : (
              <span className="  text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-100 uppercase tracking-wider">
                No Category
              </span>
            )}
          </div>
        </div>
        <div>
          <div>
            {" "}
            <span
              className={`mt-2 text-[10px] font-black px-3 py-1 rounded-full ${table.status === "FREE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
            >
              {table.status}
            </span>
          </div>
          <div className="absolute bottom-4 right-4 flex gap-1   transition-all z-10">
            <button
              onClick={() => openEditModal(table)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full cursor-pointer"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => openDeleteModal(table)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTableCar = (table: any) => (
    <motion.div
      layout
      key={table.id}
      className="group relative bg-white p-6 rounded-[2rem] border-2 border-slate-50 hover:border-blue-200 transition-all hover:shadow-xl"
    >
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
        <button
          onClick={() => openEditModal(table)}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
        >
          <Edit3 size={16} />
        </button>
        <button
          onClick={() => openDeleteModal(table)}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex flex-col items-center">
        {table.category && (
          <span className="mb-2 text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
            {table.category.name}
          </span>
        )}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${table.status === "FREE" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
        >
          {table.roomId ? <DoorOpen size={24} /> : <Coffee size={24} />}
        </div>
        <h3 className="text-lg font-bold text-slate-800">{table.number}</h3>
        <span
          className={`mt-2 text-[10px] font-black px-3 py-1 rounded-full ${table.status === "FREE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
        >
          {table.status}
        </span>
      </div>
    </motion.div>
  );

  return (
    <div className="   flex">
      <div className=" w-[80%] mx-auto p-12 ">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 w-full">
            {/* LEFT SIDE: SEARCH BOX */}
            <div className="flex items-center gap-3">
              <CategoryDropdown
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            </div>
            <div className="relative   flex">
              <SearchBar
                placeholder="Search tables..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {/* SEPARATOR */}
              <div className="h-12 w-px bg-slate-200 mx-2 hidden md:block" />

              {/* NEW TABLE BUTTON */}

              <Button variant="default" onClick={() => setModalType("add")}>
                <Plus />
                Add Table
              </Button>
            </div>
            {/* RIGHT SIDE: FILTER & ACTION GROUP */}
          </div>
        </header>

        {/* TABLES GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 max-h-[70vh] overflow-y-auto no-scrollbar ">
          <AnimatePresence mode="popLayout">
            {displayedTables.map(renderTableCard)}
          </AnimatePresence>
        </div>

        {/* MODAL SYSTEM */}
        <TableModal
          isOpen={!!modalType}
          type={modalType}
          activeTable={activeTable}
          categories={categories}
          onClose={closeModal}
          onConfirm={handleModalConfirm}
          onCategoryCreated={onCategoryCreated}
        />
      </div>

      <CategoryManager
        categories={categories}
        onCategoryCreated={onCategoryCreated}
        onRefreshCategories={onRefreshCategories}
      />
    </div>
  );
}
