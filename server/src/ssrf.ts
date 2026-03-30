import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
  "::1",
  "127.0.0.1",
  "metadata.google.internal",
  "metadata",
]);

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fe80:")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.slice(7);
    if (net.isIPv4(v4)) return isPrivateIpv4(v4);
  }
  return false;
}

export async function assertUrlSafeForCapture(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("This host is not allowed");
  }

  if (net.isIP(hostname)) {
    if (net.isIPv4(hostname) && isPrivateIpv4(hostname)) {
      throw new Error("Private IP addresses are not allowed");
    }
    if (net.isIPv6(hostname) && isPrivateIpv6(hostname)) {
      throw new Error("Private IP addresses are not allowed");
    }
    return;
  }

  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  for (const r of records) {
    const addr = r.address;
    if (net.isIPv4(addr) && isPrivateIpv4(addr)) {
      throw new Error("Hostname resolves to a private address");
    }
    if (net.isIPv6(addr) && isPrivateIpv6(addr)) {
      throw new Error("Hostname resolves to a private address");
    }
  }
}
