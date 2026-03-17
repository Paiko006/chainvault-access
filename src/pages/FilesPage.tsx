import { useState } from "react";
import { FileText, Trash2, ExternalLink, Upload, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Link } from "react-router-dom";
import { StoredBlob } from "./UploadPage";

const BLOBS_STORAGE_KEY = "chainvault_blobs";

function getStoredBlobs(): StoredBlob[] {
  try {
    return JSON.parse(localStorage.getItem(BLOBS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function deleteBlob(index: number) {
  const blobs = getStoredBlobs();
  blobs.splice(index, 1);
  localStorage.setItem(BLOBS_STORAGE_KEY, JSON.stringify(blobs));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FilesPage() {
  const { connected, account } = useWallet();
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);

  const allBlobs = getStoredBlobs().filter(
    (b) => !account || b.ownerAddress === account.address.toString()
  );

  const filtered = allBlobs.filter((b) =>
    b.blobName.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (idx: number) => {
    // idx is relative to allBlobs; map to real index in storage
    const realBlobs = getStoredBlobs();
    const target = allBlobs[idx];
    const realIdx = realBlobs.findIndex(
      (b) =>
        b.blobName === target.blobName && b.uploadedAt === target.uploadedAt
    );
    if (realIdx !== -1) deleteBlob(realIdx);
    setRefresh((r) => r + 1);
  };

  if (!connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Files</h1>
          <p className="text-muted-foreground text-sm">
            All files stored in your vault.
          </p>
        </div>
        <div className="glass-card p-12 text-center rounded-xl">
          <p className="text-muted-foreground">
            Connect your wallet to view your files.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Files</h1>
          <p className="text-muted-foreground text-sm">
            All files stored in your vault on{" "}
            <span className="font-medium text-primary">Shelby testnet</span>.
          </p>
        </div>
        <Link to="/dashboard/upload">
          <Button variant="hero" size="sm" className="gap-2">
            <Upload className="h-3.5 w-3.5" />
            Upload File
          </Button>
        </Link>
      </div>

      {/* Search */}
      {allBlobs.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
            className="pl-9 bg-secondary/50 border-border/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      )}

      {allBlobs.length === 0 ? (
        <div className="glass-card p-14 text-center rounded-xl space-y-4">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">
            No files yet — upload your first file to get started.
          </p>
          <Link to="/dashboard/upload">
            <Button variant="hero" size="sm" className="gap-2">
              <Upload className="h-3.5 w-3.5" />
              Upload File
            </Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <p className="text-muted-foreground text-sm">
            No files match "{search}".
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground">
                  <th className="text-left px-5 py-3 font-medium">File Name</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">
                    Size
                  </th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">
                    Upload Date
                  </th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, idx) => {
                  const expired = Date.now() * 1000 > b.expirationMicros;
                  return (
                    <tr
                      key={`${b.blobName}-${b.uploadedAt}`}
                      className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium text-foreground truncate max-w-[150px]">
                            {b.blobName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                        {formatBytes(b.sizeBytes)}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                        {formatDate(b.uploadedAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            expired
                              ? "bg-muted text-muted-foreground"
                              : "bg-accent/10 text-accent"
                          }`}
                        >
                          {!expired && (
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          )}
                          {expired ? "Expired" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`https://explorer.aptoslabs.com/account/${b.ownerAddress}?network=testnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="View on Explorer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title="Delete from local records"
                            onClick={() => handleDelete(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-border/30 text-xs text-muted-foreground">
            {filtered.length} file{filtered.length !== 1 ? "s" : ""} •{" "}
            <a
              href="https://explorer.shelby.xyz/testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground inline-flex items-center gap-0.5"
            >
              View on Shelby Explorer
              <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
