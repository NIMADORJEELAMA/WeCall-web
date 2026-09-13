import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Table as TableIcon, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function BulkPreviewModal({
  isOpen,
  onClose,
  data,
  onConfirm,
  isPending,
}: any) {
  // Local state to track edits before final submission
  const [localData, setLocalData] = useState<any[]>([]);

  // Sync local state when the modal opens with new data
  useEffect(() => {
    if (isOpen) setLocalData(data);
  }, [isOpen, data]);

  const handleInputChange = (
    index: number,
    field: string,
    value: string | boolean,
  ) => {
    const updated = [...localData];
    updated[index] = { ...updated[index], [field]: value };
    setLocalData(updated);
  };

  const removeRow = (index: number) => {
    setLocalData(localData.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TableIcon size={20} />
            Edit & Verify Items ({localData.length})
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            You can edit the fields directly in the table below before
            uploading.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-md my-4">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 border-b z-10">
              <tr>
                <th className="p-3 text-left font-medium w-[30%]">Name</th>
                <th className="p-3 text-left font-medium">Category</th>
                <th className="p-3 text-left font-medium w-[15%]">Price</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-left font-medium">Veg</th>

                <th className="p-3 text-center font-medium w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {localData.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-2">
                    <input
                      className="w-full px-2 py-1 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent rounded outline-none"
                      value={item.name}
                      onChange={(e) =>
                        handleInputChange(idx, "name", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full px-2 py-1 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent rounded outline-none"
                      value={item.category}
                      onChange={(e) =>
                        handleInputChange(idx, "category", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">$</span>
                      <input
                        type="number"
                        className="w-full px-2 py-1 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent rounded outline-none"
                        value={item.price}
                        onChange={(e) =>
                          handleInputChange(idx, "price", e.target.value)
                        }
                      />
                    </div>
                  </td>
                  <td className="p-2">
                    <select
                      className="w-full px-2 py-1 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent rounded outline-none cursor-pointer"
                      // Force the value to uppercase to match the option values
                      value={item.type?.toUpperCase()}
                      onChange={(e) =>
                        handleInputChange(idx, "type", e.target.value)
                      }
                    >
                      <option value="FOOD">FOOD</option>
                      <option value="DRINKS">DRINKS</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      className="w-full px-2 py-1 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent rounded outline-none cursor-pointer"
                      // Convert the boolean to a string for the select value
                      value={item.isVeg ? "true" : "false"}
                      onChange={(e) =>
                        // Convert the string back to a boolean when saving
                        handleInputChange(
                          idx,
                          "isVeg",
                          e.target.value === "true",
                        )
                      }
                    >
                      <option value="true">Veg</option>
                      <option value="false">Non-Veg</option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => removeRow(idx)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-slate-500 italic mr-auto">
            {localData.length === 0
              ? "No items to upload"
              : "Double-check prices before confirming."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(localData)} // Pass the edited data back!
              disabled={isPending || localData.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : null}
              Confirm & Upload
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
