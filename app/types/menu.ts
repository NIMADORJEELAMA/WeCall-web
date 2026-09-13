export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  type: "FOOD" | "DRINKS";
  inventoryItemId?: string | null;
  isVeg: boolean;
  isActive: boolean;
  portionSize: number;
  requiresPreparation: boolean;
}
