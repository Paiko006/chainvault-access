// Helper to shorten address
export function shortenAddress(addr: string | undefined | null) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

import { create } from "zustand";

export interface WalletInfo {
  name: string;
  address: string;
  icon: string;
}

interface WalletState {
  connected: boolean;
  wallet: WalletInfo | null;
  connect: (wallet: WalletInfo) => void;
  disconnect: () => void;
}

// Wallet providers config
export const WALLET_PROVIDERS = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    color: "from-orange-500 to-amber-500",
    detect: () => typeof window !== "undefined" && !!(window as any).ethereum?.isMetaMask,
    connect: async () => {
      const eth = (window as any).ethereum;
      if (!eth?.isMetaMask) throw new Error("MetaMask not installed");
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      return accounts[0] as string;
    },
  },
  {
    id: "petra",
    name: "Petra Wallet",
    icon: "🔴",
    color: "from-red-500 to-rose-500",
    detect: () => typeof window !== "undefined" && !!(window as any).aptos,
    connect: async () => {
      const aptos = (window as any).aptos;
      if (!aptos) throw new Error("Petra Wallet not installed");
      const res = await aptos.connect();
      return res.address as string;
    },
  },
  {
    id: "martian",
    name: "Martian Wallet",
    icon: "👽",
    color: "from-emerald-500 to-teal-500",
    detect: () => typeof window !== "undefined" && !!(window as any).martian,
    connect: async () => {
      const martian = (window as any).martian;
      if (!martian) throw new Error("Martian Wallet not installed");
      const res = await martian.connect();
      return res.address as string;
    },
  },
  {
    id: "pontem",
    name: "Pontem Wallet",
    icon: "🟣",
    color: "from-violet-500 to-purple-500",
    detect: () => typeof window !== "undefined" && !!(window as any).pontem,
    connect: async () => {
      const pontem = (window as any).pontem;
      if (!pontem) throw new Error("Pontem Wallet not installed");
      const res = await pontem.connect();
      return res.address as string;
    },
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: "⚫",
    color: "from-zinc-400 to-zinc-600",
    detect: () => typeof window !== "undefined" && !!(window as any).okxwallet,
    connect: async () => {
      const okx = (window as any).okxwallet;
      if (!okx) throw new Error("OKX Wallet not installed");
      const accounts = await okx.request({ method: "eth_requestAccounts" });
      return accounts[0] as string;
    },
  },
];

export const useWalletStore = create<WalletState>((set) => ({
  connected: false,
  wallet: null,
  connect: (wallet) => set({ connected: true, wallet }),
  disconnect: () => set({ connected: false, wallet: null }),
}));

