import { motion } from "framer-motion";
import { FileText, Shield, Clock, HardDrive } from "lucide-react";

export function PreviewSection() {
  return (
    <section className="py-24 px-4 border-t border-border/30">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            A Dashboard Built for <span className="gradient-text">Control</span>
          </h2>
          <p className="text-muted-foreground">Manage files, access lists, and storage — all in one place.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card p-6 glow-sm"
        >
          {/* Mock dashboard */}
          <div className="rounded-lg bg-card border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="text-xs text-muted-foreground ml-2">shelbysecure.app/dashboard</div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total Files", value: "142", icon: FileText },
                  { label: "Storage Used", value: "2.4 GB", icon: HardDrive },
                  { label: "Files Shared", value: "38", icon: Shield },
                  { label: "Last Upload", value: "2m ago", icon: Clock },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-secondary/50 border border-border/50 p-4">
                    <s.icon className="h-4 w-4 text-muted-foreground mb-2" />
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {["report-q4.pdf", "wallet-backup.enc", "contract-v2.sol"].map((f) => (
                  <div key={f} className="flex items-center justify-between rounded-md bg-muted/30 px-4 py-3 text-sm">
                    <span className="text-foreground">{f}</span>
                    <span className="text-xs text-accent">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
