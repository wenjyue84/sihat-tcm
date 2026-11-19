# Baseline → tuned → tuned-r2 (image prompts)

Sources: `runs/baseline/scores.json`, `runs/tuned/scores.json`, `runs/tuned-r2/scores.json`. All three runs use the same rubric, with ai=pc and db=fake. r2 re-ran only the 14 tongue items and face-01, so text cases are not part of this comparison. There is one sample per item. A 1-point move on a single item is noise. Only a shift that repeats across items, or the same item failing the same way in two runs, counts as signal.

The "same 13" rows are tongue-02…14, because baseline refused tongue-01.

## Per-metric

| Metric | Baseline | Tuned | Tuned-r2 | r2 vs baseline |
|---|---|---|---|---|
| Tongue answered | 13/14 | 14/14 | 14/14 | better |
| Features, same 13 | 51/78 (65%) | 54/78 (69%) | **60/78 (77%)** | +9 |
| ├ body colour | 17/26 | 18/26 | **20/26** | +3 |
| ├ coating | 16/26 | 14/26 | **18/26** | +2 (tuned's −2 reversed) |
| └ shape + moisture | 18/26 | 22/26 | **22/26** | +4 |
| Pattern, same 13 (points) | 20/26 | 19/26 | **21/26** | +1 |
| Pattern, same 13 (consistent / partial / inverted) | 8 / 4 / 1 | 9 / 1 / 3 ¹ | 10 / 1 / 2 | inverted +1 (tongue-14) |
| Features, all 14 | 51/84 (61%, refusal = 0) | 59/84 (70%) | 65/84 (77%) | +14 |
| Pattern, all 14 | 20/28 | 20/28 | 23/28 | +3 |
| Face complexion / pattern | 2/2, 2/2 | 0/2, 0/2 (false reject) | **2/2, 2/2** | = |
| Retries / output-contract failures (image) | 0 | 2 (tongue-06 retry, face-01 reject) | 0 | = |
| Image items, summed request time | 1823 s | 3329 s | 2657 s | ~1.5× slower |

¹ tuned/compare.md printed this as "8/2/3". Recounting tuned/scores.json gives 9 consistent (02–08, 11, 12), 1 partial (09) and 3 inverted (10, 13, 14), still 19 points.

## Tuned regressions: were they fixed?

| Item | Baseline | Tuned | r2 | Status |
|---|---|---|---|---|
| tongue-09 coating / pattern | 2 / 2 | 0 / 1 (hallucinated 厚白腻苔) | 2 / 2 ("薄白潤苔…既不黏膩") | **fixed** |
| tongue-10 coating / pattern | 1 / 1 | 0 / 0 | 1 / 1 (peeled areas named, Stomach Yin in primary) | **fixed to baseline level** |
| tongue-04 shape/moisture | 2 | 1 (called dry) | 1 (moist is right, but fissure notches are read as tooth marks) | moisture fixed, new 1-pt shape error (noise) |
| tongue-14 pattern | 1 | 0 | 0 ("未見剝苔或地圖舌…不支持…胃陰不足") | **not fixed**: same failure in two runs |
| face-01 | 2 / 2 | 0 / 0 | 2 / 2 | **fixed** (Method paragraph removed) |

## Every item worse than baseline in r2

| Item | Baseline → r2 | What happened |
|---|---|---|
| tongue-14 | pattern 1 → 0 | A geographic tongue is read as a central thick white greasy coat. Geographic is explicitly denied and Yin deficiency explicitly ruled out, giving Spleen-Damp with Spleen-Kidney Yang. This is the second run in a row with this failure, so it is a real item-level regression, even though the bare-area-first instruction was added specifically for it. |
| tongue-04 | shape/moisture 2 → 1 | The transverse fissures notch the lateral margin, and the model calls this "鋸齒狀齒痕" plus "胖嫩". It hedges this itself (the glove may exaggerate it). One point on one item, so noise. |

Everything else is equal to or better than baseline. tongue-11 keeps the same coating score (1), but its wording drifts toward the forbidden pattern: "中部至根部苔質偏厚…略帶膩感" and "乳頭形態正常" on a tongue with papillary atrophy. Watch it.

## What the r2 changes did not fix (unchanged since baseline)

- **tongue-13 (raspberry tongue)**: 0/1/1/0 in all three runs. The output says "淡紅…屬正常範疇", "無明顯紅刺" and gives 寒濕困脾 with warming formulas. The red body and papillae are plainly visible.
- **tongue-10**: a pale bias with heat explicitly denied ("本案為虛證，非實證或熱證") on a red, glossy B12 tongue.
- **tongue-08**: curd-like thrush is called 膩 instead of 腐, with no paediatric or see-a-doctor note, although milk teeth are visible.
- **Schema**: `status="Using rapid analysis..."` and `potential_issues == pattern_suggestions` in 15/15 outputs. tongue-03's tags are in English.

## Verdict

**KEEP the r2 image prompt.** That means the current `internal/server/prompts_default.go` doctor_image OBSERVATION PROTOCOL (papillae/bare-area check before coating, "say thin or none — do not assume a thick white greasy coating", step-7 "pale, wet, swollen → Yang/Qi deficiency with Dampness" hint removed), together with the current `internal/server/handlers_analysis.go` face/body prompt (Method paragraph removed, which is the baseline face prompt). **Do not revert to the baseline image prompt.**

Reasons:
- r2 beats baseline on every image metric for the same 13 items: features 60 vs 51, coating 18 vs 16, pattern 21 vs 20.
- It keeps tuned's wins: the selfie is answered, black-tongue severity is calibrated, hairy coat is recognised, moisture is better.
- It removes tuned's systematic thick-white-greasy hallucination on tongue-09 and tongue-10, and the face false reject.
- The +9 feature-point gain is spread over 8 items, so it is not a single-item artefact.
- The only item that is worse than baseline beyond noise is tongue-14, and baseline also failed it (coating 0, no geographic named).

Next target, not a revert: red-body and geographic recognition on tongue-10, 13 and 14. Two ideas:
- A colour step that compares the body against the lips and states "red" when the tongue is darker than them. tongue-12 already does this successfully.
- A rule that a white serpiginous border around a red smooth area means a geographic tongue, not a coating.

Before scoring the next change, re-run r2 once more on tongue-04, 11, 13 and 14 to separate noise from signal.
