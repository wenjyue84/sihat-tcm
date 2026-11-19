# sihat-listener — Sihat TCM's AI backend on this PC

Always-on bridge between the **Sihat TCM Go app** and the **Claude models on this PC**
(`claude` CLI: `pc opus` / `pc sonnet` / `pc haiku`), replacing the Gemini API.
Same idea as `wa-listener` / `rainbow-listener`: the app sends a request carrying all the context
(patient basic info, 四诊 findings, chat history, report, images), the listener has a Claude model
analyse it and answers in Gemini's wire format — so the Go app changes by **one env var**:

```
AI_BASE_URL=http://127.0.0.1:8788/v1beta/models      # → internal/gemini Client.BaseURL
```

## Model tiers (mirrors the app's model router in `internal/gemini/client.go`)

| App model id | Tier | PC model |
|---|---|---|
| `gemini-3.5-flash` (ModelPro, complex cases) | master | **opus** |
| `gemini-flash-latest` (ModelFlash, standard) | expert | **sonnet** |
| `gemini-3.1-flash-lite` (ModelLite, simple) | physician | **haiku** |
| `pc-opus` / `pc-sonnet` / `pc-haiku` / `opus` … | explicit | that tier |

`SIHAT_LISTENER_MODEL_OVERRIDE=sonnet` forces one tier for everything.

## Run

```
node sihat-listener/listener.mjs              # serve on 127.0.0.1:8788
node sihat-listener/listener.mjs --selftest   # one call per tier, then exit
powershell -File sihat-listener/start.ps1     # detached, logs to sihat-listener/logs/
bash run-local-pc.sh                          # local app on :8081 wired to the listener
```

`GET /healthz` (inflight/queued/served/failed) · `GET /stats` (last 50 calls: tier, ms, ok) ·
every call is appended to `logs/requests.jsonl`.

## Behaviour worth knowing

- **Slow by nature.** A full consult report is ~19k chars: 60–170 s on haiku/sonnet (Gemini: ~8 s). The Go client timeout
  is raised to 300 s when `AI_BASE_URL` is set; the listener times out a model call at 280 s, retries once, then fails loudly.
- JSON mode (`responseMimeType: application/json`) → the listener strips ```` ```json ```` fences/preamble so the app's parser sees bare JSON.
- Images (`inlineData`) are written to a temp dir and the model is told to open them with the `Read` tool (tools: `Read` only, otherwise none).
- Concurrency 3 (`SIHAT_LISTENER_CONCURRENCY`); excess requests queue.
- `SIHAT_LISTENER_FAKE=1` → canned deterministic replies, no model calls: used by the hermetic regression stack.
  Fault hooks in FAKE mode: put `__FAIL_500__`, `__FAIL_429__`, `__EMPTY__` or `__GARBAGE_JSON__` in the user text.
- `SIHAT_LISTENER_TOKEN=…` requires `?key=<token>` (the app sends `GEMINI_API_KEY` as that key) — set it before exposing the listener anywhere but loopback.

## Production reality (read before pointing tcm.wenjyue.com at it)

The Hetzner app cannot reach `127.0.0.1` on this PC. To serve production from the PC you need an authenticated tunnel
(e.g. a Cloudflare Tunnel to a hostname) **and** `SIHAT_LISTENER_TOKEN`; Cloudflare's 100 s proxy timeout will cut long
consult reports unless the stream is kept alive, and the site is then down whenever this PC sleeps. Not configured — the
production default stays Gemini. Today the listener serves: local dev (`run-local-pc.sh`), the ACI/regression runs
(`--ai=pc`), and any future tunnelled setup.

## Tests

`node aci.mjs test --suite=listener` (wire format, tier map, faults, concurrency, temp-file hygiene) and
`node aci.mjs test --suite=journey --ai=pc` (the MAIN workflow on real opus/sonnet/haiku).
