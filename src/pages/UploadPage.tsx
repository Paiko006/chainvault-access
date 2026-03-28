import { useState, useCallback, useEffect } from "react";
import { Upload, X, Plus, FileText, Loader2, ExternalLink, HardDrive, Unlock, ShieldCheck } from "lucide-react";
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
import { useNotifications } from "@/hooks/use-notifications";

function saveToLocalStorage(blob: StoredBlob) {
  try {
    const existing = getStoredBlobs();
    existing.unshift(blob);
    saveStoredBlobs(existing);
  } catch {
    // ignore
  }
}

import { getVaultKey, getVaultKeys, encryptDataAsymmetric, importFEK, bytesToBase64, encryptFEK, base64ToBytes, AsymmetricHeader, ENCRYPTION_PREFIX, normalizeAptosAddress } from "@/lib/crypto";
import { PUBLIC_SHELBY_API_KEY, fetchAccountBlobs, formatBytes, syncUserQuota, fetchBlobData } from "@/lib/shelby-indexer";
import { QUOTA_STORAGE_KEY, DEFAULT_QUOTA } from "@/components/landing/PricingSection";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [wallets, setWallets] = useState<string[]>([""]);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const { account, signAndSubmitTransaction, connected, signMessage } = useWallet();
  const { addNotification } = useNotifications();

  const expirationMicros = (Date.now() + 1 * 365 * 24 * 60 * 60 * 1000) * 1000; // 1 year from now

  const [isUploading, setIsUploading] = useState(false);
  const [isVaultLocked, setIsVaultLocked] = useState(true);
  const [uploadProgress, setUploadProgress] = useState("");
  const [usedBytes, setUsedBytes] = useState(0);
  const [loadingUsed, setLoadingUsed] = useState(false);
  const [quota, setQuota] = useState(DEFAULT_QUOTA);
  const shelbyClient = useShelbyClient();

  useEffect(() => {
    const stored = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (stored) setQuota(parseInt(stored));
  }, []);

  useEffect(() => {
    if (account) {
      const storageKey = `vault_seed_${normalizeAptosAddress(account.address.toString())}`;
      const seed = localStorage.getItem(storageKey);
      setIsVaultLocked(!seed);
    }
  }, [account]);

  const handleUnlockOnly = async () => {
    if (!account || !signMessage) return;
    try {
      setUploadProgress("Unlocking Vault...");
      setIsEncrypting(true);
      await getVaultKey(account.address.toString(), signMessage);
      setIsVaultLocked(false);
      toast.success("Vault Unlocked successfully! 🔓");
    } catch (err: unknown) {
      toast.error("Unlock failed. Signature is required to access your private vault.");
    } finally {
      setIsEncrypting(false);
      setUploadProgress("");
    }
  };

  useEffect(() => {
    async function checkQuota() {
      if (connected && account) {
        setLoadingUsed(true);
        try {
          const addr = account.address.toString();
          
          // 1. Cross-Device Sync: Check network for updated quota
          const networkQuota = await syncUserQuota(addr);
          if (networkQuota) {
            setQuota(networkQuota);
            localStorage.setItem(QUOTA_STORAGE_KEY, networkQuota.toString());
          }

          const apiKey = localStorage.getItem("VITE_SHELBY_API_KEY") || "";
          const blobs = await fetchAccountBlobs(addr, apiKey);
          const total = blobs.reduce((sum, b) => sum + Number(b.size), 0);
          setUsedBytes(total);
        } catch (err) {
          console.error("[Upload] Quota check failed:", err);
        } finally {
          setLoadingUsed(false);
        }
      }
    }
    checkQuota();
  }, [connected, account]);

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

    const totalNewSize = files.reduce((s, f) => s + f.size, 0);
    if (usedBytes + totalNewSize > quota) {
      toast.error(`Quota Exceeded! You are trying to upload ${formatBytes(totalNewSize)}, but you only have ${formatBytes(quota - usedBytes)} remaining.`);
      return;
    }

    const apiKey = localStorage.getItem("VITE_SHELBY_API_KEY") || import.meta.env.VITE_SHELBY_API_KEY || PUBLIC_SHELBY_API_KEY;
    if (!apiKey) {
      toast.error("Internal Error: Missing public API Key fallback.");
      return;
    }

    try {
      setIsEncrypting(true);
      setUploadProgress("Preparing & Encrypting files...");
      
      addNotification({
        title: "Batch Upload Started",
        description: `Securing ${files.length} file(s) into your vault.`,
        type: "info"
      });

      const keys = await getVaultKeys(account.address.toString(), signMessage);
      const provider = await createDefaultErasureCodingProvider();
      const preparedBlobs: { safeName: string; data: Uint8Array; commitments: { blob_merkle_root: string }; numChunksets: number; originalSize: number }[] = [];

      // 1. Fetch public keys for all sharees (using .chainvault_pubkey)
      const uploaderAddr = normalizeAptosAddress(account.address.toString());
      const shareeAddrs = wallets.filter(w => w.trim() !== "").map(normalizeAptosAddress);
      
      const pubKeysMap: Record<string, Uint8Array> = {};
      // Add Uploader's own pubkey so they can read it themselves
      pubKeysMap[uploaderAddr] = keys.naclKeyPair.publicKey;

      for (const sharee of shareeAddrs) {
        if (!pubKeysMap[sharee]) {
          try {
            setUploadProgress(`Fetching public key for ${sharee.slice(0, 10)}...`);
            const blob = await fetchBlobData(".chainvault_pubkey", sharee);
            const text = await blob.text();
            pubKeysMap[sharee] = base64ToBytes(text.trim());
          } catch (err) {
            toast.error(`Warning: Sharee ${sharee.slice(0, 10)} has not initialized their vault key. They cannot decrypt this file.`);
            console.warn(`Could not load pubkey for ${sharee}`, err);
          }
        }
      }

      for (const file of files) {
        setUploadProgress(`Encrypting: ${file.name}...`);
        
        // Asymmetric Encryption Option B: Generate FEK
        const fekRaw = window.crypto.getRandomValues(new Uint8Array(32));
        const fekCryptoKey = await importFEK(fekRaw);
        
        const header: AsymmetricHeader = {
          uploaderPubKey: bytesToBase64(keys.naclKeyPair.publicKey),
          feks: {}
        };

        // Encrypt FEK for every valid recipient
        for (const [addr, pubKey] of Object.entries(pubKeysMap)) {
          const { encryptedFek, nonce } = encryptFEK(fekRaw, keys.naclKeyPair.secretKey, pubKey);
          header.feks[addr] = { fek: encryptedFek, nonce };
        }

        const arrayBuffer = await file.arrayBuffer();
        const encryptedBlob = await encryptDataAsymmetric(arrayBuffer, header, fekCryptoKey);
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
        console.log("[ChainVault] Registering blobs on blockchain:", preparedBlobs.map(b => b.safeName));
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

        console.log("[ChainVault] Registration TX submitted:", pendingTx.hash);
        setUploadProgress("Waiting for blockchain confirmation...");
        await shelbyClient.coordination.aptos.waitForTransaction({
          transactionHash: pendingTx.hash,
        });
        console.log("[ChainVault] Registration confirmed.");

        setUploadProgress("Syncing with network (5s delay)...");
        await new Promise(r => setTimeout(r, 5000));

        // 2. Upload each file to RPC
        for (let idx = 0; idx < preparedBlobs.length; idx++) {
          const b = preparedBlobs[idx];
          console.log(`[ChainVault] Uploading payload to RPC for: ${b.safeName}`);
          setUploadProgress(`Uploading (${idx + 1}/${preparedBlobs.length}): ${b.safeName}...`);

          const uploadWithRetry = async (attempts = 3) => {
            for (let i = 0; i < attempts; i++) {
              try {
                const res = await shelbyClient.rpc.putBlob({
                  account: account.address.toString(),
                  blobName: b.safeName,
                  blobData: b.data,
                });
                console.log(`[ChainVault] RPC PUT success for ${b.safeName}:`, res);
                return;
              } catch (err: unknown) {
                console.warn(`[ChainVault] RPC PUT attempt ${i + 1} failed for ${b.safeName}:`, err);
                if (i === attempts - 1) throw err;
                await new Promise(r => setTimeout(r, 3000 * (i + 1)));
              }
            }
          };
          await uploadWithRetry();

          // Ensure User's Public Key is published (so others can share with them)
          try {
            const pubKeyName = `.chainvault_pubkey`;
            const pubKeyCheck = await fetchAccountBlobs(account.address.toString(), apiKey);
            if (!pubKeyCheck.find(b => b.blob_name === pubKeyName)) {
               console.log("[ChainVault] Publishing Public Key to Shelby for future sharing...");
               const pubKeyData = new TextEncoder().encode(bytesToBase64(keys.naclKeyPair.publicKey));
               // Sign metadata registration transaction
               const pkTx = await signAndSubmitTransaction({
                 data: ShelbyBlobClient.createRegisterBlobPayload({
                    account: AccountAddress.from(account.address.toString()),
                    blobName: pubKeyName,
                    blobSize: pubKeyData.length,
                    blobMerkleRoot: (await generateCommitments(provider, pubKeyData)).blob_merkle_root,
                    numChunksets: 1,
                    expirationMicros: (Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) * 1000,
                    encoding: provider.config.enumIndex
                 })
               });
               await shelbyClient.coordination.aptos.waitForTransaction({ transactionHash: pkTx.hash });
               await new Promise(r => setTimeout(r, 2000));
               await shelbyClient.rpc.putBlob({
                  account: account.address.toString(),
                  blobName: pubKeyName,
                  blobData: pubKeyData
               });
            }
          } catch(e) {
             console.warn("Could not publish public key automatically:", e);
          }

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

        addNotification({
          title: "File Secured",
          description: `Successfully uploaded ${b.safeName} to Shelby.`,
          type: "success"
        });
      }

      toast.success(`Successfully secured ${files.length} private files! 🔒✅`);
      addNotification({
        title: "Batch Upload Complete",
        description: `All ${files.length} files are now private and secured on Aptos.`,
        type: "success"
      });
      setFiles([]);
      setWallets([""]);
      setIsUploading(false);
      setUploadProgress("");
    } catch (err: unknown) {
      setIsEncrypting(false);
      setIsUploading(false);
      setUploadProgress("");
      console.error("[ChainVault] Batch Upload Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error("Upload failed: " + errorMessage);
      
      addNotification({
        title: "Upload Failed",
        description: errorMessage,
        type: "error"
      });
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

      <div className="glass-card px-4 py-3 rounded-xl border border-accent/20 bg-accent/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <HardDrive className="h-4 w-4 text-accent" />
           <div className="text-xs">
              <span className="text-muted-foreground uppercase font-bold text-[9px] block">Vault Capacity</span>
              <span className="font-mono font-bold">{loadingUsed ? "Calculating..." : `${formatBytes(usedBytes)} / ${formatBytes(quota)}`}</span>
           </div>
        </div>
        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
           <div 
             className="h-full bg-accent rounded-full transition-all duration-500" 
             style={{ width: `${Math.min((usedBytes / quota) * 100, 100)}%` }}
           />
        </div>
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

      {isVaultLocked && connected ? (
        <Button
          variant="outline"
          size="lg"
          className="w-full rounded-xl py-6 border-accent/50 hover:bg-accent/10 hover:border-accent text-accent font-bold gap-2 group"
          disabled={isEncrypting}
          onClick={handleUnlockOnly}
        >
          {isEncrypting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Unlock className="h-4 w-4 group-hover:scale-110 transition-transform" />
          )}
          Unlock Vault to Secure Files
        </Button>
      ) : (
        <Button
          variant="hero"
          size="lg"
          className="w-full rounded-2xl py-7 glass-button"
          disabled={files.length === 0 || !connected || isUploading || isEncrypting}
          onClick={handleUpload}
        >
          {isEncrypting || isUploading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {uploadProgress}
            </>
          ) : !connected ? (
            "Connect Wallet to Upload"
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              <span className="font-bold text-base">Sign & Secure {files.length} File{files.length > 1 ? 's' : ''}</span>
            </>
          )}
        </Button>
      )}

      {isVaultLocked && connected && (
        <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1.5 opacity-80 uppercase tracking-tighter font-bold">
          <ShieldCheck className="h-3 w-3 text-accent" />
          Decryption seed missing on this device. Sign once to initialize.
        </p>
      )}

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
