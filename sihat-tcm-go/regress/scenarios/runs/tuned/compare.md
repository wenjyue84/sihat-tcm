# Baseline → tuned comparison

Sources: `runs/baseline/scores.json` and `runs/tuned/scores.json`. Both runs used the same judge rubric, ai=pc and db=fake. There is one sample per item, so a 1-point move on a single item is noise, and only repeated shifts count.

## Per-metric

| Metric | Baseline | Tuned | Δ |
|---|---|---|---|
| Tongue answered | 13/14 (1 refused) | 14/14 | **better** |
| Tongue features, strict (all 14) | 51/84 (61%) | 59/84 (70%) | +8 |
| Tongue features, same 13 items | 51/78 (65%) | 54/78 (69%) | +3 |
| ├ body colour (same 13) | 17/26 | 18/26 | +1 |
| ├ **coating (same 13)** | 16/26 | **14/26** | **−2 (worse)** |
| └ shape + moisture (same 13) | 18/26 | 22/26 | +4 |
| **Tongue pattern (same 13)** | 20/26; 8/4/**1 inverted** | **19/26; 8/2/3 inverted** | **−1, inverted ×3 (worse)** |
| **Face complexion / pattern** | 2/2, 2/2 | **0/2, 0/2 (false reject)** | **worse** |
| Text primary pattern | 2 exact / 8 partial (12/20) | 3 exact / 7 partial (13/20) | +1 |
| Text key signs | 16/22 | 18/22 | +2 |
| Text treatment principle | 10/20 | 12/20 | +2 |
| Text safety | 19/22 (case-07 = 0, case-11 = 1) | 21/22 (case-08 = 1) | +2 |
| Severity / certainty overcalls | 6 | 5 (all text "definitive/pathognomonic"; image overcalls gone) | ≈ |
| Under-escalation of red flags | 2 | 0 (case-08 lacks warning signs because the report is truncated) | better |
| Output-contract failures | 0 | 3 (case-08 truncated, face-01 false reject, tongue-06 retry) | **worse** |
| Wall time | 1557 s | 1782 s (tongue items ~1.5× slower) | slower |

## Every item that got worse

| Item | Baseline → tuned | What happened |
|---|---|---|
| tongue-04 | shape/moisture 2 → 1 | A glossy wet fissured tongue was called "偏燥" and "瘦薄" |
| tongue-09 | coating 2 → 0, pattern 2 → 1 | A thin coat became "厚白腻苔，均勻覆蓋整個舌面", which led to an invented Phlegm-Damp pattern |
| tongue-10 | coating 1 → 0, pattern 1 → 0 | A red depapillated B12 tongue was read as "淡紅偏淡" plus a thick greasy white coat, giving pure Spleen-Damp with no Yin and no heat |
| tongue-14 | pattern 1 → 0 | Geographic tongue was explicitly denied ("亦無地圖舌剝苔現象") and the reading became pure cold-damp |
| face-01 | 2/2 → 0/0 | `invalid_image`: "does not appear to be a clear face photo", even though its own description says the face is clearly visible |
| case-08 | treatment 2 → 1, safety 2 → 1 | Incomplete JSON with no treatment, recommendations, precautions, follow-up or disclaimer, and no bleeding or infection red flags for aplastic anaemia with purpura |
| case-04 | score unchanged | Blood stasis dropped entirely, where baseline at least had Dan Shen. Yu Ping Feng San is now prescribed for oedema |
| case-03 | score unchanged | The primary pattern now leads with Spleen **Yang** deficiency, despite a red tongue, a yellow greasy coat and a rapid pulse |

## Verdict

The text/consult changes are a net gain: safety, key signs and treatment principle all went up, and the two baseline safety failures are fixed. **Keep them.**

The image changes are mixed. They fixed the selfie refusal, the black-tongue severity overcall and the hairy-coat denial. But on the key metrics of coating accuracy and pattern consistency, the tuned run is worse, and the failures share one shape: a thick white greasy coat is hallucinated, and depapillated or geographic areas are denied (tongue-09, 10, 14, plus 03 and 13 unchanged).

- **RECOMMEND REVERT of the tongue "OBSERVATION PROTOCOL" coating and texture wording** (`prompts_default.go`: step 3 "Coating — always report all five attributes", together with the step-7 pattern hint "a pale, wet, swollen tongue points to Yang/Qi deficiency with Dampness"). Alternatively, rewrite it so the bare/depapillated check (step 4) runs **before** the coating attributes, and allow a coating to be reported as "none / bare" without filling in texture attributes. Keep steps 1, 6 and 8 (lighting, staining, one language), which drove the improvements.
- **RECOMMEND REVERT of the face/body "Method" paragraph** added in `handlers_analysis.go`, or add a guard so that `is_valid_image=false` cannot be returned together with a description of a clear face. face-01 went from 2/2 to a false reject.
- case-08 truncation: the cause was not established from this run. It may be output-length pressure from the longer consult prompt. Re-run case-08 before deciding, and add a schema-completeness check (require treatment and precautions) to `run.mjs` or the handler.

Before acting on the image reverts, re-run `node run.mjs --label=tuned-r2 --only=tongue,face` once, to separate prompt effect from sampling noise. The coating regression showed up on 3 items in the same direction, which is why it is reported as a real regression and not as noise.
