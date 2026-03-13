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

import * as AptosWallet from "@aptos-labs/wallet-adapter-react";
import { AptosCoreProvider } from "./components/providers/AptosCoreProvider";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { ShelbyClientProvider } from "@shelby-protocol/react";

const queryClient = new QueryClient();
const shelbyClient = new ShelbyClient({
  network: "testnet" as any,
  apiKey: import.meta.env.VITE_SHELBY_API_KEY,
});

const App = () => (
  <AptosWallet.AptosWalletAdapterProvider 
    autoConnect={true} 
    optInWallets={["Petra"]}
    dappConfig={{ network: 'testnet' as any }}
  >
    <ShelbyClientProvider client={shelbyClient}>
      <QueryClientProvider client={queryClient}>
        <AptosCoreProvider>
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
        </AptosCoreProvider>
      </QueryClientProvider>
    </ShelbyClientProvider>
  </AptosWallet.AptosWalletAdapterProvider>
);

export default App;
