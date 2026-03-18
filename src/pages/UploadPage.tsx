import { useState, useCallback } from "react";
import { Upload, X, Plus, FileText, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useUploadBlobs } from "@shelby-protocol/react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "sonner";
import { BLOBS_STORAGE_KEY, StoredBlob, getStoredBlobs, saveStoredBlobs } from "@/types/storage";

function saveToLocalStorage(blob: StoredBlob) {
  try {
    const existing = getStoredBlobs();
    existing.unshift(blob);
    saveStoredBlobs(existing);
  } catch {
    // ignore
  }
}

import { getVaultKey, encryptData, ENCRYPTION_PREFIX } from "@/lib/crypto";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [wallets, setWallets] = useState<string[]>([""]);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const { account, signAndSubmitTransaction, connected } = useWallet();

  const expirationMicros = (Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) * 1000; // ~100 years from now (Permanent)

  const uploadBlobs = useUploadBlobs({
    onSuccess: () => {
      // Logic moved to mutate call
    },
    onError: (error: any) => {
      console.error("[ChainVault] Upload error:", error);
      const msg = error?.message || "";
      const status = error?.response?.status;
      setIsEncrypting(false);

      if (status === 401 || msg.includes("401") || msg.includes("Unauthorized")) {
        toast.error("🔐 Auth Error: Check API Key/Whitelist.");
      } else {
        toast.error("Upload failed: " + (msg || "Unknown error"));
      }
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) setFile(f);
    },
    []
  );

  const addWallet = () => setWallets([...wallets, ""]);
  const removeWallet = (i: number) =>
    setWallets(wallets.filter((_, idx) => idx !== i));
  const updateWallet = (i: number, v: string) => {
    const next = [...wallets];
    next[i] = v;
    setWallets(next);
  };

  const handleUpload = async () => {
    if (!connected || !account || !signAndSubmitTransaction) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    const apiKey = import.meta.env.VITE_SHELBY_API_KEY;
    if (!apiKey) {
      toast.error("API Key missing.");
      return;
    }

    try {
      setIsEncrypting(true);
      
      // 1. Get/Derive Vault Key
      const vaultKey = await getVaultKey(account.address.toString());
      
      // 2. Encrypt Data
      const arrayBuffer = await file.arrayBuffer();
      const encryptedBlob = await encryptData(arrayBuffer, vaultKey);
      const encryptedData = new Uint8Array(await encryptedBlob.arrayBuffer());

      // 3. Prepare Safe Filename with Encryption Prefix
      const baseName = file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 30);
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      
      // Mark as encrypted so FilesPage knows how to handle it
      const safeFileName = `${ENCRYPTION_PREFIX}${baseName}_${Date.now()}.${ext}`;

      // 4. Submit to Shelby
      uploadBlobs.mutate({
        signer: {
          account: account.address,
          signAndSubmitTransaction,
        },
        blobs: [
          {
            blobName: safeFileName,
            blobData: encryptedData,
          },
        ],
        expirationMicros,
      }, {
        onSuccess: async () => {
          // Give indexer a moment to process before showing success
          toast.info("Syncing with network...");
          await new Promise(r => setTimeout(r, 2000));
          
          setIsEncrypting(false);
          const sharedWith = wallets.filter(w => w.trim() !== "");
          
          saveToLocalStorage({
            blobName: safeFileName,
            uploadedAt: Date.now(),
            sizeBytes: file.size,
            ownerAddress: account.address.toString(),
            expirationMicros,
            sharedWith,
          });
          toast.success("Private file secured & encrypted! 🔒✅");
          setFile(null);
          setWallets([""]);
        }
      });
    } catch (err) {
      setIsEncrypting(false);
      console.error("[ChainVault] Encryption/Upload Error:", err);
      toast.error("Process failed: Encryption error.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Upload File</h1>
        <p className="text-muted-foreground text-sm">
          Upload a file to the{" "}
          <span className="font-medium text-primary">Shelby testnet</span> and
          set wallet-based access control.
        </p>
      </div>

      {/* Testnet info banner */}
      <div className="glass-card px-4 py-3 rounded-xl border border-primary/20 flex items-center justify-between gap-4">
        <div className="text-sm">
          <span className="text-muted-foreground">Network: </span>
          <span className="font-semibold text-primary">Aptos Testnet</span>
          <span className="text-muted-foreground ml-3">Need testnet tokens? </span>
        </div>
        <a
          href="https://aptos.dev/en/network/faucet"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0"
        >
          Get APT <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`glass-card border-2 border-dashed transition-all duration-300 rounded-xl p-12 text-center cursor-pointer ${
          dragOver
            ? "border-accent glow-accent"
            : "border-border/50 hover:border-primary/40"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />

        <AnimatePresence mode="wait">
          {file ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div className="font-medium text-foreground">{file.name}</div>
              <div className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="text-destructive"
              >
                <X className="h-3 w-3 mr-1" /> Remove
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center mx-auto">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="font-medium text-foreground">
                Drag & drop your file here
              </div>
              <div className="text-sm text-muted-foreground">
                or click to browse
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Wallet access control */}
      <div className="glass-card p-6 rounded-xl space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Wallet Access Control</h3>
          <p className="text-sm text-muted-foreground">
            Specify wallet addresses that can access this file.
          </p>
        </div>

        <div className="space-y-3">
          {wallets.map((w, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={w}
                onChange={(e) => updateWallet(i, e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm bg-secondary/50 border-border/50"
              />
              {wallets.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeWallet(i)}
                  className="shrink-0 text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={addWallet}
          className="gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> Add Wallet
        </Button>
      </div>

      {/* Upload button */}
      <Button
        variant="hero"
        size="lg"
        className="w-full rounded-xl py-6"
        disabled={!file || !connected || uploadBlobs.isPending || isEncrypting}
        onClick={handleUpload}
      >
        {isEncrypting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Encrypting Vault…
          </>
        ) : uploadBlobs.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Securing on testnet…
          </>
        ) : !connected ? (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Connect Wallet to Upload
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload & Secure Private File
          </>
        )}
      </Button>

      {(uploadBlobs.isPending || isEncrypting) && (
        <p className="text-center text-xs text-muted-foreground animate-pulse">
          {isEncrypting 
            ? "AES-GCM encryption in progress at source..." 
            : "Registering on-chain → uploading encrypted blob…"}
        </p>
      )}
    </div>
  );
}
