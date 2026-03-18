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
import ExplorerPage from "./pages/ExplorerPage.tsx";
import { useEffect, useMemo } from "react";

import { Network } from "@aptos-labs/ts-sdk";
import * as AptosWallet from "@aptos-labs/wallet-adapter-react";
import { AptosCoreProvider } from "./components/wallet/AptosCoreProvider";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { ShelbyClientProvider } from "@shelby-protocol/react";

const App = () => {
  // Priority: localStorage (from Settings UI) > environment variables
  const shelbyApiKey = (localStorage.getItem("VITE_SHELBY_API_KEY") || import.meta.env.VITE_SHELBY_API_KEY)?.trim();
  const aptosApiKey = import.meta.env.VITE_APTOS_API_KEY?.trim();

  useEffect(() => {
    // Security & Anti-Copy logic removed as requested.
    // To re-enable security, you can restore previous versions of this useEffect.
  }, []);

  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false },
    },
  }), []);

  // Initialize clients inside useMemo to ensure env vars are ready
  const shelbyClient = useMemo(() => new ShelbyClient({
    network: Network.TESTNET,
    apiKey: shelbyApiKey,
    rpc: {
      baseUrl: "https://api.testnet.shelby.xyz/shelby",
      apiKey: shelbyApiKey,
    },
    indexer: {
      baseUrl: "https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql",
      apiKey: shelbyApiKey,
    }
  }), [shelbyApiKey]);

  return (
    <QueryClientProvider client={queryClient}>
      <AptosWallet.AptosWalletAdapterProvider
        autoConnect={true}
        dappConfig={{
          network: Network.TESTNET,
          aptosApiKeys: {
            testnet: aptosApiKey,
          },
        }}
        onError={(error) => {
          console.warn("[WalletAdapter]", error);
        }}
      >
        <AptosCoreProvider>
          <ShelbyClientProvider client={shelbyClient}>
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
                    <Route path="explorer" element={<ExplorerPage />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ShelbyClientProvider>
        </AptosCoreProvider>
      </AptosWallet.AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
};

export default App;
