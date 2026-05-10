import { create } from "zustand";

interface Bundle {
  phoneNumber: string;
  gigAmount: number;
  price?: number;
}

interface DuplicateInfo {
  phoneNumber: string;
  count: number;
  type: "same_paste" | "last_24h" | "both";
}

interface BundleStore {
  // Parsed bundles state
  parsedBundles: Bundle[];
  cleanBundles: Bundle[];
  flaggedBundles: DuplicateInfo[];
  lastBreakdown: Array<{ gigAmount: number; count: number; total: number }>;

  // Calculation state
  totalGigs: number;
  totalPrice: number;
  itemCount: number;

  // UI state
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  selectedPricingCollectionId: string | null;
  selectedPricingCollectionName: string | null;

  // Actions
  setParsedBundles: (bundles: Bundle[]) => void;
  setCleanBundles: (bundles: Bundle[]) => void;
  setFlaggedBundles: (bundles: DuplicateInfo[]) => void;
  setLastBreakdown: (breakdown: Array<{ gigAmount: number; count: number; total: number }>) => void;
  setTotals: (totalGigs: number, totalPrice: number, itemCount: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (message: string | null) => void;
  setSelectedPricingCollection: (id: string | null, name?: string | null) => void;
  clear: () => void;
}

export const useBundleStore = create<BundleStore>((set) => ({
  // Initial state
  parsedBundles: [],
  cleanBundles: [],
  flaggedBundles: [],
  lastBreakdown: [],
  totalGigs: 0,
  totalPrice: 0,
  itemCount: 0,
  isLoading: false,
  error: null,
  successMessage: null,
  selectedPricingCollectionId: null,
  selectedPricingCollectionName: null,

  // Actions
  setParsedBundles: (bundles) =>
    set({ parsedBundles: bundles, itemCount: bundles.length }),
  setCleanBundles: (bundles) => set({ cleanBundles: bundles }),
  setFlaggedBundles: (bundles) => set({ flaggedBundles: bundles }),
  setLastBreakdown: (breakdown) => set({ lastBreakdown: breakdown }),
  setTotals: (totalGigs, totalPrice, itemCount) =>
    set({ totalGigs, totalPrice, itemCount }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSuccess: (message) => set({ successMessage: message }),
  setSelectedPricingCollection: (id, name = null) =>
    set({ selectedPricingCollectionId: id, selectedPricingCollectionName: name }),
  clear: () =>
    set({
      parsedBundles: [],
      cleanBundles: [],
      flaggedBundles: [],
      lastBreakdown: [],
      totalGigs: 0,
      totalPrice: 0,
      itemCount: 0,
      error: null,
      successMessage: null,
      selectedPricingCollectionId: null,
      selectedPricingCollectionName: null,
    }),
}));

// Pricing store
interface PricingStore {
  pricingList: Array<{ gigAmount: number; price: number; id: string }>;
  setPricingList: (list: Array<{ gigAmount: number; price: number; id: string }>) => void;
  addPricingItem: (item: { gigAmount: number; price: number; id: string }) => void;
  removePricingItem: (id: string) => void;
}

export const usePricingStore = create<PricingStore>((set) => ({
  pricingList: [],
  setPricingList: (list) => set({ pricingList: list }),
  addPricingItem: (item) =>
    set((state) => ({
      pricingList: [...state.pricingList, item],
    })),
  removePricingItem: (id) =>
    set((state) => ({
      pricingList: state.pricingList.filter((item) => item.id !== id),
    })),
}));

// API Credentials store
interface CredentialStore {
  credentials: Array<{ id: string; provider: string; endpoint: string; isActive: boolean }>;
  setCredentials: (
    creds: Array<{ id: string; provider: string; endpoint: string; isActive: boolean }>
  ) => void;
  addCredential: (cred: { id: string; provider: string; endpoint: string; isActive: boolean }) => void;
  removeCredential: (id: string) => void;
  updateCredential: (
    id: string,
    updates: { endpoint?: string; isActive?: boolean }
  ) => void;
}

export const useCredentialStore = create<CredentialStore>((set) => ({
  credentials: [],
  setCredentials: (creds) => set({ credentials: creds }),
  addCredential: (cred) =>
    set((state) => ({
      credentials: [...state.credentials, cred],
    })),
  removeCredential: (id) =>
    set((state) => ({
      credentials: state.credentials.filter((c) => c.id !== id),
    })),
  updateCredential: (id, updates) =>
    set((state) => ({
      credentials: state.credentials.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
}));
