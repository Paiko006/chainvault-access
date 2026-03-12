import { useState, useCallback } from "react";
import { Upload, X, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [wallets, setWallets] = useState<string[]>([""]);

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

      <Button variant="hero" size="lg" className="w-full rounded-xl py-6" disabled={!file}>
        <Upload className="mr-2 h-4 w-4" />
        Upload & Secure File
      </Button>
    </div>
  );
}
