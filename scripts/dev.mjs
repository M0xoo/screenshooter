#!/usr/bin/env node
/**
 * Picks a free TCP port (preferring PORT or 3001+) so the API and Vite proxy stay in sync.
 */
import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const s = createServer();
    s.once("error", () => resolve(false));
    s.listen(port, "0.0.0.0", () => {
      s.close(() => resolve(true));
    });
  });
}

/**
 * @param {number[]} candidates
 */
async function pickPort(candidates) {
  for (const p of candidates) {
    if (await isPortFree(p)) return p;
  }
  throw new Error(
    `No free port in range ${candidates[0]}–${candidates[candidates.length - 1]}`,
  );
}

execSync("npm run build -w shared", { cwd: root, stdio: "inherit" });

const start = (() => {
  const n = Number(process.env.PORT);
  return Number.isFinite(n) && n > 0 ? n : 3001;
})();

const candidates = Array.from({ length: 40 }, (_, i) => start + i);
const port = await pickPort(candidates);

const env = {
  ...process.env,
  PORT: String(port),
  VITE_API_PORT: String(port),
};

if (port !== start) {
  console.log(
    `\n  Note: port ${start} was busy — API using ${port} (proxy matched).\n`,
  );
} else {
  console.log(`\n  API → http://127.0.0.1:${port}\n`);
}

const concurrentlyJs = join(
  root,
  "node_modules",
  "concurrently",
  "dist",
  "bin",
  "concurrently.js",
);

// Must use shell:false so each command is one argv string. With shell:true,
// /bin/sh word-splitting can break quoted groups and spawn bare `npm` (help + exit 1).
const child = spawn(
  process.execPath,
  [
    concurrentlyJs,
    "-n",
    "server,client",
    "-c",
    "blue,green",
    "npm run dev -w server",
    "npm run dev -w client",
  ],
  {
    cwd: root,
    env,
    stdio: "inherit",
    shell: false,
  },
);

child.on("exit", (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0));
});
