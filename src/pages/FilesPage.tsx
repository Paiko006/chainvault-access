export default function FilesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">My Files</h1>
        <p className="text-muted-foreground text-sm">All files stored in your vault.</p>
      </div>
      <div className="glass-card p-12 text-center rounded-xl">
        <p className="text-muted-foreground">Your files will appear here. Upload a file to get started.</p>
      </div>
    </div>
  );
}
