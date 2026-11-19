# Tuned-run judge scores: sihat-tcm diagnosis AI

Run: `runs/tuned` (ai=pc, db=fake, 26/26 HTTP 200, 1782 s). The judge viewed the images and read every raw or parsed JSON, using the same rubric as `runs/baseline/scores.md`. Per-item quotes and reasons are in `scores.json`.

Change under test: uncommitted prompt edits saved at 10:24 local.
- `prompts_default.go` adds the consult "CLINICAL REASONING DISCIPLINE" steps 1-5, new tongue-validation wording and the tongue "OBSERVATION PROTOCOL" steps 1-8.
- `handlers_analysis.go` rewrites the wording of the tongue `analysis_tags` and `observation` fields and adds a "Method" paragraph to the face/body prompt.

Caveat: there is one sample per item per run. A 1-point move on a single item is within noise. Only errors that repeat across three or more items count as signal.

## Aggregate

| Set | n | Result |
|---|---|---|
| Tongue features (colour / coating / shape+moisture) | 14 answered, 0 refused | **59/84 = 70%** (the same 13 items as baseline: 54/78 = 69%) |
| ├ body colour | 14 | 20/28 (71%) |
| ├ coating | 14 | **15/28 (54%)** |
| └ shape + moisture | 14 | 24/28 (86%) |
| Tongue pattern consistency | 14 | 9 consistent / 2 partial / **3 inverted**; 20/28 (71%) |
| Face | 1 | **0/2, 0/2**: false `invalid_image`, although its own description says "額頭、雙眼…均清晰可見" |
| Text: primary pattern | 10 scored | **3 exact / 7 partial / 0 wrong** (13/20) |
| Text: key signs | 11 | 18/22 (82%) |
| Text: treatment principle | 10 | 12/20 (60%) |
| Text: safety | 11 | **21/22 (95%)**; case-08 = 1 (incomplete report) |

## Top systematic error types

| # | Error type | Count | Items |
|---|---|---|---|
| 1 | **Coating template collapse.** The output defaults to "thick white greasy coat on a pale swollen tongue, so Spleen deficiency with Damp", even on tongues that are red, depapillated or geographic | 5 | tongue-03, 09, 10, 13, 14 |
| 2 | **Depapillation or geographic patches read as coating, or explicitly denied**: "亦無地圖舌剝苔現象" (14), "無明顯芒刺" (13), "未見明顯光滑無苔之剝落區塊" (11). This happens despite protocol step 4 | 5 | tongue-03, 10, 11, 13, 14 |
| 3 | **Text: the excess component is still missing or demoted** (Liver Fire, Blood-Heat/Wind, Blood stasis, toxic Heat, Wind-phlegm) | 7/10 | case-02, 03, 04, 05, 07, 09, 10 |
| 4 | **Certainty overclaims survive the Step-4 ban**: "definitive for Kidney Yin deficiency", "pathognomonic for…" | 5 | case-01, 02, 03, 05, 10 |
| 5 | **Formula problems**: Xiao Yao San is still the default (case-10); TWBXD composition is altered without labelling (case-07); Yu Ping Feng San is used for oedema (case-04); a cloying tonic is given for phlegm-damp (case-05); a "classical formula for Bell's palsy" is invented (case-06); Spleen-Yang warming and ginger are given in a Liver-heat case (case-02) | 6 | see left |

Also found:
- Pale bias persists in 4 items (tongue-04, 10, 13, 14).
- **Output-contract failures**:
  - case-08 returned only diagnosis/analysis, with no treatment, precautions or follow-up, for a 74-year-old with aplastic anaemia.
  - face-01 was falsely rejected.
  - tongue-06 needed a retry.
  - In 14/14 tongue outputs, `status` is still "Using rapid analysis..." and `potential_issues` is identical to `pattern_suggestions`.

## What clearly improved
- tongue-01 (a selfie) is now analysed instead of being refused.
- The black-tongue severity overcalls are gone, and tongue-07 now recognises the hairy coat.
- tongue-05's primary pattern is now built on the dominant sign.
- Text safety: case-07 now requires an ECG before herbs. case-11 now names C. difficile and substitutes Dang Shen for ginseng.
- case-01 now names Yang rising and picks the source's own formula. case-06 now releases the exterior first.

## Weak references (not penalised)
These are the same as in baseline: tongue-01 (identifiable selfie), tongue-12 (blue-cast child, uploader-only label), face-01 (synthetic, subtle pallor), case-05 (one symptom), case-09/10 (medium), and case-11 (pattern not captured).
