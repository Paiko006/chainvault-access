const logos = ["Ethereum", "Polygon", "Filecoin", "IPFS", "Arweave", "Chainlink"];

export function SocialProof() {
  return (
    <section className="py-16 px-4 border-t border-border/30">
      <div className="container max-w-5xl mx-auto text-center">
        <p className="text-sm text-muted-foreground mb-8 uppercase tracking-widest">Trusted by Web3 builders</p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {logos.map((name) => (
            <span key={name} className="text-lg font-display font-semibold text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
