import { useState, useCallback } from "react";
import { Upload, X, Plus, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useUploadBlobs } from "@shelby-protocol/react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "sonner";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [wallets, setWallets] = useState<string[]>([""]);
  const { account, signAndSubmitTransaction } = useWallet();
  const uploadBlobs = useUploadBlobs({
    onSuccess: () => {
      toast.success("File successfully secured on Shelby network!");
      setFile(null);
    },
    onError: (error: any) => {
      console.error("Shelby Upload error details:", error);
      
      // Check for authentication error
      if (error?.response?.status === 401 || error?.message?.includes("Unauthorized")) {
        toast.error("Authentication Error: Please check your Shelby API Key.");
        console.error("Failed due to missing or invalid API Key. Ensure VITE_SHELBY_API_KEY is set.");
      } else if (error?.response?.status === 500 || error?.message?.includes("500")) {
        toast.error("Cloud Error (500): The server had trouble processing the file. Try renaming it with simple characters (no spaces).");
        console.error("Internal Server Error (500). This often happens with special characters in filenames or duplicate data.");
      } else {
        toast.error("Failed to upload file to Shelby network.");
      }

      if (error instanceof Error) {
        console.error("Error message:", error.message);
      }
    }
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }, []);

  const addWallet = () => setWallets([...wallets, ""]);
  const removeWallet = (i: number) => setWallets(wallets.filter((_, idx) => idx !== i));
  const updateWallet = (i: number, v: string) => {
    const next = [...wallets];
    next[i] = v;
    setWallets(next);
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!account || !signAndSubmitTransaction) {
      toast.error("Please connect your wallet first.");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      // Normalize filename: remove spaces and special characters that might break the prototype RPC
      const safeFileName = file.name
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '');

      uploadBlobs.mutate({
        signer: {
          account: account.address.toString(),
          signAndSubmitTransaction: signAndSubmitTransaction as any,
        },
        blobs: [{
          blobName: safeFileName,
          blobData: fileData
        }],
        expirationMicros: Date.now() * 1000 + 86400000000 * 30, // 30 days
        options: {
          build: {
            options: {
              maxGasAmount: 500000,
            }
          }
        }
      });
    } catch (err) {
      console.error(err);
      toast.error("Error preparing file data.");
    }
  };
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Upload File</h1>
        <p className="text-muted-foreground text-sm">Upload a file and set wallet-based access control.</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`glass-card border-2 border-dashed transition-all duration-300 rounded-xl p-12 text-center cursor-pointer ${
          dragOver ? "border-accent glow-accent" : "border-border/50 hover:border-primary/40"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input id="file-input" type="file" className="hidden" onChange={handleFileSelect} />

        <AnimatePresence mode="wait">
          {file ? (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div className="font-medium text-foreground">{file.name}</div>
              <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-destructive"
              >
                <X className="h-3 w-3 mr-1" /> Remove
              </Button>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center mx-auto">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="font-medium text-foreground">Drag & drop your file here</div>
              <div className="text-sm text-muted-foreground">or click to browse</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Wallet access control */}
      <div className="glass-card p-6 rounded-xl space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Wallet Access Control</h3>
          <p className="text-sm text-muted-foreground">Specify wallet addresses that can access this file.</p>
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
                <Button variant="ghost" size="icon" onClick={() => removeWallet(i)} className="shrink-0 text-destructive">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addWallet} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Add Wallet
        </Button>
      </div>

      <Button 
        variant="hero" 
        size="lg" 
        className="w-full rounded-xl py-6" 
        disabled={!file || uploadBlobs.isPending}
        onClick={handleUpload}
      >
        {uploadBlobs.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Securing File...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload & Secure File
          </>
        )}
      </Button>
    </div>
  );
}
