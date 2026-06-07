import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PersonalisationDetails } from '@envitra/shared/types'

export interface CartItem {
  id: string; // nanoid
  cardProductId: string;
  productType: 'solid_color' | 'design' | 'custom';
  productName: string;
  productSlug: string;
  material: string;
  priceInr: number; // in paise
  quantity: number;
  personalisation: PersonalisationDetails;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed values getters
  getItemCount: () => number;
  getSubtotal: () => number; // paise
  getGst: () => number; // paise
  getGrandTotal: () => number; // paise
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const id = Math.random().toString(36).substring(2, 9); // Simple client-side unique id
        set((state) => {
          // Check if item with same configuration and productId already exists
          const existingItemIndex = state.items.findIndex(
            (i) =>
              i.cardProductId === item.cardProductId &&
              JSON.stringify(i.personalisation) === JSON.stringify(item.personalisation)
          );

          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += item.quantity;
            return { items: updatedItems };
          }

          return { items: [...state.items, { ...item, id }] };
        });
      },
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        })),
      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.priceInr * item.quantity, 0);
      },
      getGst: () => {
        // GST is 18% of subtotal
        return Math.round(get().getSubtotal() * 0.18);
      },
      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        const gst = get().getGst();
        return subtotal + gst;
      },
    }),
    {
      name: 'envitra-cart',
    }
  )
)
