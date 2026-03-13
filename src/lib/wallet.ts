// Helper to shorten address
export function shortenAddress(addr: string | undefined | null) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}
