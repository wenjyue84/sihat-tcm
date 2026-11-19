#!/usr/bin/env node
// serve.mjs — boot the hermetic stack and keep it up (for manual poking / browser tests).
//   node regress/serve.mjs [--ai=fake|pc] [--db=fake]      (ports shift with ACI_PORT_OFFSET)
// Prints one JSON line {base, dbBase, aiBase, pids} on stdout, then waits until stdin closes or SIGINT.
import { startStack } from "./stack.mjs";
const f = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=")[1] : d; };
const s = await startStack({ ai: f("ai", "fake"), db: f("db", "fake") });
console.log(JSON.stringify({ base: s.base, dbBase: s.dbBase, aiBase: s.aiBase, pids: s.pids }));
const bye = async () => { await s.stop(); process.exit(0); };
process.on("SIGINT", bye); process.on("SIGTERM", bye); process.stdin.on("end", bye); process.stdin.resume();
