import { startStack } from "./stack.mjs";
import { runJourney } from "./journey.mjs";
const s = await startStack({ ai: "pc", db: "fake" });
try { const v = await runJourney({ base: s.base, cycles: 2 }); console.log(JSON.stringify(v, null, 1)); } finally { await s.stop(); }
