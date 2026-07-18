// OCPL PMS — real email delivery via Resend.
// Invoked by the client's notify() for every workflow trigger.
// Secrets: RESEND_API_KEY (required), TEST_EMAIL_TO (test phase: route all mail here),
//          EMAIL_FROM (optional, defaults to Resend's shared test sender).

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TEST_TO = Deno.env.get("TEST_EMAIL_TO");
const FROM = Deno.env.get("EMAIL_FROM") ?? "OCPL PMS <onboarding@resend.dev>";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const { emails } = await req.json();
    const results = [];
    for (const e of (emails ?? [])) {
      const to = TEST_TO || e.to;
      if (!to) { results.push({ ok: false, reason: "no recipient" }); continue; }
      const subject = TEST_TO ? `[TEST → ${e.to}] ${e.subject}` : e.subject;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to, subject, text: e.body }),
      });
      results.push({ to, ok: res.ok, status: res.status });
    }
    return new Response(JSON.stringify({ results }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
