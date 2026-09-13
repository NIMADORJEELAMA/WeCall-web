"use client";
import DeleteItemModal from "@/components/menu/DeleteItemModal";
import MenuItemForm from "@/components/menu/MenuItemForm";
import MenuModal from "@/components/menu/MenuModal";
import MenuTable from "@/components/menu/MenuTable";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

import { useInventoryList } from "@/hooks/useInventoryList";
import {
  useCreateMenuItem,
  useMenu,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useUploadMenuCsv,
} from "@/hooks/useMenu";
import { FileDown, Loader2, Plus, Tag, Upload, X } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import { MenuItem } from "@/app/types/menu";
import Papa from "papaparse";
import { useQueryClient } from "@tanstack/react-query";

import BulkPreviewModal from "./BulkPreviewModal";
export default function MenuPage() {
  const { data: menuItems = [], isLoading } = useMenu();
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const deleteMutation = useDeleteMenuItem();
  const uploadMutation = useUploadMenuCsv();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price: "",
    category: "",
    type: "FOOD" as "FOOD" | "DRINKS",
    inventoryItemId: "",
    isVeg: false,
    isActive: true,
    portionSize: 0,
    requiresPreparation: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  console.log("formData", formData);
  const queryClient = useQueryClient();
  const [isMenuItemFormOpen, setIsMenuItemFormOpen] = useState<boolean>(false); // Toggle for create form
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: fullInventory = [] } = useInventoryList();
  const handleMenuModel = () => {
    queryClient.invalidateQueries({ queryKey: ["all-inventory"] });

    setIsMenuItemFormOpen(!isMenuItemFormOpen);
    resetForm();
  };
  // Inside MenuPage.tsx
  // Inside MenuPage.tsx
  const uniqueCategories = useMemo(() => {
    // Add a type cast to ensure categories is treated as string[]
    const categories = menuItems.map((i: any) =>
      String(i.category),
    ) as string[];
    return Array.from(new Set(categories)).sort();
  }, [menuItems]);
  const openDelete = (item: any) => {
    setActiveItem(item);
    setIsDeleteOpen(true);
  };
  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      price: "",
      category: "",
      type: "FOOD",
      inventoryItemId: "",
      isVeg: false,
      isActive: true,
      portionSize: 0,
      requiresPreparation: true,
    });
    setSelectedItem(null); // Clear the selected item reference
  };
  const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreviewData(results.data);
        setIsPreviewOpen(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: (error) => {
        toast.error("Error parsing CSV: " + error.message);
      },
    });
  };

  const handleConfirmUpload = (finalData: any[]) => {
    // Now we use finalData instead of previewData state
    uploadMutation.mutate(finalData, {
      onSuccess: () => {
        setIsPreviewOpen(false);
        setPreviewData([]);
        toast.success("Bulk upload successful!");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Upload failed");
      },
    });
  };
  const downloadMenuTemplate = () => {
    const data = [
      [
        "Name",
        "Price",
        "Category",
        "Type (FOOD|DRINKS)",
        "IsVeg (TRUE|FALSE)",
        "requiresPreration (TRUE|FALSE)",
      ],
      ["Margherita Pizza", "12.99", "PIZZA", "FOOD", "TRUE", "TRUE"],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Column widths
    worksheet["!cols"] = [
      { wch: 30 }, // Name
      { wch: 12 }, // Price
      { wch: 20 }, // Category
      { wch: 20 }, // Type
      { wch: 18 }, // IsVeg
      { wch: 18 }, // IsVeg
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Menu Template");

    XLSX.writeFile(workbook, "menu_template.xlsx");
  };
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        ...formData,
        name: formData.name.toUpperCase().trim(),
        price: Number(formData.price),
        category: formData.category.toUpperCase().trim(),
        inventoryItemId: formData.inventoryItemId || null,
        portionSize: formData.portionSize || 1,
        requiresPreparation: formData.requiresPreparation,
      },
      {
        onSuccess: () => {
          toast.success("Menu item added");
          resetForm();
          setIsMenuItemFormOpen(false); // Optional: close form on success
        },
        onError: (error: any) => {
          // This extracts the "An item named..." message from your JSON response
          const message =
            error?.response?.data?.message || "Something went wrong";
          toast.error(message);
        },
      },
    );
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData?.id) return;

    const dataToSend = {
      ...formData,
      name: formData.name.toUpperCase().trim(),
      price: Number(formData.price),
      category: formData.category.toUpperCase().trim(),
      isActive: formData.isActive,
      portionSize: formData.portionSize ? Number(formData.portionSize) : 1,
    };

    updateMutation.mutate(
      {
        id: formData?.id,
        payload: dataToSend,
      },
      {
        onSuccess: () => {
          toast.success("Item updated successfully");
          setIsModalOpen(false);
          resetForm();
        },
        onError: (error: any) => {
          // Robust message extraction
          const responseMessage = error?.response?.data?.message;

          const errorMessage = Array.isArray(responseMessage)
            ? responseMessage.join(", ") // Joins multiple validation errors: "Name is too short, Price must be a number"
            : responseMessage ||
              error.message ||
              "An unexpected error occurred";

          toast.error(errorMessage);

          console.error("Update Error:", {
            status: error?.response?.status,
            message: errorMessage,
            fullError: error,
          });
        },
      },
    );
  };
  const handleConfirmDelete = () => {
    if (!activeItem?.id) return;

    deleteMutation.mutate(activeItem.id, {
      onSuccess: () => {
        toast.success(`${activeItem.name} has been archived`);
        setIsDeleteOpen(false); // Close the modal
        setActiveItem(null); // Clear reference
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Deletion failed");
      },
    });
  };
  const handleEditClick = (item: MenuItem) => {
    queryClient.invalidateQueries({ queryKey: ["all-inventory"] });
    setSelectedItem(item);
    setIsMenuItemFormOpen(false);
    setFormData({
      id: item.id, // Important for updates/deletes
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      type: item.type,
      isVeg: item.isVeg,
      inventoryItemId: item.inventoryItemId || "",
      isActive: item.isActive,
      portionSize: item.portionSize,
      requiresPreparation: item.requiresPreparation,
    });
    setIsModalOpen(true);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Updated validation to allow both CSV and XLSX
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const isCsv = file.name.endsWith(".csv") || file.type === "text/csv";

    if (!isExcel && !isCsv) {
      toast.error("Please upload a valid Excel or CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        // 2. Use XLSX to read the file
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // 3. Convert sheet to JSON
        const rawData = XLSX.utils.sheet_to_json(ws);

        // 4. Sanitize data (mapping Excel headers to your expected format)
        const sanitizedData = rawData.map((item: any) => ({
          ...item,
          // Match the exact header names from your downloadMenuTemplate function
          name: item["Name"],
          price: parseFloat(item["Price"]) || 0,
          category: item["Category"],
          type: item["Type (FOOD|DRINKS)"] || "FOOD",
          isVeg: String(item["IsVeg (TRUE|FALSE)"]).toUpperCase() === "TRUE",
          requiresPreparation:
            String(item["requiresPreparation (TRUE|FALSE)"]).toUpperCase() ===
            "TRUE",
        }));

        setPreviewData(sanitizedData);
        setIsPreviewOpen(true);

        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error) {
        toast.error("Error reading file: " + (error as Error).message);
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="mx-auto space-y-8 p-8 bg-white  ">
      <header className="space-y-4">
        {/* This input remains hidden but accessible via Ref */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".csv, .xlsx, .xls"
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Left Side: Create Action */}
          <div>
            <Button variant="default" onClick={handleMenuModel}>
              {isMenuItemFormOpen ? (
                <>
                  <X size={18} className="mr-2" /> Close Form
                </>
              ) : (
                <>
                  <Plus size={18} className="mr-2" /> Add New Item
                </>
              )}
            </Button>
          </div>

          {/* Right Side: CSV Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="terminalGhost"
              onClick={downloadMenuTemplate}
              className="whitespace-nowrap"
            >
              <FileDown className="mr-2" size={16} />
              Download Template
            </Button>

            <Button
              variant="terminalGhost"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="whitespace-nowrap"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                <Upload className="mr-2" size={18} />
              )}
              Bulk Upload (CSV)
            </Button>
          </div>
        </div>

        {/* Preview Modal is placed outside the layout flow */}
        <BulkPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          data={previewData}
          onConfirm={handleConfirmUpload}
          isPending={uploadMutation.isPending}
        />
      </header>

      {isMenuItemFormOpen && (
        <MenuItemForm
          formData={formData}
          categories={uniqueCategories}
          setFormData={setFormData}
          inventory={fullInventory ?? []}
          isPending={createMutation.isPending}
          onSubmit={handleCreate}
          onCancel={() => setIsMenuItemFormOpen(false)}
        />
      )}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <MenuTable
          items={menuItems}
          onEdit={handleEditClick}
          onDelete={openDelete}
        />
      )}

      {/* Keep EditMenuItemModal as is, using synced state */}
      <MenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        // onDelete={handleDelete}
        categories={uniqueCategories}
        formData={formData}
        setFormData={setFormData}
        isPending={updateMutation.isPending || deleteMutation.isPending}
        onSubmit={handleUpdate}
        inventory={fullInventory}
      />

      <DeleteItemModal
        isOpen={isDeleteOpen}
        itemName={activeItem?.name || ""}
        isPending={deleteMutation.isPending}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
