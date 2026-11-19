// Builds manifest.json + cases/*.json from tongue-src.json (Wikimedia imageinfo captured by _fetch-tongues.mjs) and the
// hand-written ground truth below. Re-run after editing: node _build-manifest.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const src = JSON.parse(readFileSync("tongue-src.json", "utf8"));
const byTitle = Object.fromEntries(src.map((s) => [s.title.replace(/^File:/, ""), s]));

const REF = {
  dalberto: "https://www.attiliodalberto.com/traditional-chinese-medicine/tongue-diagnosis.php",
  teeth: "https://www.meandqi.com/knowledge-base/conditions/teeth-marked-tongue",
  cracked: "https://www.meandqi.com/knowledge-base/conditions/cracked-tongue",
  pale: "https://www.meandqi.com/knowledge-base/conditions/pale-tongue",
  red: "https://www.meandqi.com/knowledge-base/conditions/red-tongue",
  yellow: "https://www.meandqi.com/knowledge-base/conditions/yellow-tongue-coating",
  white: "https://www.meandqi.com/knowledge-base/conditions/white-tongue-coating",
  swollen: "https://www.meandqi.com/knowledge-base/conditions/swollen-tongue",
  purple: "https://www.meandqi.com/knowledge-base/conditions/purple-tongue",
  bht: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10615480/",
  wiki: "https://en.wikipedia.org/wiki/Tongue_diagnosis",
};

// condition = what the photo documents per its Commons description / Wikipedia (Western label, NOT a TCM verdict).
// expect = what a competent TCM reader should note; kw = lower-case keyword groups, a group matches if ANY term appears
// in the model output (crude regression signal only, not a clinical score).
const T = [
  { key: "Geographic tongue (benign migratory glossitis) – adult female.jpg", condition: "geographic tongue (benign migratory glossitis)", wiki: "https://en.wikipedia.org/wiki/Geographic_tongue",
    expect: { body_colour: "red to light red with irregular smooth red patches", coating: "patchy, map-like loss of coating (peeled/geographic) with whitish borders", thickness: "thin to absent in patches", shape: "normal size, map-like patches", moisture: "moist to slightly dry", pattern: "Stomach Yin deficiency (peeled/geographic coating), possibly Spleen-Stomach Qi/Yin deficiency with heat" },
    refs: [REF.dalberto, REF.cracked], kw: [["peel", "geographic", "map", "patch", "partial coat", "missing coat", "absent coat"], ["yin", "stomach"]] },
  { key: "Geographic tongue 01.JPG", condition: "geographic tongue", wiki: "https://en.wikipedia.org/wiki/Geographic_tongue",
    expect: { body_colour: "red / light red", coating: "patchy peeled areas, white margins", thickness: "thin, uneven", shape: "irregular map-like patches", moisture: "moist", pattern: "Stomach Yin deficiency / peeled coating" },
    refs: [REF.dalberto], kw: [["peel", "geographic", "map", "patch", "uneven"], ["yin", "stomach"]] },
  { key: "Fissured geographic tongue.jpg", condition: "fissured and geographic tongue (uploader notes possible B12 deficiency / oral bacteria)", wiki: "https://en.wikipedia.org/wiki/Fissured_tongue",
    expect: { body_colour: "red to pink", coating: "patchy/peeled with white coating islands", thickness: "thin, uneven", shape: "multiple fissures/cracks plus map-like patches", moisture: "moist to slightly dry", pattern: "Yin deficiency (Stomach/Kidney) with or without Spleen Qi weakness; cracks = Yin/Blood deficiency" },
    refs: [REF.cracked, REF.dalberto], kw: [["crack", "fissur"], ["yin", "deficien"]] },
  { key: "Fissured tongue.jpg", condition: "fissured tongue (own work, Commons)", wiki: "https://en.wikipedia.org/wiki/Fissured_tongue",
    expect: { body_colour: "pink-red", coating: "thin white, partly sparse", thickness: "thin", shape: "deep central and transverse fissures", moisture: "moist", pattern: "Yin or Blood deficiency, or Spleen Qi deficiency with dampness (shallow central cracks); often asymptomatic" },
    refs: [REF.cracked], kw: [["crack", "fissur"], ["yin", "blood", "spleen", "qi"]] },
  { key: "Fissured Tongue.JPG", condition: "fissured tongue", wiki: "https://en.wikipedia.org/wiki/Fissured_tongue",
    expect: { body_colour: "light red", coating: "thin white", thickness: "thin", shape: "central deep fissure with side cracks", moisture: "moist", pattern: "Yin/Blood deficiency or Spleen Qi deficiency (cracks)" },
    refs: [REF.cracked], kw: [["crack", "fissur"], ["yin", "blood", "spleen", "qi"]] },
  { key: "Black hairy tounge.jpg", condition: "black hairy tongue (lingua villosa nigra)", wiki: "https://en.wikipedia.org/wiki/Black_hairy_tongue",
    expect: { body_colour: "hard to judge under dark coating (reported light red in a TCM case)", coating: "black/dark brown, thick, hair-like", thickness: "thick", shape: "elongated filiform papillae", moisture: "moist or dry", pattern: "heat or cold-damp accumulation in Stomach/Spleen (grey-black coating = extreme interior heat if dry, extreme cold if moist); stains from coffee/antibiotics must be considered" },
    refs: [REF.bht, REF.dalberto], kw: [["black", "dark", "brown"], ["thick", "heat", "damp", "stomach", "spleen"]] },
  { key: "Black tongue.jpg", condition: "black tongue (public domain, en.wikipedia)", wiki: "https://en.wikipedia.org/wiki/Black_hairy_tongue",
    expect: { body_colour: "obscured by coating", coating: "black / dark-brown", thickness: "thick", shape: "coated dorsum", moisture: "moist or dry", pattern: "extreme interior heat (dry) or extreme cold (moist); Stomach/Spleen disharmony" },
    refs: [REF.bht, REF.dalberto], kw: [["black", "dark", "brown"], ["heat", "cold", "damp", "stomach", "spleen"]] },
  { key: "Human tongue infected with oral candidiasis.jpg", condition: "oral candidiasis (thrush) in a child after antibiotics", wiki: "https://en.wikipedia.org/wiki/Oral_candidiasis",
    expect: { body_colour: "pink-red beneath the plaques", coating: "thick white curd-like plaques", thickness: "thick", shape: "coated dorsum, plaques", moisture: "moist/greasy", pattern: "Damp-Heat or Phlegm-Damp in Spleen/Stomach (thick white greasy/curd coating); child with Spleen Qi weakness after antibiotics" },
    refs: [REF.white, REF.yellow], kw: [["white"], ["thick", "greasy", "curd", "damp", "phlegm", "spleen"]] },
  { key: "Glossitis in Iron-deficiency Anaemia, a Thai female patient (2025).jpg", condition: "glossitis in iron-deficiency anaemia (enlarged, pale/smooth tongue)", wiki: "https://en.wikipedia.org/wiki/Glossitis",
    expect: { body_colour: "pale (to pale-red)", coating: "thin/scanty to absent", thickness: "thin", shape: "swollen/enlarged, possibly smooth with loss of papillae, tooth marks", moisture: "moist", pattern: "Blood deficiency with Spleen Qi deficiency (pale + swollen); Qi/Blood deficiency" },
    refs: [REF.pale, REF.swollen], kw: [["pale"], ["blood", "qi", "spleen", "deficien"]] },
  { key: "Image of the tongue in a B12-deficient patient without a history of gastrectomy.webp", condition: "vitamin B12 deficiency glossitis (erythema, depapillation: smooth red tongue)", wiki: "https://en.wikipedia.org/wiki/Glossitis",
    expect: { body_colour: "red (bright/crimson)", coating: "little or none (peeled / mirror-like)", thickness: "absent", shape: "smooth, depapillated", moisture: "dry or shiny", pattern: "Yin deficiency with empty heat (red, no coating); Stomach/Kidney Yin deficiency; Blood deficiency" },
    refs: [REF.red, REF.dalberto], kw: [["red"], ["no coat", "little coat", "peel", "smooth", "mirror", "depapill", "scanty", "absent"], ["yin"]] },
  { key: "Macroglossia with crenations along the margins and loss of papillae on dorsum surface of the tongue.png", condition: "macroglossia with scalloped (crenated) margins and papillary atrophy", wiki: "https://en.wikipedia.org/wiki/Macroglossia",
    expect: { body_colour: "pale to pale-red", coating: "thin / reduced", thickness: "thin", shape: "enlarged with scalloped, tooth-marked edges", moisture: "moist/wet", pattern: "Spleen Qi deficiency with Dampness; Kidney/Spleen Yang deficiency in the elderly" },
    refs: [REF.teeth, REF.swollen], kw: [["scallop", "tooth", "teeth", "crenat", "swollen", "enlarg"], ["spleen", "damp", "qi"]] },
  { key: "Median Glossitis.jpg", condition: "median rhomboid glossitis in a 9-year-old", wiki: "https://en.wikipedia.org/wiki/Median_rhomboid_glossitis",
    expect: { body_colour: "red central patch", coating: "absent over a central rhomboid area, coating elsewhere", thickness: "thin", shape: "central depapillated rhomboid patch on the midline", moisture: "moist", pattern: "Heat in Heart/Stomach or Stomach Yin deficiency (central area = Spleen/Stomach zone); central peeled coating" },
    refs: [REF.dalberto, REF.cracked], kw: [["central", "middle", "midline", "rhomb", "patch", "peel"], ["stomach", "spleen", "heat", "yin"]] },
  { key: "Scharlach.JPG", condition: "raspberry/strawberry tongue in late scarlet fever (red with white surface remnants)", wiki: "https://en.wikipedia.org/wiki/Scarlet_fever",
    expect: { body_colour: "crimson / bright red with prominent red papillae (prickles)", coating: "white coating remnants peeling away", thickness: "thin to peeling", shape: "swollen red papillae (raspberry)", moisture: "moist to dry", pattern: "Heat entering Ying/Blood level (warm-febrile disease), Excess Heat; red prickly tongue" },
    refs: [REF.red, REF.dalberto], kw: [["red", "crimson", "scarlet"], ["heat", "fire"]] },
  { key: "Human geographic tongue.jpg", condition: "geographic tongue (en.wikipedia upload)", wiki: "https://en.wikipedia.org/wiki/Geographic_tongue",
    expect: { body_colour: "red / pink with red depapillated patches", coating: "patchy white", thickness: "thin, uneven", shape: "map-like patches", moisture: "moist", pattern: "Stomach Yin deficiency (peeled coating)" },
    refs: [REF.dalberto], kw: [["peel", "geographic", "map", "patch"], ["yin", "stomach"]] },
];

const tongues = T.map((t, i) => {
  const s = byTitle[t.key];
  if (!s) throw new Error("missing source for " + t.key);
  return {
    id: "tongue-" + String(i + 1).padStart(2, "0"), type: "tongue", file: "images/" + s.file, content_type: s.contentType,
    source_page: s.source_page, licence: s.licence, licence_url: s.licence_url, author: s.author,
    commons_description: s.description, documented_condition: t.condition, condition_reference: t.wiki,
    expected_tcm: t.expect, tcm_reference_urls: t.refs, expect_keyword_groups: t.kw,
    note: "documented_condition is the Western label from the file page; expected_tcm is the typical TCM reading of that appearance, mapped from the cited references (not a clinical diagnosis).",
    image_size: s.thumb_size,
  };
});

const faces = [
  { id: "face-01", file: "images/face-pale-s1101.webp", generated: true, seed: 1101, prompt: "Studio portrait photograph of an adult East Asian woman, frontal view, neutral expression, soft even daylight, plain light-grey background, noticeably pale white complexion with bloodless pallor, dull lips, no makeup, realistic skin texture, medical documentation style", model: "HF mcp-tools/Z-Image-Turbo, 896x1152, 8 steps", intended_complexion: "pale / white (淡白)", expected_tcm: { complexion: "pale white", pattern: "Qi/Blood deficiency, Yang deficiency or cold", note: "WEAK ground truth: the generated pallor is subtle (a fairly ordinary fair complexion); treat a 'normal' reading as acceptable" }, expect_keyword_groups: [["pale", "pallid", "white", "light", "fair"]] },
  ...[
    [2, 1102, "sallow yellow (萎黄)", "Spleen Qi deficiency / Damp (sallow) ", "adult East Asian man, sallow yellowish complexion, dull waxy yellow skin tone"],
    [3, 1103, "flushed red cheeks (颧红/面红)", "Yin deficiency with empty heat (malar flush) or Excess Heat (whole face red)", "adult East Asian woman, flushed red cheeks with a bright red malar flush"],
    [4, 1104, "dark under-eye / blackish (黧黑)", "Kidney deficiency, Blood stasis or Phlegm-fluid retention", "adult East Asian man, tired, dark blackish circles under the eyes, dusky dark grey-brown complexion"],
    [5, 1105, "bluish-purple lips (青紫)", "Blood stasis / Cold / Heart Yang-Qi deficiency", "adult East Asian woman, bluish-purple cyanotic lips, slightly bluish-purple complexion, no lipstick"],
    [6, 1106, "normal rosy-yellow (红黄隐隐)", "Healthy complexion (control)", "healthy adult East Asian man, normal healthy rosy-yellow complexion, moist lustrous skin, pink lips"],
  ].map(([n, seed, c, p, d]) => ({ id: "face-0" + n, file: null, generated: false, status: "BLOCKED: HF ZeroGPU free quota exhausted (error: 'ZeroGPU quota exceeded: 60s requested vs. 0s left') after face-01; rerun when quota resets, then drop the file at images/face-<slug>-s" + seed + ".webp and set file/generated", seed, prompt_template: "Studio portrait photograph of a(n) " + d + ", frontal view, neutral expression, soft even daylight, plain light-grey background, realistic skin texture, medical documentation style", model: "HF mcp-tools/Z-Image-Turbo, 896x1152, 8 steps", intended_complexion: c, expected_tcm: { complexion: c, pattern: p }, expect_keyword_groups: [] })),
];

// ---- text cases: paraphrased from open-access case reports (Europe PMC full text read this session) ----
const C = [
  { id: "case-01", pmcid: "PMC8137033", license: "CC BY 4.0", journal: "A combination of herbal formulas, acupuncture, and novel pine-needle stimulation for recurrent alopecia areata", age: 34, sex: "male",
    chief: "Sudden patchy hair loss on top of the head (alopecia areata), recurrence after a stressful period at work.",
    symptoms: ["face redness", "sleeps under six hours a night", "thirst", "hot flashes", "excessive sweating", "rage/irritability after months of work stress", "tight abdomen with fullness in chest and rib-sides"],
    tongue: "red tongue body, stasis at the edges, thin yellow coating", pulse: "wiry/string-like and slippery; sunken and weak at the cubit (rear) position",
    pattern: "Liver Qi stagnation with Liver Yang rising", principle: "Soothe the Liver and release constraint, calm rising Yang (Kampo: saikokaryukotsuboreito; blood stasis addressed later); acupuncture added",
    kw: [["liver"], ["qi stagnation", "stagnation", "constrain", "depress"]], chips: ["insomnia"], pulse_chips: ["wiry", "slippery"] },
  { id: "case-02", pmcid: "PMC3921614", license: "not stated in Europe PMC metadata (open-access full text)", journal: "A Single Case Study: Treating Migraine Headache With Acupuncture, Chinese Herbs, and Diet", age: 32, sex: "female",
    chief: "Ten-year history of disabling migraines, one-sided, about once a week.",
    symptoms: ["sharp pain mostly on the right side of the head", "dizziness with a heavy-head feeling", "nausea and weekly vomiting", "irritability, prone to stress and anxiety", "irregular periods", "constipation with straining", "cold hands and feet but warm midsection", "sinus congestion and allergies"],
    tongue: "slightly red, swollen and scalloped, thin yellow coating; sublingual veins dark and full", pulse: "slippery on both sides; left wiry with a stronger middle (guan) position",
    pattern: "Flaring Liver Fire with accumulation of Damp-Phlegm (Liver Yang rising ruled out)", principle: "Reduce Liver Fire, eliminate dampness, resolve phlegm and stop pain",
    kw: [["liver"], ["fire", "heat", "yang"]], chips: ["headache", "anxiety", "digestive", "cold-limbs"], pulse_chips: ["slippery", "wiry"] },
  { id: "case-03", pmcid: "PMC12599627", license: "CC BY", journal: "Treating steroid-dependent psoriasis from the blood-heat syndrome perspective: A case report", age: 68, sex: "male",
    chief: "Twenty years of recurrent scaly red rash over the whole body with severe itching, worse in the last week.",
    symptoms: ["sticky feeling in the mouth", "poor appetite", "fatigue", "heavy body sensation", "sticky stools with incomplete evacuation", "yellowish exudate and crusting on skin", "itching disturbing sleep"],
    tongue: "red with yellow greasy coating", pulse: "slippery and rapid",
    pattern: "Blood-Heat with Damp-Heat (dampness-wind) accumulation", principle: "Cool the Blood and resolve toxin, clear heat and dry dampness, dispel wind",
    kw: [["damp"], ["heat"]], chips: ["digestive", "fatigue", "insomnia"], pulse_chips: ["slippery", "rapid"] },
  { id: "case-04", pmcid: "PMC9771247", license: "CC BY", journal: "The effect of dilated cardiomyopathy with moyamoya disease in a 31-year-old Chinese man: A case report", age: 31, sex: "male",
    chief: "Four days of episodic chest tightness and shortness of breath.",
    symptoms: ["palpitations", "fatigue after activity", "swelling of both lower legs", "slightly low spirit"],
    tongue: "red tongue with thin coating", pulse: "weak / sluggish (as reported after treatment); not described precisely at admission",
    pattern: "Qi deficiency with Blood stasis (Heart Yang/Qi lacking; water-damp overflowing as edema)", principle: "Invigorate the Heart and tonify Qi, promote blood circulation and remove stasis, with fluid-draining herbs (astragalus, codonopsis, poria, polyporus, angelica, chuanxiong)",
    kw: [["qi"], ["blood stasis", "stasis", "stagnation"]], chips: ["shortness-breath", "palpitations", "fatigue"], pulse_chips: ["weak"] },
  { id: "case-05", pmcid: "PMC13538104", license: "CC BY", journal: "Staged TCM treatment for suspected pulmonary inflammatory pseudotumor: a case report", age: 55, sex: "male",
    chief: "Intermittent dry cough since an upper respiratory infection; imaging showed a 3-cm lung mass the patient chose not to operate on.",
    symptoms: ["dry cough", "no other major complaints recorded in the summary"],
    tongue: "enlarged with teeth marks, pale-red body, white coating; sublingual veins distended later", pulse: "deep (later deep and thready)",
    pattern: "Phlegm-dampness (Spleen weakness) with wind-phlegm obstructing the Lung, later phlegm plus blood stasis", principle: "Disperse wind, ventilate the Lung, resolve phlegm and relieve cough; later resolve phlegm, soften masses, move blood and support healthy Qi",
    kw: [["phlegm", "damp"], ["lung", "spleen"]], chips: ["shortness-breath"], pulse_chips: ["deep", "thready"] },
  { id: "case-06", pmcid: "PMC11046358", license: "CC BY", journal: "Treatment of Peripheral Facial Paralysis After COVID-19 Infection With TCM Therapies: A Case Report", age: 23, sex: "male",
    chief: "Right-sided facial numbness, asymmetry and ear pain for five days after COVID-19 (House-Brackmann grade IV facial palsy).",
    symptoms: ["numbness of the right face", "facial droop", "ear pain on the right side"],
    tongue: "pale tongue with white fur", pulse: "floating and tense (tight)",
    pattern: "Wind-Cold (with phlegm) obstructing the channels at the acute stage", principle: "Expel wind and disperse cold, resolve phlegm and unblock the channels/collaterals (acupuncture, herbs; syndrome changes by stage)",
    kw: [["wind"], ["cold"]], chips: ["headache"], pulse_chips: ["floating"] },
  { id: "case-07", pmcid: "PMC6531189", license: "CC BY-NC-ND", journal: "Chinese patent medicine to treat a 32-year-old man with sinus bradycardia and cardiac sinus arrests", age: 32, sex: "male",
    chief: "Slow heart rate found at a check-up, with occasional palpitation and shortness of breath after two months of staying up late; difficulty falling asleep.",
    symptoms: ["occasional palpitations", "shortness of breath", "difficulty falling asleep after two months of late nights", "later constipation"],
    tongue: "puffy and red with cracks, thin yellow fur", pulse: "weak and deep",
    pattern: "Qi and Yin deficiency with Blood stasis (palpitation, 心悸)", principle: "Benefit Qi, nourish Yin and activate blood circulation, with warming Yang; Zhibai Dihuang pill later added",
    kw: [["yin", "qi"], ["deficien"]], chips: ["palpitations", "shortness-breath", "insomnia"], pulse_chips: ["weak", "deep"] },
  { id: "case-08", pmcid: "PMC2840555", license: "CC BY-NC", journal: "Treatment for intractable anemia with the traditional Chinese medicines Hominis Placenta and Cervi Cornus Colla (case 1)", age: 74, sex: "female",
    chief: "Acquired aplastic anemia with low platelets and haemoglobin not responding to conventional care; fatigue.",
    symptoms: ["marked fatigue", "appetite loss and severe constipation (side effects)", "purpura", "cold feeling below the ankles", "hot palms and sweaty soles", "insomnia with many dreams", "pale complexion", "moon-shaped face"],
    tongue: "blue-pale body with dark sublingual veins", pulse: "slippery, fine and weak",
    pattern: "Spleen Qi deficiency with Blood deficiency, Yin and Yang deficiency, dampness, phlegm and blood stasis (treated with modified Gui Pi Tang)", principle: "Tonify Spleen, Heart, Lung and Kidney Qi; nourish Blood; warm Kidney and expel cold; invigorate blood",
    kw: [["spleen"], ["blood", "qi"]], chips: ["fatigue", "digestive", "insomnia", "cold-limbs"], pulse_chips: ["thready", "weak", "slippery"] },
  { id: "case-09", pmcid: "PMC11709150", license: "CC BY", journal: "Lung cancer palindromia due to the deficiency of vital energy and blood syndrome treated by TCM herbs: A case report", age: 57, sex: "female",
    chief: "Half a year of chest pain and fatigue; lung nodules found and later a recurrence in the other lung after surgery.",
    symptoms: ["chest pain", "fatigue", "good appetite, sleep and mood noted at first visit"],
    tongue: "not captured in the portion read", pulse: "not captured in the portion read",
    pattern: "Qi and Blood deficiency (deficiency of vital energy and blood)", principle: "Tonify healthy Qi and Blood, attack evil and remove blood stasis; supplement Qi, nourish Yin, moisten the Lung",
    kw: [["qi"], ["blood"], ["deficien"]], chips: ["fatigue"], pulse_chips: [] },
  { id: "case-10", pmcid: "PMC11608678", license: "CC BY", journal: "Chinese medicine as comprehensive therapy for psoriasis: A case report", age: 32, sex: "male",
    chief: "About one year of increased dandruff and recurrent red scaly patches on face, trunk and limbs, making him feel inferior and low.",
    symptoms: ["crimson plaques with dry itchy desquamation", "itching that moves around the body", "under heavy physical and psychological stress", "limbs and abdomen cooler than normal while the upper body runs hot"],
    tongue: "rather red with teeth marks", pulse: "pulse signs considered but exact quality not captured in the portion read",
    pattern: "Yin-Yang imbalance (Yang floating upward), excessive toxic Heat, pathogenic Wind", principle: "Settle the floating Yang and clear toxic heat, expel wind (herbal therapy exclusively after stopping biologics)",
    kw: [["heat"], ["wind", "yin", "yang"]], chips: ["anxiety"], pulse_chips: [] },
  { id: "case-11", pmcid: "PMC10615480", license: "CC BY", journal: "Black hairy tongue treated with traditional Chinese medicine: A case report", age: 73, sex: "female",
    chief: "A black tongue for two weeks, with thirst and diarrhea, a month after urosepsis treated in hospital with antibiotics.",
    symptoms: ["black tongue coating", "thirst", "diarrhea", "history of hypertension and arrhythmia"],
    tongue: "thick black coating ringed by thick white coating; medium-sized body with tooth marks; light-red body", pulse: "not captured in the portion read",
    pattern: "Not captured in the portion read (a gastrointestinal / Spleen-Stomach damp-heat or cold-damp pattern is the usual TCM reading of a thick black coating with diarrhea and thirst)", principle: "Source treated with TCM herbs; principle not captured",
    kw: [["spleen", "stomach", "damp"], ["heat", "cold"]], chips: ["digestive"], pulse_chips: [], weak_truth: true },
];

mkdirSync("cases", { recursive: true });
const cases = C.map((c) => {
  const url = "https://pmc.ncbi.nlm.nih.gov/articles/" + c.pmcid + "/";
  const o = {
    id: c.id, type: "text", source_url: url, source_licence: c.license, source_title: c.journal,
    paraphrase_note: "Symptoms/tongue/pulse paraphrased by the harness author from the open-access full text; source pattern and principle are the authors' own.",
    patient: { age: c.age, sex: c.sex }, chief_complaint: c.chief, symptoms: c.symptoms, tongue_as_reported: c.tongue, pulse_as_reported: c.pulse,
    source_pattern: c.pattern, source_treatment_principle: c.principle, ground_truth_strength: c.weak_truth ? "weak (pattern not captured)" : (/not captured/.test(c.tongue + c.pulse) ? "medium (tongue/pulse partly missing)" : "strong"),
    expect_keyword_groups: c.kw,
    // body the wizard sends to POST /api/consult (wizard.js generateReport)
    consult_request: {
      data: {
        basic_info: { name: "Case " + c.id.slice(-2), age: String(c.age), gender: c.sex, height: "", weight: "", symptoms: c.chips },
        wen_inquiry: "Chief complaint: " + c.chief + " Symptoms: " + c.symptoms.join("; ") + ".",
        wang_tongue: c.tongue.startsWith("not captured") ? "" : c.tongue,
        wang_face: "", wen_audio: "",
        qie: { bpm: "", qualities: c.pulse_chips, note: c.pulse.startsWith("not captured") ? "" : c.pulse },
      },
      language: "en",
    },
  };
  writeFileSync("cases/" + c.id + ".json", JSON.stringify(o, null, 2));
  return { id: c.id, file: "cases/" + c.id + ".json", source_url: url, source_pattern: c.pattern };
});

const manifest = {
  generated_at: new Date().toISOString(), schema: 1,
  note: "Online-grounded scenario corpus for sihat-tcm-go. Tongue photos are real (Wikimedia Commons, free licences); faces are synthetic (no real people); text cases are paraphrased open-access TCM case reports. Ground truth is literature/construction based, not clinical truth.",
  counts: { tongue: tongues.length, face_generated: faces.filter((f) => f.generated).length, face_planned: faces.length, text: cases.length },
  tongue: tongues, face: faces, text: cases,
};
writeFileSync("manifest.json", JSON.stringify(manifest, null, 2));
console.log(manifest.counts);
