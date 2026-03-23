// Footer component imports removed Lock

const links = [
  { label: "Docs", href: "https://docs.shelby.xyz/" },
  { label: "GitHub", href: "#" },
  { label: "Community", href: "#" },
  { label: "Terms", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/30 py-12 px-4">
      <div className="container max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-9 w-9 object-contain" />
          <span className="font-display font-bold text-lg">ShelbySecure</span>
        </div>

        <div className="flex items-center gap-8">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">© 2026 ShelbySecure. All rights reserved.</p>
      </div>
    </footer>
  );
}
