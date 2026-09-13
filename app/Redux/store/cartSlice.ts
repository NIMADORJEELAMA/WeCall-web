import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isSpicy: boolean;
  category: string;
}

interface CartState {
  items: CartItem[];
  note: string;
}

const initialState: CartState = {
  items: [],
  note: "",
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<Omit<CartItem, "quantity" | "isSpicy">>,
    ) => {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id,
      );
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1, isSpicy: false });
      }
    },
    incrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) item.quantity += 1;
    },
    decrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find((i) => i.id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
      } else {
        state.items = state.items.filter((i) => i.id !== action.payload);
      }
    },
    toggleSpicy: (state, action: PayloadAction<string>) => {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) item.isSpicy = !item.isSpicy;
    },
    setOrderNote: (state, action: PayloadAction<string>) => {
      state.note = action.payload;
    },
    clearCart: (state) => {
      state.items = [];
      state.note = "";
    },
  },
});

export const {
  addToCart,
  incrementQuantity,
  decrementQuantity,
  toggleSpicy,
  setOrderNote,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
