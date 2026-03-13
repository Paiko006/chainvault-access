import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import DashboardLayout from "./pages/DashboardLayout.tsx";
import DashboardHome from "./pages/DashboardHome.tsx";
import UploadPage from "./pages/UploadPage.tsx";
import FilesPage from "./pages/FilesPage.tsx";
import SharedPage from "./pages/SharedPage.tsx";
import AccessControlPage from "./pages/AccessControlPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import LockerPage from "./pages/LockerPage.tsx";

import { Network } from "@aptos-labs/ts-sdk";
import * as AptosWallet from "@aptos-labs/wallet-adapter-react";
import { AptosCoreProvider } from "./components/wallet/AptosCoreProvider";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { ShelbyClientProvider } from "@shelby-protocol/react";

console.log("Shelby API Key configured:", !!import.meta.env.VITE_SHELBY_API_KEY);

const queryClient = new QueryClient();
const shelbyClient = new ShelbyClient({
  network: "shelbynet" as any,
  apiKey: import.meta.env.VITE_SHELBY_API_KEY?.trim(),
  aptos: {
    network: "shelbynet" as any,
    fullnode: "https://api.shelbynet.shelby.xyz/v1",
    indexer: "https://api.shelbynet.shelby.xyz/v1/graphql",
  },
  rpc: {
    baseUrl: "https://api.shelbynet.shelby.xyz/shelby",
    apiKey: import.meta.env.VITE_SHELBY_API_KEY?.trim(),
  },
  indexer: {
    baseUrl: "https://api.shelbynet.shelby.xyz/v1/graphql",
    apiKey: import.meta.env.VITE_SHELBY_API_KEY?.trim(),
  }
});

const App = () => (
  <AptosWallet.AptosWalletAdapterProvider 
    autoConnect={true} 
    optInWallets={["Petra"]}
    dappConfig={{ 
      network: "shelbynet" as Network,
    }}
  >
    <AptosCoreProvider>
      <ShelbyClientProvider client={shelbyClient}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="files" element={<FilesPage />} />
                  <Route path="upload" element={<UploadPage />} />
                  <Route path="shared" element={<SharedPage />} />
                  <Route path="access" element={<AccessControlPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="/locker" element={<LockerPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ShelbyClientProvider>
    </AptosCoreProvider>
  </AptosWallet.AptosWalletAdapterProvider>
);

export default App;
