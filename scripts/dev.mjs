import { spawn } from "node:child_process";

const children = [
  spawn("node", ["server.mjs"], { stdio: "inherit", shell: true }),
  spawn("npx", ["vite", "--host", "127.0.0.1", "--port", "5173"], { stdio: "inherit", shell: true })
];

function shutdown() {
  for (const child of children) child.kill("SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
