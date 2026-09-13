import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Table as TableIcon,
  Trash2,
  Link,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function BulkStockModal({
  isOpen,
  onClose,
  data,
  onConfirm,
  isPending,
}: any) {
  const [localData, setLocalData] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) setLocalData(data);
  }, [isOpen, data]);

  const handleInputChange = (index: number, field: string, value: any) => {
    const updated = [...localData];
    updated[index] = { ...updated[index], [field]: value };
    setLocalData(updated);
  };

  const removeRow = (index: number) => {
    setLocalData(localData.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Increased max-width to 6xl to accommodate more columns */}
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TableIcon size={20} className="text-blue-600" />
            Bulk Import & Auto-Link ({localData.length})
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Items here will be added to <b>Inventory</b> and automatically
            created/updated in the <b>Menu</b>.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-md my-4">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 border-b z-10">
              <tr>
                <th className="p-3 text-left font-bold w-[25%]">Item Name</th>
                <th className="p-3 text-left font-bold w-[15%]">Category</th>
                <th className="p-3 text-left font-bold w-[10%]">Qty</th>
                <th className="p-3 text-left font-bold w-[12%]">Unit</th>
                <th className="p-3 text-left font-bold w-[15%]">Type</th>
                <th className="p-3 text-left font-bold w-[15%] text-orange-600">
                  Buy Price
                </th>
                <th className="p-3 text-left font-bold w-[15%] text-emerald-600">
                  Sell Price
                </th>
                <th className="p-3 text-center font-bold w-[10%] text-blue-600">
                  Sync Menu?
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {localData.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  {/* NAME */}
                  <td className="p-2">
                    <input
                      className="w-full px-2 py-1 font-semibold uppercase border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent rounded outline-none"
                      value={item.name}
                      onChange={(e) =>
                        handleInputChange(idx, "name", e.target.value)
                      }
                    />
                  </td>
                  {/* CATEGORY */}
                  <td className="p-2">
                    <input
                      placeholder="e.g. BEVERAGES"
                      className="w-full px-2 py-1 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent rounded outline-none text-xs uppercase"
                      value={item.category || ""}
                      onChange={(e) =>
                        handleInputChange(
                          idx,
                          "category",
                          e.target.value.toUpperCase(),
                        )
                      }
                    />
                  </td>
                  {/* QUANTITY */}
                  <td className="p-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent rounded outline-none"
                      value={item.quantity}
                      onChange={(e) =>
                        handleInputChange(idx, "quantity", e.target.value)
                      }
                    />
                  </td>

                  {/* UNIT */}

                  <td className="p-2">
                    <select
                      className="w-full px-2 py-1 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent rounded outline-none cursor-pointer font-medium"
                      value={item?.unit?.toUpperCase()}
                      onChange={(e) =>
                        handleInputChange(idx, "unit", e.target.value)
                      }
                    >
                      <option value="pcs">PCS</option>
                      <option value="kg">KG</option>
                      <option value="ltr">L</option>
                      <option value="ml">ML</option>
                    </select>
                  </td>
                  {/* TYPE/CATEGORY */}
                  <td className="p-2">
                    <select
                      className="w-full px-2 py-1 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent rounded outline-none cursor-pointer font-medium"
                      value={item.type?.toUpperCase()}
                      onChange={(e) =>
                        handleInputChange(idx, "type", e.target.value)
                      }
                    >
                      <option value="FOOD">FOOD</option>
                      <option value="DRINKS">DRINKS</option>
                    </select>
                  </td>

                  {/* BUY PRICE (Inventory Cost) */}
                  <td className="p-2">
                    <div className="flex items-center gap-1 bg-orange-50/50 rounded px-1">
                      <span className="text-orange-400">₹</span>
                      <input
                        type="number"
                        className="w-full px-1 py-1 border-transparent bg-transparent outline-none font-medium text-orange-700"
                        value={item.purchasePrice}
                        onChange={(e) =>
                          handleInputChange(
                            idx,
                            "purchasePrice",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </td>

                  {/* SELL PRICE (Menu Price) */}
                  <td className="p-2">
                    <div className="flex items-center gap-1 bg-emerald-50/50 rounded px-1">
                      <span className="text-emerald-400">₹</span>
                      <input
                        type="number"
                        className="w-full px-1 py-1 border-transparent bg-transparent outline-none font-bold text-emerald-700"
                        value={item.sellingPrice}
                        onChange={(e) =>
                          handleInputChange(idx, "sellingPrice", e.target.value)
                        }
                      />
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange(
                          idx,
                          "syncWithMenu",
                          !item.syncWithMenu,
                        )
                      }
                      className={`p-1 rounded-md transition-colors ${
                        item.syncWithMenu
                          ? "text-blue-600 bg-blue-50"
                          : "text-slate-300 bg-slate-50"
                      }`}
                    >
                      {item.syncWithMenu ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <XCircle size={20} />
                      )}
                    </button>
                  </td>
                  {/* REMOVE ROW */}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => removeRow(idx)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
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
          <div className="flex items-center gap-2 text-slate-500 mr-auto">
            <Link size={14} className="text-blue-500" />
            <p className="text-[11px] italic">
              Items will be linked by name. If the name matches an existing menu
              item, its price will be updated.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(localData)}
              disabled={isPending || localData.length === 0}
              className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
            >
              {isPending ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : null}
              Confirm & Link
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
