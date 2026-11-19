import { runJourney } from "../journey.mjs";
export default {
  name: "journey", needs: "stack", mutating: true, costly: true,
  doc: "MAIN workflow x N cycles (ACI_CYCLES, default 2): unregistered patient -> report -> register -> registered consult -> doctor connect -> reply; plus admin/developer/stranger interfaces",
  async run(t) {
    const cycles = parseInt(process.env.ACI_CYCLES || "2", 10);
    const v = await runJourney({ base: t.base, cycles, nDoctors: 2 });
    for (const c of v.checks) t.check(c.label, c.ok, c.detail);
    t.check("all_journey_checks", v.ok, `${v.failed} of ${v.total} journey checks failed`);
    t.elog(`  (journey: ${v.passed}/${v.total} individual checks, ${cycles} cycle(s), run ${v.run})`);
  },
};
