import { useState, useCallback } from "react";
import { Upload, X, Plus, FileText, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useShelbyClient } from "@shelby-protocol/react";
import { 
  ShelbyBlobClient, 
  createDefaultErasureCodingProvider, 
  generateCommitments, 
  expectedTotalChunksets
} from "@shelby-protocol/sdk/browser";
import { AccountAddress } from "@aptos-labs/ts-sdk";
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
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [wallets, setWallets] = useState<string[]>([""]);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const { account, signAndSubmitTransaction, connected } = useWallet();

  const expirationMicros = (Date.now() + 1 * 365 * 24 * 60 * 60 * 1000) * 1000; // 1 year from now

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const shelbyClient = useShelbyClient();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const newFiles = Array.from(e.dataTransfer.files).slice(0, 10);
    setFiles(prev => [...prev, ...newFiles].slice(0, 10));
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []).slice(0, 10);
      setFiles(prev => [...prev, ...newFiles].slice(0, 10));
    },
    []
  );

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

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
    if (files.length === 0) {
      toast.error("Please select at least one file.");
      return;
    }

    const apiKey = localStorage.getItem("VITE_SHELBY_API_KEY") || import.meta.env.VITE_SHELBY_API_KEY;
    if (!apiKey) {
      toast.error("API Key missing.");
      return;
    }

    try {
      setIsEncrypting(true);
      setUploadProgress("Preparing & Encrypting files...");
      
      const vaultKey = await getVaultKey(account.address.toString());
      const provider = await createDefaultErasureCodingProvider();
      const preparedBlobs: { safeName: string; data: Uint8Array; commitments: any; numChunksets: number; originalSize: number }[] = [];

      for (const file of files) {
        setUploadProgress(`Encrypting: ${file.name}...`);
        const arrayBuffer = await file.arrayBuffer();
        const encryptedBlob = await encryptData(arrayBuffer, vaultKey);
        const encryptedData = new Uint8Array(await encryptedBlob.arrayBuffer());

        const baseName = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .slice(0, 30);
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
        const safeFileName = `${ENCRYPTION_PREFIX}${baseName}.${ext}.vault`;

        const commitments = await generateCommitments(provider, encryptedData);
        const chunksetSize = provider.config.erasure_k * provider.config.chunkSizeBytes;
        const numChunksets = expectedTotalChunksets(encryptedData.length, chunksetSize);

        preparedBlobs.push({
          safeName: safeFileName,
          data: encryptedData,
          commitments,
          numChunksets,
          originalSize: file.size
        });
      }

      setIsEncrypting(false);
      setIsUploading(true);

      // 1. Batch Register on Aptos
      setUploadProgress(`Registering ${files.length} files in 1 transaction...`);
      const pendingTx = await signAndSubmitTransaction({
        data: ShelbyBlobClient.createBatchRegisterBlobsPayload({
          account: AccountAddress.from(account.address.toString()),
          expirationMicros,
          blobs: preparedBlobs.map(b => ({
            blobName: b.safeName,
            blobSize: b.data.length,
            blobMerkleRoot: b.commitments.blob_merkle_root,
            numChunksets: b.numChunksets
          })),
          encoding: provider.config.enumIndex
        }),
        options: { maxGasAmount: 300000 }
      });

      setUploadProgress("Waiting for blockchain confirmation...");
      await shelbyClient.coordination.aptos.waitForTransaction({
        transactionHash: pendingTx.hash,
      });

      setUploadProgress("Syncing with network (5s delay)...");
      await new Promise(r => setTimeout(r, 5000));

      // 2. Upload each file to RPC
      for (let idx = 0; idx < preparedBlobs.length; idx++) {
        const b = preparedBlobs[idx];
        setUploadProgress(`Uploading (${idx + 1}/${preparedBlobs.length}): ${b.safeName}...`);

        const uploadWithRetry = async (attempts = 3) => {
          for (let i = 0; i < attempts; i++) {
            try {
              await shelbyClient.rpc.putBlob({
                account: account.address.toString(),
                blobName: b.safeName,
                blobData: b.data,
              });
              return;
            } catch (err: any) {
              if (i === attempts - 1) throw err;
              await new Promise(r => setTimeout(r, 3000 * (i + 1)));
            }
          }
        };
        await uploadWithRetry();

        // Save progress to local storage
        const sharedWith = wallets.filter(w => w.trim() !== "");
        saveToLocalStorage({
          blobName: b.safeName,
          uploadedAt: Date.now(),
          sizeBytes: b.originalSize,
          ownerAddress: account.address.toString(),
          expirationMicros,
          sharedWith,
        });
      }

      toast.success(`Successfully secured ${files.length} private files! 🔒✅`);
      setFiles([]);
      setWallets([""]);
      setIsUploading(false);
      setUploadProgress("");
    } catch (err: any) {
      setIsEncrypting(false);
      setIsUploading(false);
      setUploadProgress("");
      console.error("[ChainVault] Batch Upload Error:", err);
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Batch Upload</h1>
        <p className="text-muted-foreground text-sm">
          Secure up to 10 files in a <span className="text-primary font-bold">single transaction</span> to save time and gas.
        </p>
      </div>

      <div className="glass-card px-4 py-3 rounded-xl border border-primary/20 flex items-center justify-between gap-4">
        <div className="text-sm">
          <span className="text-muted-foreground">Network: </span>
          <span className="font-semibold text-primary">Aptos Testnet</span>
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
        className={`glass-card border-2 border-dashed transition-all duration-300 rounded-xl p-8 text-center cursor-pointer ${
          dragOver
            ? "border-accent glow-accent"
            : "border-border/50 hover:border-primary/40"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {files.length === 0 ? (
          <div className="space-y-3">
            <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center mx-auto">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="font-medium">Drag & drop files here</div>
            <div className="text-xs text-muted-foreground">Up to 10 files. Encrypted locally via AES-256.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border/50 relative group">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="text-left overflow-hidden">
                  <div className="text-xs font-medium truncate">{f.name}</div>
                  <div className="text-[10px] text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {files.length < 10 && (
              <div className="flex items-center justify-center p-3 border border-dashed border-border/50 rounded-lg text-muted-foreground hover:text-primary transition-colors">
                <Plus className="h-4 w-4 mr-2" /> Add More
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wallet access control */}
      <div className="glass-card p-6 rounded-xl space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Shared Wallet Access</h3>
          <p className="text-sm text-muted-foreground">
            Wallets that will be granted permission for <span className="text-accent underline">all</span> files in this batch.
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
        disabled={files.length === 0 || !connected || isUploading || isEncrypting}
        onClick={handleUpload}
      >
        {isEncrypting || isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {uploadProgress}
          </>
        ) : !connected ? (
          "Connect Wallet to Upload"
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Sign & Secure {files.length} File{files.length > 1 ? 's' : ''}
          </>
        )}
      </Button>

      {(isUploading || isEncrypting) && (
        <div className="space-y-2">
          <div className="w-full bg-secondary/50 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              className="bg-primary h-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 15, ease: "linear" }}
            />
          </div>
          <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest animate-pulse font-bold">
            DO NOT CLOSE THIS TAB • AES-256 VAULT IN PROGRESS
          </p>
        </div>
      )}
    </div>
  );
}
