export default function SharedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Shared Files</h1>
        <p className="text-muted-foreground text-sm">Files shared with other wallet addresses.</p>
      </div>
      <div className="glass-card p-12 text-center rounded-xl">
        <p className="text-muted-foreground">No shared files yet.</p>
      </div>
    </div>
  );
}
