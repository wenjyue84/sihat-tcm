const ROLES = ["patient", "doctor", "admin", "developer"];
const PW = process.env.TEST_ACCOUNT_PASSWORD || "password123";
export default {
  name: "auth", needs: "stack", mutating: false, costly: false,
  doc: "4-role login + role correctness; bad-password 401; forgot-password enumeration-safe 200; reset bad-token 400",
  async run(t) {
    const h = () => ({ headers: { "X-Forwarded-For": t.ip() } });
    for (const role of ROLES) {
      const { status, json } = await t.postJSON("/api/auth/login", { email: `${role}@sihat.com`, password: PW }, h());
      t.check(`login.${role}`, status === 200 && json?.success === true && json?.role === role, `status=${status} success=${json?.success} role=${json?.role} (want ${role})`);
    }
    const bad = await t.postJSON("/api/auth/login", { email: "patient@sihat.com", password: "wrong-xxxxx" }, h());
    t.check("login.bad_password_401", bad.status === 401, `status=${bad.status} (want 401)`);
    const fk = await t.postJSON("/api/auth/forgot-password", { email: "patient@sihat.com" }, h());
    t.check("forgot.known_200", fk.status === 200 && fk.json?.success === true, `status=${fk.status}`);
    const fu = await t.postJSON("/api/auth/forgot-password", { email: `nobody-${Date.now()}@example.com` }, h());
    t.check("forgot.unknown_200", fu.status === 200 && fu.json?.success === true, `status=${fu.status} (must be enumeration-safe 200)`);
    const rb = await t.postJSON("/api/auth/reset-password", { token_hash: `bogus-${Date.now()}`, password: "abcd1234" }, h());
    t.check("reset.bad_token_400", rb.status === 400, `status=${rb.status} (want 400)`);
  },
};
