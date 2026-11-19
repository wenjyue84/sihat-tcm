# Online-grounded scenario corpus

Real-world-style test material for the diagnosis AI, with ground truth taken from published sources rather than from our own prompts.

| Type | n | Source | Ground truth |
|---|---|---|---|
| `tongue` | 14 | Wikimedia Commons photos (CC0/CC BY/CC BY-SA/PD), each with page URL, licence, author | Western condition from the file page + the typical TCM reading, mapped from cited TCM reference URLs |
| `face` | 1 of 6 planned | Synthetic (HF Z-Image-Turbo, free), no real people; prompt + seed recorded | By construction (intended complexion). 5 are BLOCKED by ZeroGPU quota, see `manifest.json` `face[].status` |
| `text` | 11 | Open-access case reports (PMC), symptoms/tongue/pulse paraphrased | The article's own pattern diagnosis + treatment principle |

`manifest.json` is the index (all licences, authors, prompts, seeds, URLs). `cases/*.json` hold the exact `/api/consult` body the wizard sends.
Weakness flags: `ground_truth_strength` on text cases; face-01's pallor is subtle; keyword groups are a crude lexical signal only.

## Run

```
node run.mjs --label=baseline                 # real PC models (sihat-listener -> claude opus/sonnet/haiku), fake DB, ACI_PORT_OFFSET=300 default
node run.mjs --label=after-fix --only=tongue  # ids, id prefixes or types, comma separated
node run.mjs --label=smoke --ai=fake          # canned replies: plumbing check, zero model cost
```

Outputs: `runs/<label>/<id>.json` (raw model output, attempts, expected truth, keyword check) and `runs/<label>/_summary.json`.
Concurrency is capped at 3, 429 / 5xx / malformed-JSON responses are retried with back-off, nothing is faked: if the `--ai=pc` stack cannot start
the run prints `BLOCKED: <reason>` and exits 3. Never touches OpenRouter or production; the AI is only the local `sihat-listener`.

Endpoints mirror `static/js/wizard.js`: `/api/analyze-image` `{image: dataURL, type}` and `/api/consult` `{data:{basic_info,wen_inquiry,wang_tongue,wang_face,wen_audio,qie}, language}`.

## Rebuilding the corpus

`_fetch-tongues.mjs` (Commons download, `ii.json` = imageinfo dump), `_build-manifest.mjs` (ground truth + cases), `_epmc*.mjs` (Europe PMC full-text probes used to read the case reports).
Re-run `node _build-manifest.mjs` after editing expectations. To finish the faces: generate the missing portraits (seeds 1102-1106 in the manifest), save under `images/`, set `file`/`generated` in `_build-manifest.mjs`.
