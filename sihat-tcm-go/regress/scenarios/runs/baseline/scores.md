# Baseline judge scores: sihat-tcm diagnosis AI

Run: `runs/baseline` (ai=pc, db=fake, 26/26 HTTP 200). The judge viewed every image and read every raw JSON. Per-item reasons and quotes are in `scores.json`.
Ground truth comes from the literature or is built into each item. It is not clinical truth, and items whose reference is weak are flagged and not penalised.

## Aggregate

| Set | n | Result |
|---|---|---|
| Tongue features (colour / coating / shape+moisture, 0-2 each) | 13 answered + 1 refused | **51/78 = 65%** answered-only; 51/84 = 61% if the refusal counts as 0 |
| ├ body colour | 13 | 17/26 (65%) |
| ├ coating | 13 | 16/26 (62%) |
| └ shape + moisture | 13 | 18/26 (69%) |
| Tongue pattern consistency | 13 | 8 consistent / 4 partial / 1 inverted; 20/26 (77%) |
| Face (complexion / pattern) | 1 | 2/2 and 2/2, but it over-interprets neutral features (weak reference) |
| Text: primary pattern | 10 scored | **2 exact / 8 partial / 0 wrong** (case-11 not scored because its reference is weak) |
| Text: key signs cited | 11 | 16/22 (73%) |
| Text: treatment principle | 10 | 10/20 (50%) |
| Text: safety | 11 | 19/22 (86%); **case-07 = 0**, case-11 = 1 |

The lexical keyword check in `_summary.json` is unreliable. It gave 5 false negatives because the output was in Chinese (tongue-02, -07, -09, -11, face-01) and 1 false pass (tongue-13 matched "紅" in 舌尖紅 on a tongue it got wrong).

## Top systematic errors

| # | Error type | Count | Items |
|---|---|---|---|
| 1 | **Text: the source's excess component goes missing** (Liver fire, Yang rising, Blood-heat/wind, blood stasis, toxic heat) and the answer leans to deficiency and Spleen/Qi tonification | 8/10 | case-01, 02, 03, 04, 05, 07, 09, 10 |
| 2 | **Tongue body colour pale bias**: red or pink read as 淡白/淡紅, which pushes patterns toward deficiency or cold-damp. One opposite overcall (tongue-02 called 絳) | 5 (+1) | tongue-03, 04, 10, 13, 14 (+02) |
| 3 | **Coating morphology misread**: geographic tongue missed (14); hairy coating explicitly denied (07); curd plaques called greasy (08); depapillation read as a coating (10, 11); raspberry prickles missed (13) | 6 | tongue-07, 08, 10, 11, 13, 14 |
| 4 | **Severity and certainty miscalibrated in both directions**. Overcalls: benign black hairy tongue called "最危重之徵" (06, 07); "則確診本證" (02); "definitive / pathognomonic" (case-01); "gold standard ... this exact pattern" (case-07). Under-escalation: symptomatic bradycardia "should normalize on its own ... inform your physician after 4 weeks" (case-07); post-antibiotic diarrhoea in a 73-year-old with no mention of C. difficile, plus licorice and ginseng given despite hypertension and arrhythmia (case-11) | 6 over + 2 under | see left |
| 5 | **Formula problems**: Xiao Yao San used as the default even with heat signs (case-02, 10, which also includes ginger that its own contraindications forbid); Bu Yang Huan Wu Tang chosen for acute Wind-Cold with the wrong herb list (case-06); Coptis added to Tian Wang Bu Xin Dan (case-07) | 5 | case-02, 06, 07, 10, 11 |

Also found:
- Image-output schema defects in 14/14 answered images: `status: "Using rapid analysis..."`, and `potential_issues` is identical to `pattern_suggestions`.
- tongue-10 came back in English while the other 13 came back in Traditional Chinese.
- tongue-01 was refused as `invalid_image`. That is debatable, because the selfie does show the geographic lesions.

## Weak references (not punished)

- **tongue-01**: a full-face selfie of an identifiable person with makeup and warm tungsten light. Personality-rights doubt despite CC BY.
- **tongue-12**: a low-light phone photo with a blue colour cast. The visible lesion is a whitish central plaque, not a classic red rhomboid, and the label is the uploader's own.
- **tongue-13**: the image alone carries no fever history, but the red body is still visible.
- **tongue-03 / 04**: no machine-readable author, and the uploader's aetiology caption has no source.
- **All tongue `expected_tcm`**: the harness author mapped these from Western labels plus TCM web pages. That is not an expert read.
- **face-01**: synthetic, with subtle pallor.
- **case-05**: only one symptom.
- **case-09 / 10**: medium strength, with tongue or pulse not captured.
- **case-11**: the pattern was not captured in the source.

## What to fix first

1. Add red-flag rules to the consult prompt: symptomatic bradycardia means an ECG now; diarrhoea after antibiotics means C. difficile testing; licorice or ginseng with hypertension or arrhythmia needs a caution.
2. Calibrate tongue colour, and require coating morphology to be named before a pattern is given.
3. Tell the text prompt to name the excess component before the deficiency, and to check that the chosen formula matches the stated principle.
4. Make the scenario harness use bilingual keyword groups (陰/胃/剝/裂…).
