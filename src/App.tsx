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

  // Security & Anti-Copy logic
  useEffect(() => {
    // Check for "Reviewer Mode" via URL parameter to allow inspection by the team
    const params = new URLSearchParams(window.location.search);
    const isReviewerMode = params.get("dev") === "true";

    if (isReviewerMode) {
      console.log("%c[Reviewer Mode Active]", "color: #10b981; font-weight: bold;");
      console.log("Anti-copy and DevTools protections are disabled for this session.");
      return; // Skip all security measures
    }

    // 1. Disable Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Disable F12 and Ctrl+Shift+I/J/U (Inspect/Source)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
      }
    };

    // 3. Prevent Text Selection & Image Dragging via CSS
    const style = document.createElement("style");
    style.innerHTML = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-user-drag: none !important;
      }
      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;

    // 4. Console Protection & DevTools Detection
    const protectConsole = () => {
      if (typeof window !== "undefined") {
        const threshold = 160;
        const emitEvent = () => {
          console.clear();
          console.log("%c[Security Active]", "color: #10b981; font-size: 30px; font-weight: bold;");
          console.log("Technology & Source are protected. Unauthorized inspection is discouraged.");
        };

        const check = () => {
          const widthThreshold = window.outerWidth - window.innerWidth > threshold;
          const heightThreshold = window.outerHeight - window.innerHeight > threshold;
          if (widthThreshold || heightThreshold) {
            emitEvent();
          }
        };
        setInterval(check, 1000);
      }
    };

    document.head.appendChild(style);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    protectConsole();

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
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
