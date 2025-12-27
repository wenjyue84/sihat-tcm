// Mock medical report content in Markdown format

export const mockMedicalReports: Record<string, string> = {
  "Blood Test Result.pdf": `# Blood Test Result

**Patient Name:** [Patient Name]
**Test Date:** November 15, 2023
**Report ID:** BT-2023-1115-001
**Laboratory:** City Medical Laboratory

---

## Complete Blood Count (CBC)

| Parameter | Result | Reference Range | Unit | Status |
|-----------|--------|-----------------|------|--------|
| White Blood Cells (WBC) | 7.2 | 4.0-11.0 | 10^3/μL | Normal |
| Red Blood Cells (RBC) | 4.8 | 4.5-5.5 | 10^6/μL | Normal |
| Hemoglobin | 14.2 | 13.5-17.5 | g/dL | Normal |
| Hematocrit | 42.5 | 40.0-50.0 | % | Normal |
| Platelets | 245 | 150-400 | 10^3/μL | Normal |
| MCV | 88 | 80-100 | fL | Normal |
| MCH | 29.6 | 27-33 | pg | Normal |
| MCHC | 33.4 | 32-36 | g/dL | Normal |

## Comprehensive Metabolic Panel

| Parameter | Result | Reference Range | Unit | Status |
|-----------|--------|-----------------|------|--------|
| Glucose (Fasting) | 92 | 70-100 | mg/dL | Normal |
| Blood Urea Nitrogen (BUN) | 15 | 7-20 | mg/dL | Normal |
| Creatinine | 0.9 | 0.7-1.3 | mg/dL | Normal |
| BUN/Creatinine Ratio | 16.7 | 10-20 | - | Normal |
| Sodium | 140 | 136-145 | mmol/L | Normal |
| Potassium | 4.2 | 3.5-5.1 | mmol/L | Normal |
| Chloride | 102 | 98-107 | mmol/L | Normal |
| Carbon Dioxide | 25 | 23-29 | mmol/L | Normal |
| Calcium | 9.5 | 8.5-10.5 | mg/dL | Normal |

## Lipid Panel

| Parameter | Result | Reference Range | Unit | Status |
|-----------|--------|-----------------|------|--------|
| Total Cholesterol | 185 | <200 | mg/dL | Normal |
| HDL Cholesterol | 55 | >40 | mg/dL | Normal |
| LDL Cholesterol | 110 | <130 | mg/dL | Normal |
| Triglycerides | 100 | <150 | mg/dL | Normal |
| VLDL Cholesterol | 20 | 5-40 | mg/dL | Normal |
| Cholesterol/HDL Ratio | 3.4 | <5.0 | - | Normal |

## Liver Function Tests

| Parameter | Result | Reference Range | Unit | Status |
|-----------|--------|-----------------|------|--------|
| ALT (SGPT) | 28 | 7-56 | U/L | Normal |
| AST (SGOT) | 24 | 10-40 | U/L | Normal |
| Alkaline Phosphatase | 72 | 44-147 | U/L | Normal |
| Total Bilirubin | 0.8 | 0.1-1.2 | mg/dL | Normal |
| Direct Bilirubin | 0.2 | 0.0-0.3 | mg/dL | Normal |
| Albumin | 4.2 | 3.5-5.5 | g/dL | Normal |
| Total Protein | 7.1 | 6.0-8.3 | g/dL | Normal |

## Thyroid Function

| Parameter | Result | Reference Range | Unit | Status |
|-----------|--------|-----------------|------|--------|
| TSH | 2.1 | 0.4-4.0 | μIU/mL | Normal |
| Free T4 | 1.2 | 0.8-1.8 | ng/dL | Normal |

## Clinical Summary

All laboratory values are within normal reference ranges. No abnormalities detected.

## Recommendations

- Continue maintaining healthy lifestyle
- Repeat testing in 6-12 months for routine monitoring
- Follow up with primary care physician for routine check-up

---

**Reported by:** Dr. Sarah Chen, MD
**Laboratory Director:** Dr. Michael Wong, PhD
**Report Date:** November 15, 2023

*This report is confidential and intended for medical use only.*
`,

  "X-Ray Report - Chest.pdf": `# Chest X-Ray Report

**Patient Name:** [Patient Name]
**Examination Date:** October 20, 2023
**Report ID:** XR-CHEST-2023-1020-002
**Facility:** City Medical Imaging Center

---

## Clinical Information

**Indication:** Routine health screening
**Technique:** PA and Lateral chest radiographs

## Findings

### Lungs
- Both lungs are clear and well-expanded
- No focal consolidation, mass, or nodule identified
- No pleural effusion or pneumothorax
- Lung volumes are normal
- No interstitial abnormalities

### Heart and Mediastinum
- Heart size is normal (cardiothoracic ratio: 0.45)
- Mediastinal contours are within normal limits
- No mediastinal widening or lymphadenopathy
- Aortic arch appears normal

### Bones and Soft Tissues
- Bony thorax appears intact
- No acute fractures or lytic lesions
- Soft tissue structures appear normal
- Visualized upper abdomen is unremarkable

### Airways
- Trachea is midline
- Main bronchi are patent
- No endobronchial lesions visible

## Comparison
No prior studies available for comparison.

## Impression

**Normal chest radiograph.**

- Clear lung fields bilaterally
- Normal cardiac silhouette
- No acute cardiopulmonary abnormality

## Recommendations

- No immediate follow-up required
- Routine screening as per clinical guidelines
- Correlate with clinical findings

---

**Radiologist:** Dr. James Thompson, MD, FRCR
**Report Date:** October 20, 2023
**Verified by:** Dr. Lisa Martinez, MD

*This report has been electronically signed and is legally binding.*
`,

  "Annual Health Checkup.pdf": `# Annual Health Checkup Report

**Patient Name:** [Patient Name]
**Date of Examination:** August 12, 2023
**Report ID:** AHC-2023-0812-003
**Medical Center:** Wellness Health Clinic

---

## Executive Summary

Comprehensive annual health assessment completed. Overall health status: **GOOD**

---

## Vital Signs

| Parameter | Result | Reference Range | Status |
|-----------|--------|-----------------|--------|
| Blood Pressure | 118/76 mmHg | <120/80 | Optimal |
| Heart Rate | 68 bpm | 60-100 | Normal |
| Respiratory Rate | 14 /min | 12-20 | Normal |
| Temperature | 36.6°C (97.9°F) | 36.1-37.2°C | Normal |
| Oxygen Saturation | 98% | >95% | Normal |
| Height | 170 cm | - | - |
| Weight | 68 kg | - | - |
| BMI | 23.5 | 18.5-24.9 | Normal |

---

## Physical Examination

### General Appearance
- Alert and oriented
- Well-nourished
- No acute distress

### Head, Eyes, Ears, Nose, Throat (HEENT)
- Normocephalic, atraumatic
- Pupils equal, round, reactive to light
- Extraocular movements intact
- Tympanic membranes clear
- Oropharynx without erythema or exudate

### Cardiovascular
- Regular rate and rhythm
- No murmurs, rubs, or gallops
- Peripheral pulses 2+ bilaterally
- No peripheral edema

### Respiratory
- Clear to auscultation bilaterally
- No wheezing, rales, or rhonchi
- Normal respiratory effort

### Abdomen
- Soft, non-tender, non-distended
- Normal bowel sounds
- No hepatosplenomegaly
- No masses palpable

### Musculoskeletal
- Full range of motion in all joints
- No deformities or swelling
- Normal gait and station

### Neurological
- Cranial nerves II-XII intact
- Motor strength 5/5 in all extremities
- Sensory examination normal
- Deep tendon reflexes 2+ and symmetric

### Skin
- No rashes or lesions
- Good turgor and color
- No suspicious moles

---

## Laboratory Results Summary

✓ **Complete Blood Count:** All values within normal limits
✓ **Comprehensive Metabolic Panel:** All values normal
✓ **Lipid Panel:** Optimal cholesterol levels
✓ **Liver Function:** Normal
✓ **Kidney Function:** Normal
✓ **Thyroid Function:** Normal
✓ **Urinalysis:** No abnormalities
✓ **HbA1c:** 5.4% (Normal, <5.7%)

---

## Screening Tests

### Vision Screening
- Visual acuity: 20/20 both eyes
- No visual deficits noted

### Hearing Screening
- Hearing within normal limits bilaterally

### Cancer Screening
- Age-appropriate cancer screening up to date
- All results negative

---

## Immunization Status

✓ Tetanus-Diphtheria booster (last: 2020)
✓ Influenza vaccine (last: 2022)
✓ COVID-19 vaccine series complete

---

## Risk Assessment

### Cardiovascular Risk
- 10-year risk: **Low** (<5%)
- Framingham Risk Score: 2.3%

### Diabetes Risk
- Risk level: **Low**
- No family history of diabetes

### Cancer Risk
- Age-appropriate screening negative
- No concerning family history

---

## Lifestyle Assessment

### Exercise
- Moderate physical activity: 3-4 times per week
- Recommendation: Continue current regimen

### Diet
- Balanced diet with adequate fruits and vegetables
- Recommendation: Maintain current eating habits

### Sleep
- Average 7-8 hours per night
- No sleep disturbances reported

### Stress Level
- Moderate stress from work
- Recommendation: Consider stress management techniques

### Substance Use
- Non-smoker
- Alcohol: Occasional, within recommended limits
- No illicit drug use

---

## Assessment and Plan

### Overall Health Status: EXCELLENT

**Summary:**
Patient is in excellent health with all clinical parameters within normal limits. Physical examination unremarkable. Laboratory values optimal. Age-appropriate screenings up to date.

### Recommendations:

1. **Continue Current Lifestyle**
   - Maintain regular exercise routine
   - Continue balanced diet
   - Ensure adequate sleep

2. **Preventive Care**
   - Schedule next annual checkup in 12 months
   - Update influenza vaccine annually
   - Continue age-appropriate cancer screening

3. **Health Optimization**
   - Consider stress reduction techniques (meditation, yoga)
   - Maintain healthy BMI
   - Stay hydrated (8 glasses of water daily)

4. **Follow-up**
   - Next appointment: August 2024
   - Contact clinic if any new symptoms develop

---

## Physician Notes

Patient demonstrates excellent health maintenance and preventive care practices. Encouraged to continue current lifestyle habits. No immediate concerns identified. Patient counseled on importance of continued preventive care and healthy lifestyle.

---

**Examining Physician:** Dr. Emily Rodriguez, MD, FAAFP
**Family Medicine Specialist**
**Date:** August 12, 2023
**Next Review:** August 2024

---

*This comprehensive health assessment is valid for one year from the examination date. Any significant health changes should prompt re-evaluation.*
`,

  "MRI Scan Report.pdf": `# MRI Scan Report - Lumbar Spine

**Patient Name:** [Patient Name]
**Examination Date:** June 5, 2023
**Report ID:** MRI-LS-2023-0605-004
**Imaging Center:** Advanced Diagnostic Imaging

---

## Clinical Information

**Indication:** Lower back pain evaluation
**Clinical History:** Intermittent lower back discomfort, no radiculopathy

---

## Technique

**Examination:** MRI Lumbar Spine without contrast
**Sequences Performed:**
- Sagittal T1-weighted
- Sagittal T2-weighted
- Sagittal STIR
- Axial T2-weighted at L3-L4, L4-L5, and L5-S1

**Field Strength:** 1.5 Tesla
**Patient Position:** Supine

---

## Findings

### Vertebral Body Alignment
- Normal lordotic curvature maintained
- No spondylolisthesis or retrolisthesis
- Vertebral body heights preserved

### Vertebral Body Marrow Signal
- Normal bone marrow signal intensity
- No focal marrow replacing lesions
- No evidence of compression fractures
- No edema or infiltrative process

### Intervertebral Discs

**L1-L2:** Normal disc height and signal. No disc bulge or herniation.

**L2-L3:** Normal disc height and signal. No disc bulge or herniation.

**L3-L4:**
- Minimal disc desiccation
- Mild disc bulge without significant canal or foraminal stenosis
- No nerve root impingement

**L4-L5:**
- Mild disc desiccation
- Small broad-based disc bulge, predominantly posterior
- No significant central canal stenosis
- Mild bilateral foraminal narrowing without nerve root compression
- No disc extrusion or sequestration

**L5-S1:**
- Preserved disc height and signal
- No disc bulge or herniation
- Neural foramina patent bilaterally

### Spinal Canal

**Central Canal:**
- Normal AP diameter throughout
- No spinal stenosis
- Conus medullaris terminates normally at L1-L2
- Cauda equina nerve roots appear normal

**Neural Foramina:**
- L1-L2 to L3-L4: Widely patent bilaterally
- L4-L5: Mild bilateral narrowing, no nerve root impingement
- L5-S1: Patent bilaterally

### Facet Joints
- Mild degenerative changes at L4-L5
- No significant facet arthropathy
- No facet joint effusions

### Posterior Elements
- Spinous processes and laminae intact
- No fractures or destructive lesions
- Ligamentum flavum normal thickness

### Paraspinal Soft Tissues
- Paraspinal muscles symmetric, normal signal
- No soft tissue masses
- No abnormal fluid collections

### Incidental Findings
- Visualized portions of kidneys appear normal
- No suspicious lesions in imaged field of view

---

## Impression

1. **MILD DEGENERATIVE DISC DISEASE** at L3-L4 and L4-L5
   - Mild disc desiccation and bulging
   - No significant spinal canal or neural foraminal stenosis
   - No nerve root compression

2. **MILD FACET ARTHROPATHY** at L4-L5
   - Age-appropriate degenerative changes

3. **NO DISC HERNIATION** or extrusion

4. **NORMAL SPINAL ALIGNMENT**
   - No spondylolisthesis

5. **NO ACUTE FINDINGS**
   - No fractures
   - No marrow edema
   - No focal lesions

---

## Clinical Correlation

The imaging findings show mild degenerative changes typical for the patient's age group. These findings may or may not correlate with the patient's symptoms. Clinical correlation is recommended.

---

## Recommendations

1. Correlate with clinical examination and symptoms
2. Conservative management typically appropriate for mild degenerative changes:
   - Physical therapy
   - Core strengthening exercises
   - Posture correction
   - Weight management if applicable
3. Consider follow-up MRI if symptoms worsen or fail to improve with conservative treatment
4. No urgent intervention required based on imaging

---

**Radiologist:** Dr. Robert Chen, MD, FRCR
**Subspecialty:** Musculoskeletal Imaging
**Report Date:** June 5, 2023
**Verified by:** Dr. Patricia Lee, MD

---

**Technical Quality:** Excellent
**Study Limitations:** None

*This examination was performed and interpreted according to ACR-SPR practice parameters.*

---

## Glossary of Terms

- **Disc desiccation:** Age-related loss of water content in disc
- **Disc bulge:** Generalized extension of disc beyond vertebral margins
- **Neural foramina:** Openings where nerve roots exit the spine
- **Facet joints:** Joints between vertebrae
- **Cauda equina:** Bundle of nerve roots at lower end of spinal cord
`,

  "Prescription History.pdf": `# Medication Prescription History

**Patient Name:** [Patient Name]
**Generated Date:** May 20, 2023
**Report ID:** RX-HIST-2023-0520-005
**Pharmacy:** CarePoint Pharmacy Network

---

## Summary

**Total Prescriptions (Past 12 Months):** 8
**Active Medications:** 2
**Completed Courses:** 6
**Drug Allergies:** None reported
**Adverse Reactions:** None reported

---

## Active Prescriptions

### 1. Vitamin D3 (Cholecalciferol)
- **Dosage:** 1000 IU
- **Form:** Tablet
- **Frequency:** Once daily
- **Prescribed Date:** January 15, 2023
- **Prescribed By:** Dr. Emily Rodriguez, MD
- **Indication:** Vitamin D supplementation
- **Refills Remaining:** 11 of 12
- **Status:** ACTIVE

### 2. Omega-3 Fish Oil
- **Dosage:** 1000 mg
- **Form:** Soft gel capsule
- **Frequency:** Once daily with food
- **Prescribed Date:** January 15, 2023
- **Prescribed By:** Dr. Emily Rodriguez, MD
- **Indication:** Cardiovascular health support
- **Refills Remaining:** 11 of 12
- **Status:** ACTIVE

---

## Completed Prescription History

### 3. Amoxicillin
- **Dosage:** 500 mg
- **Form:** Capsule
- **Frequency:** Three times daily for 7 days
- **Prescribed Date:** March 10, 2023
- **Prescribed By:** Dr. Sarah Kim, MD
- **Indication:** Bacterial upper respiratory infection
- **Course Duration:** 7 days
- **Status:** COMPLETED (March 17, 2023)
- **Notes:** Course completed as prescribed

### 4. Ibuprofen
- **Dosage:** 400 mg
- **Form:** Tablet
- **Frequency:** Every 6 hours as needed
- **Prescribed Date:** March 10, 2023
- **Prescribed By:** Dr. Sarah Kim, MD
- **Indication:** Pain and fever management
- **Quantity:** 20 tablets
- **Status:** COMPLETED
- **Notes:** Used during acute illness

### 5. Cetirizine (Antihistamine)
- **Dosage:** 10 mg
- **Form:** Tablet
- **Frequency:** Once daily
- **Prescribed Date:** April 5, 2023
- **Prescribed By:** Dr. Emily Rodriguez, MD
- **Indication:** Seasonal allergies
- **Course Duration:** 30 days
- **Status:** COMPLETED (May 5, 2023)
- **Notes:** Seasonal use only

### 6. Artificial Tears
- **Form:** Eye drops
- **Frequency:** As needed, up to 4 times daily
- **Prescribed Date:** February 20, 2023
- **Prescribed By:** Dr. Michael Wong, OD
- **Indication:** Dry eye relief
- **Quantity:** 1 bottle
- **Status:** COMPLETED
- **Notes:** Over-the-counter equivalent available

### 7. Acetaminophen
- **Dosage:** 500 mg
- **Form:** Tablet
- **Frequency:** Every 6 hours as needed
- **Prescribed Date:** January 28, 2023
- **Prescribed By:** Dr. Emily Rodriguez, MD
- **Indication:** Headache relief
- **Quantity:** 30 tablets
- **Status:** COMPLETED
- **Notes:** Used as needed for occasional headaches

### 8. Multivitamin
- **Form:** Tablet
- **Frequency:** Once daily
- **Prescribed Date:** May 15, 2022
- **Prescribed By:** Dr. Emily Rodriguez, MD
- **Indication:** General nutritional support
- **Refills:** 12
- **Status:** DISCONTINUED (January 15, 2023)
- **Reason:** Switched to specific supplements (Vitamin D3)

---

## Medication Adherence

**Overall Adherence Rate:** 95%

- Prescriptions filled on time: 100%
- Refills picked up as scheduled: 95%
- No missed medication alerts

---

## Drug Interaction Screening

✓ **No significant drug interactions detected**

Current active medications (Vitamin D3 and Omega-3) have no known interactions.

---

## Allergy and Adverse Reaction History

**Drug Allergies:** None reported
**Adverse Reactions:** None documented
**Intolerances:** None reported

---

## Immunization Record (Past 12 Months)

| Vaccine | Date Administered | Provider |
|---------|------------------|----------|
| Influenza (Flu Shot) | October 15, 2022 | CarePoint Pharmacy |
| COVID-19 Booster | September 8, 2022 | City Health Clinic |

---

## Pharmacy Notes

### Patient Counseling Points
1. Continue taking Vitamin D3 and Omega-3 as prescribed
2. Take Omega-3 with food to improve absorption
3. Maintain adequate hydration
4. Store medications in cool, dry place
5. Check expiration dates regularly

### Refill Reminders
- Vitamin D3: Next refill due July 15, 2023
- Omega-3: Next refill due July 15, 2023

---

## Cost Summary (Past 12 Months)

| Category | Total Cost | Insurance Paid | Patient Paid |
|----------|-----------|----------------|--------------|
| Prescriptions | $285.00 | $215.00 | $70.00 |
| Supplements | $120.00 | $0.00 | $120.00 |
| **Total** | **$405.00** | **$215.00** | **$190.00** |

---

## Prescriber Information

### Primary Care Physician
**Dr. Emily Rodriguez, MD, FAAFP**
Family Medicine Specialist
CarePoint Medical Group
Phone: (555) 123-4567

### Other Prescribers
**Dr. Sarah Kim, MD** - Internal Medicine
**Dr. Michael Wong, OD** - Optometry

---

## Important Safety Information

### General Medication Safety Tips

1. **Take medications as prescribed**
   - Follow dosing instructions carefully
   - Do not skip doses
   - Complete full course of antibiotics

2. **Storage**
   - Keep medications in original containers
   - Store in cool, dry place
   - Keep out of reach of children

3. **Side Effects**
   - Report any unusual symptoms to your doctor
   - Seek emergency care for severe reactions

4. **Interactions**
   - Inform healthcare providers of all medications
   - Include over-the-counter drugs and supplements
   - Check with pharmacist before starting new medications

5. **Disposal**
   - Do not flush medications down toilet
   - Use medication take-back programs
   - Follow FDA disposal guidelines

---

## Contact Information

**Pharmacy:** CarePoint Pharmacy
**Phone:** (555) 987-6543
**Email:** prescriptions@carepoint.com
**Hours:** Mon-Fri 8AM-8PM, Sat-Sun 9AM-6PM

**24-Hour Nurse Line:** (555) 999-8888

---

**Report Generated By:** CarePoint Pharmacy System
**Pharmacist Verification:** Jennifer Smith, RPh
**Date:** May 20, 2023

---

*This prescription history is a comprehensive record of all filled prescriptions at CarePoint Pharmacy Network locations. For complete medication history including prescriptions filled at other pharmacies, please request a comprehensive medication history from your healthcare provider.*

**Confidentiality Notice:** This document contains protected health information. Handle according to HIPAA regulations.
`,
};
