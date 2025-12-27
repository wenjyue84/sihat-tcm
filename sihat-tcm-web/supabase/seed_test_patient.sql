-- Comprehensive Mock Data Seed for "Test Patient" Account
-- Run this in Supabase SQL Editor after getting the Test Patient's user ID

-- IMPORTANT: Replace 'YOUR_TEST_PATIENT_UUID' with the actual UUID of your Test Patient
-- You can find this by running: SELECT id, email, full_name FROM profiles WHERE full_name ILIKE '%test%';

-- Step 1: Update the Test Patient's profile with complete information
UPDATE public.profiles
SET 
    full_name = 'Test Patient',
    age = 42,
    gender = 'male',
    height = 172,
    weight = 75,
    bmi = 25.4,
    medical_history = 'Mild hypertension (controlled with medication since 2020). Family history of diabetes. Occasional lower back pain. Previous appendectomy (2015). No known drug allergies.'
WHERE email = 'test@example.com' OR full_name ILIKE '%test patient%';

-- Step 2: Insert comprehensive diagnosis sessions
-- Session 1: Yin Deficiency (Most Recent - 2 days ago)
INSERT INTO public.diagnosis_sessions (user_id, primary_diagnosis, constitution, overall_score, full_report, notes, created_at)
SELECT 
    id,
    'Yin Deficiency with Empty Heat',
    'Yin Deficiency Constitution',
    68,
    '{
        "diagnosis": {
            "primary_pattern": "Yin Deficiency with Empty Heat",
            "secondary_patterns": ["Kidney Yin Deficiency", "Heart-Kidney Disharmony"],
            "affected_organs": ["Kidney", "Heart", "Liver"],
            "pathomechanism": "Prolonged stress and overwork have depleted Kidney Yin, leading to Empty Heat rising. This manifests as night sweats, insomnia, and a feeling of heat in the evening."
        },
        "constitution": {
            "type": "Yin Deficiency",
            "description": "Tendency towards dryness, feeling hot, restlessness, and difficulty sleeping. Often thin body type with dry skin."
        },
        "analysis": {
            "summary": "Patient presents classic signs of Yin Deficiency with Empty Heat. The combination of night sweats, insomnia, and afternoon heat sensations point to depleted Kidney Yin failing to anchor Yang.",
            "key_findings": {
                "from_inquiry": "Reports night sweats 3-4 times per week, difficulty falling asleep, feeling hot in palms and soles at night, dry mouth especially at night.",
                "from_visual": "Tongue is red with scanty coating, especially peeled in the center. Slight tremor observed. Face shows malar flush.",
                "from_pulse": "Pulse is thin and rapid (Xi Shu), especially weak in the Kidney position."
            },
            "pattern_rationale": "The thin rapid pulse combined with red tongue lacking coating confirms Yin Deficiency. Night sweats and five-palm heat indicate Empty Heat rising due to insufficient Yin to anchor Yang."
        },
        "recommendations": {
            "food": ["Black sesame seeds", "Goji berries", "Mulberries", "Duck", "Pork", "Tofu", "Asparagus", "Seaweed"],
            "avoid": ["Spicy foods", "Alcohol", "Coffee", "Lamb", "Deep-fried foods", "Excessive salt"],
            "lifestyle": ["Sleep before 11 PM", "Avoid overwork", "Gentle exercise only", "Meditation practice"],
            "food_therapy": {
                "beneficial": ["Chrysanthemum tea", "Lily bulb congee", "Black bean soup"],
                "recipes": ["Goji and Chrysanthemum Tea: Steep 10g goji berries and 5g dried chrysanthemum in hot water for 10 minutes"],
                "avoid": ["Hot pot", "BBQ meats", "Strong spices"]
            },
            "acupoints": ["KI3 (Taixi)", "KI6 (Zhaohai)", "SP6 (Sanyinjiao)", "HT6 (Yinxi)"],
            "exercise": ["Tai Chi", "Gentle yoga", "Swimming", "Walking"],
            "sleep_guidance": "Establish a consistent sleep routine. Avoid screens 1 hour before bed. Sleep in a cool, dark room. Consider foot soaking before bed.",
            "emotional_care": "Practice mindfulness meditation. Reduce work stress. Avoid emotional exhaustion.",
            "herbal_formulas": [
                {
                    "name": "Liu Wei Di Huang Wan",
                    "ingredients": ["Rehmannia", "Cornus", "Dioscorea", "Alisma", "Moutan", "Poria"],
                    "dosage": "8 pills twice daily with warm water",
                    "purpose": "Nourish Kidney Yin and clear deficiency heat"
                }
            ],
            "doctor_consultation": "Recommended follow-up in 4 weeks to assess Yin nourishment progress.",
            "general": ["Stay hydrated", "Avoid late nights", "Reduce screen time"]
        },
        "patient_profile": {
            "name": "Test Patient",
            "age": 42,
            "gender": "Male",
            "height": 172,
            "weight": 75
        },
        "precautions": {
            "warning_signs": ["Persistent high fever", "Severe headaches", "Sudden weight loss"],
            "contraindications": ["Avoid warming herbs", "Limit tonic foods"],
            "special_notes": "Monitor sleep quality improvement over next 2 weeks"
        },
        "follow_up": {
            "timeline": "4 weeks",
            "expected_improvement": "Better sleep, reduced night sweats, improved energy",
            "next_steps": "Re-evaluate pulse and tongue. Adjust formula if needed."
        },
        "timestamp": "' || (NOW() - INTERVAL '2 days')::text || '"
    }'::jsonb,
    'Noticed improvement in sleep after following the diet recommendations for a few days. Still experiencing some night sweats.',
    NOW() - INTERVAL '2 days'
FROM public.profiles 
WHERE email = 'test@example.com' OR full_name ILIKE '%test patient%'
LIMIT 1;

-- Session 2: Liver Qi Stagnation (1 week ago)
INSERT INTO public.diagnosis_sessions (user_id, primary_diagnosis, constitution, overall_score, full_report, notes, created_at)
SELECT 
    id,
    'Liver Qi Stagnation',
    'Qi Stagnation Constitution',
    62,
    '{
        "diagnosis": {
            "primary_pattern": "Liver Qi Stagnation",
            "secondary_patterns": ["Spleen Qi Deficiency"],
            "affected_organs": ["Liver", "Spleen", "Stomach"],
            "pathomechanism": "Emotional stress causing Liver Qi to stagnate, which then invades the Spleen, disrupting digestion and causing distension."
        },
        "constitution": {
            "type": "Qi Stagnation",
            "description": "Prone to mood swings, sighing, feeling of chest tightness, and digestive issues when stressed."
        },
        "analysis": {
            "summary": "Work-related stress has caused significant Liver Qi Stagnation affecting digestion and emotional well-being.",
            "key_findings": {
                "from_inquiry": "Reports irritability, frequent sighing, chest tightness, bloating after meals, irregular bowel movements.",
                "from_visual": "Tongue is slightly purple on the sides (Liver area). Tongue body is normal with thin white coating.",
                "from_pulse": "Pulse is wiry (Xian), especially strong in the Liver position."
            },
            "pattern_rationale": "Wiry pulse is pathognomonic for Liver Qi Stagnation. Purple sides of tongue confirm blood stasis from prolonged Qi stagnation."
        },
        "recommendations": {
            "food": ["Green leafy vegetables", "Citrus fruits", "Celery", "Radish", "Mint", "Turmeric"],
            "avoid": ["Heavy greasy foods", "Alcohol", "Too much sour food", "Cold raw foods"],
            "lifestyle": ["Regular exercise", "Express emotions", "Avoid excessive thinking"],
            "acupoints": ["LV3 (Taichong)", "LI4 (Hegu)", "GB34 (Yanglingquan)", "PC6 (Neiguan)"],
            "herbal_formulas": [
                {
                    "name": "Xiao Yao San",
                    "ingredients": ["Bupleurum", "White Peony", "Angelica", "Atractylodes", "Poria", "Licorice", "Ginger", "Mint"],
                    "dosage": "Take twice daily after meals",
                    "purpose": "Soothe Liver Qi, strengthen Spleen, nourish Blood"
                }
            ]
        },
        "patient_profile": {"name": "Test Patient", "age": 42, "gender": "Male"},
        "follow_up": {"timeline": "2 weeks", "expected_improvement": "Reduced bloating, better mood"}
    }'::jsonb,
    'Very stressful week at work with tight deadlines. The breathing exercises helped with chest tightness.',
    NOW() - INTERVAL '7 days'
FROM public.profiles 
WHERE email = 'test@example.com' OR full_name ILIKE '%test patient%'
LIMIT 1;

-- Session 3: Spleen Qi Deficiency (2 weeks ago)  
INSERT INTO public.diagnosis_sessions (user_id, primary_diagnosis, constitution, overall_score, full_report, notes, created_at)
SELECT 
    id,
    'Spleen Qi Deficiency',
    'Qi Deficiency Constitution',
    65,
    '{
        "diagnosis": {
            "primary_pattern": "Spleen Qi Deficiency",
            "secondary_patterns": ["Dampness Accumulation"],
            "affected_organs": ["Spleen", "Stomach"],
            "pathomechanism": "Weak Spleen failing to transform and transport, leading to dampness accumulation and fatigue."
        },
        "analysis": {
            "summary": "Long-term irregular eating habits and excessive worry have weakened Spleen Qi.",
            "key_findings": {
                "from_inquiry": "Fatigue especially after eating, loose stools, poor appetite, feeling of heaviness in limbs.",
                "from_visual": "Tongue is pale with teeth marks on sides, thick white coating.",
                "from_pulse": "Pulse is weak and soft, especially in the Spleen position."
            }
        },
        "recommendations": {
            "food": ["Congee", "Sweet potato", "Pumpkin", "Ginger", "Chinese yam", "Lotus seed"],
            "avoid": ["Cold drinks", "Raw foods", "Dairy", "Excessive sweets", "Greasy foods"],
            "herbal_formulas": [
                {
                    "name": "Si Jun Zi Tang",
                    "ingredients": ["Ginseng", "Atractylodes", "Poria", "Licorice"],
                    "dosage": "Twice daily before meals",
                    "purpose": "Tonify Spleen Qi"
                }
            ]
        },
        "patient_profile": {"name": "Test Patient", "age": 42, "gender": "Male"},
        "follow_up": {"timeline": "3 weeks", "expected_improvement": "Better energy, improved digestion"}
    }'::jsonb,
    'Started eating more warming foods and congee for breakfast. Energy levels slightly improved.',
    NOW() - INTERVAL '14 days'
FROM public.profiles 
WHERE email = 'test@example.com' OR full_name ILIKE '%test patient%'
LIMIT 1;

-- Session 4: Damp Heat (3 weeks ago)
INSERT INTO public.diagnosis_sessions (user_id, primary_diagnosis, constitution, overall_score, full_report, notes, created_at)
SELECT 
    id,
    'Damp Heat in Lower Jiao',
    'Damp Heat Constitution',
    55,
    '{
        "diagnosis": {
            "primary_pattern": "Damp Heat in Lower Jiao",
            "secondary_patterns": ["Bladder Damp Heat"],
            "affected_organs": ["Bladder", "Large Intestine", "Spleen"],
            "pathomechanism": "Overconsumption of greasy and spicy foods combined with humid weather has led to Damp Heat accumulation."
        },
        "analysis": {
            "summary": "Patient shows signs of Damp Heat affecting the urinary system and lower digestive tract.",
            "key_findings": {
                "from_inquiry": "Frequent urination with burning sensation, feeling of incomplete emptying, occasional loose stools with foul odor.",
                "from_visual": "Tongue coating is thick, yellow, and greasy.",
                "from_pulse": "Pulse is slippery and rapid (Hua Shu)."
            }
        },
        "recommendations": {
            "food": ["Mung beans", "Watermelon", "Cucumber", "Barley", "Bitter melon", "Lotus leaf tea"],
            "avoid": ["Spicy food", "Alcohol", "Greasy foods", "Shellfish", "Lamb"],
            "herbal_formulas": [
                {
                    "name": "Ba Zheng San",
                    "ingredients": ["Plantago", "Dianthus", "Talcum", "Gardenia"],
                    "dosage": "Three times daily",
                    "purpose": "Clear Heat, drain Dampness from Bladder"
                }
            ]
        },
        "patient_profile": {"name": "Test Patient", "age": 42, "gender": "Male"},
        "follow_up": {"timeline": "1 week", "expected_improvement": "Resolved urinary discomfort"}
    }'::jsonb,
    'Had too many heavy meals during a business trip. Need to be more careful with diet.',
    NOW() - INTERVAL '21 days'
FROM public.profiles 
WHERE email = 'test@example.com' OR full_name ILIKE '%test patient%'
LIMIT 1;

-- Session 5: Blood Deficiency (5 weeks ago)
INSERT INTO public.diagnosis_sessions (user_id, primary_diagnosis, constitution, overall_score, full_report, notes, created_at)
SELECT 
    id,
    'Blood Deficiency',
    'Blood Deficiency Constitution',
    70,
    '{
        "diagnosis": {
            "primary_pattern": "Blood Deficiency",
            "secondary_patterns": ["Heart Blood Deficiency"],
            "affected_organs": ["Heart", "Liver", "Spleen"],
            "pathomechanism": "Overwork and poor nutrition depleting Blood, affecting Heart and causing palpitations and poor memory."
        },
        "analysis": {
            "summary": "Patient shows classic Blood Deficiency signs with Heart involvement.",
            "key_findings": {
                "from_inquiry": "Dizziness on standing, palpitations, poor memory, pale complexion, dry skin.",
                "from_visual": "Tongue is pale and thin with little coating.",
                "from_pulse": "Pulse is thin and choppy (Xi Se)."
            }
        },
        "recommendations": {
            "food": ["Red dates", "Goji berries", "Dark leafy greens", "Beets", "Bone broth", "Eggs"],
            "avoid": ["Excessive tea/coffee", "Cold foods"],
            "herbal_formulas": [
                {
                    "name": "Si Wu Tang",
                    "ingredients": ["Rehmannia", "Angelica", "White Peony", "Ligusticum"],
                    "dosage": "Twice daily",
                    "purpose": "Nourish and invigorate Blood"
                }
            ]
        },
        "patient_profile": {"name": "Test Patient", "age": 42, "gender": "Male"},
        "follow_up": {"timeline": "4 weeks", "expected_improvement": "Better complexion, reduced dizziness"}
    }'::jsonb,
    'Ate more blood-nourishing foods. Red date tea became my daily habit.',
    NOW() - INTERVAL '35 days'
FROM public.profiles 
WHERE email = 'test@example.com' OR full_name ILIKE '%test patient%'
LIMIT 1;

-- Session 6: Kidney Yang Deficiency (7 weeks ago)
INSERT INTO public.diagnosis_sessions (user_id, primary_diagnosis, constitution, overall_score, full_report, notes, created_at)
SELECT 
    id,
    'Kidney Yang Deficiency',
    'Yang Deficiency Constitution',
    58,
    '{
        "diagnosis": {
            "primary_pattern": "Kidney Yang Deficiency",
            "secondary_patterns": ["Spleen Yang Deficiency"],
            "affected_organs": ["Kidney", "Spleen", "Bladder"],
            "pathomechanism": "Constitutional weakness aggravated by cold exposure and aging, leading to Yang depletion."
        },
        "analysis": {
            "summary": "Patient presents with cold limbs and lower back issues indicating Kidney Yang weakness.",
            "key_findings": {
                "from_inquiry": "Cold hands and feet, lower back pain and weakness, frequent clear urination especially at night, fatigue.",
                "from_visual": "Tongue is pale and swollen with wet coating.",
                "from_pulse": "Pulse is deep and weak, especially in the Kidney position."
            }
        },
        "recommendations": {
            "food": ["Lamb", "Walnuts", "Shrimp", "Cinnamon", "Ginger", "Leeks", "Chives"],
            "avoid": ["Cold drinks", "Raw foods", "Watermelon", "Bitter melon"],
            "herbal_formulas": [
                {
                    "name": "Jin Gui Shen Qi Wan",
                    "ingredients": ["Rehmannia", "Cornus", "Dioscorea", "Cinnamon bark", "Aconite"],
                    "dosage": "8 pills twice daily with warm water",
                    "purpose": "Warm and tonify Kidney Yang"
                }
            ]
        },
        "patient_profile": {"name": "Test Patient", "age": 42, "gender": "Male"},
        "follow_up": {"timeline": "6 weeks", "expected_improvement": "Warmer extremities, reduced nocturia"}
    }'::jsonb,
    'Winter was especially tough. Wearing warmer clothes and drinking ginger tea helped.',
    NOW() - INTERVAL '49 days'
FROM public.profiles 
WHERE email = 'test@example.com' OR full_name ILIKE '%test patient%'
LIMIT 1;

-- Session 7: Phlegm-Damp (9 weeks ago)
INSERT INTO public.diagnosis_sessions (user_id, primary_diagnosis, constitution, overall_score, full_report, notes, created_at)
SELECT 
    id,
    'Phlegm-Damp Obstruction',
    'Phlegm-Damp Constitution',
    60,
    '{
        "diagnosis": {
            "primary_pattern": "Phlegm-Damp Obstruction",
            "affected_organs": ["Spleen", "Lung", "Stomach"],
            "pathomechanism": "Weak Spleen failing to transform fluids, leading to Phlegm accumulation."
        },
        "analysis": {
            "summary": "Spleen deficiency has led to Phlegm accumulation causing heaviness and foggy thinking.",
            "key_findings": {
                "from_inquiry": "Feeling heavy and sluggish, chest oppression, excess phlegm, foggy thinking.",
                "from_visual": "Tongue has thick greasy white coating.",
                "from_pulse": "Pulse is slippery (Hua)."
            }
        },
        "recommendations": {
            "food": ["Job tears", "White radish", "Tangerine peel tea", "Bamboo shoots"],
            "avoid": ["Dairy", "Bananas", "Sweets", "Greasy foods"],
            "herbal_formulas": [
                {
                    "name": "Er Chen Tang",
                    "ingredients": ["Pinellia", "Tangerine peel", "Poria", "Licorice"],
                    "dosage": "Twice daily",
                    "purpose": "Dry Dampness, transform Phlegm"
                }
            ]
        },
        "patient_profile": {"name": "Test Patient", "age": 42, "gender": "Male"},
        "follow_up": {"timeline": "3 weeks", "expected_improvement": "Clearer thinking, less phlegm"}
    }'::jsonb,
    'Cut down on dairy and sweets. Mental clarity improved significantly.',
    NOW() - INTERVAL '63 days'
FROM public.profiles 
WHERE email = 'test@example.com' OR full_name ILIKE '%test patient%'
LIMIT 1;

-- Session 8: Wind-Cold (12 weeks ago)
INSERT INTO public.diagnosis_sessions (user_id, primary_diagnosis, constitution, overall_score, full_report, notes, created_at)
SELECT 
    id,
    'Wind-Cold Invasion',
    'Normal Constitution',
    75,
    '{
        "diagnosis": {
            "primary_pattern": "Wind-Cold Invasion",
            "affected_organs": ["Lung", "Bladder Channel"],
            "pathomechanism": "External Wind-Cold attacking the Wei Qi level, causing cold symptoms."
        },
        "analysis": {
            "summary": "Acute presentation of external Wind-Cold affecting the surface.",
            "key_findings": {
                "from_inquiry": "Chills, mild fever, runny nose with clear mucus, body aches, no sweating.",
                "from_visual": "Tongue has thin white coating.",
                "from_pulse": "Pulse is tight and floating (Jin Fu)."
            }
        },
        "recommendations": {
            "food": ["Ginger tea", "Scallion and ginger congee", "Warm chicken soup"],
            "avoid": ["Cold drinks", "Sour foods", "Shellfish"],
            "lifestyle": ["Rest", "Stay warm", "Induce mild sweating"],
            "herbal_formulas": [
                {
                    "name": "Gui Zhi Tang",
                    "ingredients": ["Cinnamon twig", "White Peony", "Ginger", "Red dates", "Licorice"],
                    "dosage": "Three times daily for 3 days",
                    "purpose": "Release exterior, dispel Wind-Cold"
                }
            ]
        },
        "patient_profile": {"name": "Test Patient", "age": 42, "gender": "Male"},
        "follow_up": {"timeline": "3 days", "expected_improvement": "Full recovery from cold"}
    }'::jsonb,
    'Caught a cold after getting wet in the rain. Ginger tea worked wonders!',
    NOW() - INTERVAL '84 days'
FROM public.profiles 
WHERE email = 'test@example.com' OR full_name ILIKE '%test patient%'
LIMIT 1;

-- Verify insertion
SELECT 
    id,
    primary_diagnosis,
    constitution,
    overall_score,
    created_at,
    LEFT(notes, 50) as notes_preview
FROM public.diagnosis_sessions
WHERE user_id = (SELECT id FROM profiles WHERE email = 'test@example.com' OR full_name ILIKE '%test patient%' LIMIT 1)
ORDER BY created_at DESC;
