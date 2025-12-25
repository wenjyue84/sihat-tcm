// TCM E-Commerce - Herb Shop Data
// This file contains mock data for herbal products available for purchase

export interface HerbalProduct {
    id: string;
    formulaName: string;           // e.g., "Four Gentlemen Decoction"
    formulaNameZh: string;         // e.g., "四君子汤"
    formulaNameMs: string;         // Malay name
    description: string;
    descriptionZh: string;
    descriptionMs: string;
    indications: string[];         // What conditions it treats
    ingredients: {
        name: string;
        nameZh: string;
        weight: string;
    }[];
    productType: 'tea_bags' | 'granules' | 'raw_herbs' | 'capsules';
    price: number;                 // in MYR
    currency: string;
    quantity: string;              // e.g., "7 packs" or "30 capsules"
    servingsPerPack: number;
    preparationTime: string;
    imageUrl?: string;
    inStock: boolean;
    estimatedDelivery: string;     // e.g., "2-3 business days"
    pharmacyPartner: string;       // Local pharmacy name
    pharmacyLocation: string;
    isPopular?: boolean;
}

// Map common TCM diagnoses to recommended products
export const DIAGNOSIS_TO_PRODUCTS: Record<string, string[]> = {
    // Spleen Qi Deficiency
    'spleen_qi_deficiency': ['si_jun_zi_tang', 'liu_jun_zi_tang', 'bu_zhong_yi_qi_tang'],
    'spleen_yang_deficiency': ['li_zhong_wan', 'fu_zi_li_zhong_wan'],

    // Kidney Deficiencies
    'kidney_yang_deficiency': ['jin_gui_shen_qi_wan', 'you_gui_wan'],
    'kidney_yin_deficiency': ['liu_wei_di_huang_wan', 'zuo_gui_wan'],

    // Blood Deficiency
    'blood_deficiency': ['si_wu_tang', 'gui_pi_tang', 'ba_zhen_tang'],

    // Liver Issues
    'liver_qi_stagnation': ['xiao_yao_san', 'chai_hu_shu_gan_san'],
    'liver_blood_deficiency': ['si_wu_tang', 'dang_gui_bu_xue_tang'],

    // Heat Patterns
    'stomach_heat': ['qing_wei_san', 'yu_nu_jian'],
    'heart_fire': ['dao_chi_san', 'huang_lian_jie_du_tang'],

    // Cold Patterns
    'stomach_cold': ['li_zhong_wan', 'xiao_jian_zhong_tang'],

    // Phlegm-Damp
    'phlegm_dampness': ['er_chen_tang', 'liu_jun_zi_tang'],

    // General wellness
    'general_fatigue': ['si_jun_zi_tang', 'bu_zhong_yi_qi_tang'],
    'poor_digestion': ['xiang_sha_liu_jun_zi_tang', 'bao_he_wan'],
};

// Herbal Products Catalog
export const HERBAL_PRODUCTS: Record<string, HerbalProduct> = {
    si_jun_zi_tang: {
        id: 'si_jun_zi_tang',
        formulaName: 'Four Gentlemen Decoction',
        formulaNameZh: '四君子汤',
        formulaNameMs: 'Ramuan Empat Gentleman',
        description: 'The foundational formula for tonifying Spleen Qi. Ideal for general fatigue, weak digestion, and low energy.',
        descriptionZh: '补脾益气的基础方剂。适用于一般疲劳、消化不良和精力不足。',
        descriptionMs: 'Formula asas untuk mengukuhkan Qi Limpa. Sesuai untuk keletihan umum, pencernaan lemah, dan tenaga rendah.',
        indications: ['Spleen Qi Deficiency', 'General Fatigue', 'Poor Appetite', 'Loose Stools'],
        ingredients: [
            { name: 'Ginseng (Ren Shen)', nameZh: '人参', weight: '9g' },
            { name: 'White Atractylodes (Bai Zhu)', nameZh: '白术', weight: '9g' },
            { name: 'Poria (Fu Ling)', nameZh: '茯苓', weight: '9g' },
            { name: 'Licorice Root (Zhi Gan Cao)', nameZh: '炙甘草', weight: '6g' },
        ],
        productType: 'granules',
        price: 68.00,
        currency: 'MYR',
        quantity: '7 sachets (1 week supply)',
        servingsPerPack: 7,
        preparationTime: '5 minutes',
        inStock: true,
        estimatedDelivery: '2-3 business days',
        pharmacyPartner: 'Eu Yan Sang',
        pharmacyLocation: 'Kuala Lumpur',
        isPopular: true,
    },
    liu_jun_zi_tang: {
        id: 'liu_jun_zi_tang',
        formulaName: 'Six Gentlemen Decoction',
        formulaNameZh: '六君子汤',
        formulaNameMs: 'Ramuan Enam Gentleman',
        description: 'Enhanced version of Four Gentlemen with added herbs to address phlegm and dampness. Perfect for those with digestive issues accompanied by bloating.',
        descriptionZh: '四君子汤的加强版，增加了化痰祛湿的药物。适合消化不良伴有腹胀的患者。',
        descriptionMs: 'Versi dipertingkatkan Empat Gentleman dengan herba tambahan untuk menangani kahak dan lembapan.',
        indications: ['Spleen Qi Deficiency with Phlegm', 'Bloating', 'Nausea', 'Poor Appetite'],
        ingredients: [
            { name: 'Ginseng (Ren Shen)', nameZh: '人参', weight: '9g' },
            { name: 'White Atractylodes (Bai Zhu)', nameZh: '白术', weight: '9g' },
            { name: 'Poria (Fu Ling)', nameZh: '茯苓', weight: '9g' },
            { name: 'Licorice Root (Zhi Gan Cao)', nameZh: '炙甘草', weight: '6g' },
            { name: 'Tangerine Peel (Chen Pi)', nameZh: '陈皮', weight: '6g' },
            { name: 'Pinellia (Ban Xia)', nameZh: '半夏', weight: '6g' },
        ],
        productType: 'granules',
        price: 78.00,
        currency: 'MYR',
        quantity: '7 sachets (1 week supply)',
        servingsPerPack: 7,
        preparationTime: '5 minutes',
        inStock: true,
        estimatedDelivery: '2-3 business days',
        pharmacyPartner: 'Eu Yan Sang',
        pharmacyLocation: 'Kuala Lumpur',
    },
    bu_zhong_yi_qi_tang: {
        id: 'bu_zhong_yi_qi_tang',
        formulaName: 'Tonify the Middle & Augment Qi Decoction',
        formulaNameZh: '补中益气汤',
        formulaNameMs: 'Ramuan Penguat Tenaga Tengah',
        description: 'A powerful formula for raising sunken Qi and combating chronic fatigue. Excellent for those who feel constantly tired and weak.',
        descriptionZh: '提升中气、对抗慢性疲劳的强效方剂。适合经常感到疲倦无力的人群。',
        descriptionMs: 'Formula berkuasa untuk meningkatkan Qi yang lemah dan memerangi keletihan kronik.',
        indications: ['Chronic Fatigue', 'Prolapse', 'Spontaneous Sweating', 'Low Energy'],
        ingredients: [
            { name: 'Astragalus (Huang Qi)', nameZh: '黄芪', weight: '15g' },
            { name: 'Ginseng (Ren Shen)', nameZh: '人参', weight: '9g' },
            { name: 'White Atractylodes (Bai Zhu)', nameZh: '白术', weight: '9g' },
            { name: 'Licorice Root (Zhi Gan Cao)', nameZh: '炙甘草', weight: '6g' },
            { name: 'Angelica (Dang Gui)', nameZh: '当归', weight: '6g' },
            { name: 'Bupleurum (Chai Hu)', nameZh: '柴胡', weight: '6g' },
            { name: 'Cimicifuga (Sheng Ma)', nameZh: '升麻', weight: '3g' },
            { name: 'Tangerine Peel (Chen Pi)', nameZh: '陈皮', weight: '6g' },
        ],
        productType: 'granules',
        price: 88.00,
        currency: 'MYR',
        quantity: '7 sachets (1 week supply)',
        servingsPerPack: 7,
        preparationTime: '5 minutes',
        inStock: true,
        estimatedDelivery: '2-3 business days',
        pharmacyPartner: 'Thye Shan Medical Hall',
        pharmacyLocation: 'Petaling Jaya',
        isPopular: true,
    },
    liu_wei_di_huang_wan: {
        id: 'liu_wei_di_huang_wan',
        formulaName: 'Six Flavor Rehmannia Pill',
        formulaNameZh: '六味地黄丸',
        formulaNameMs: 'Pil Rehmannia Enam Rasa',
        description: 'The classic formula for nourishing Kidney Yin. Addresses symptoms like night sweats, hot flashes, and lower back weakness.',
        descriptionZh: '滋肾阴的经典方剂。适用于盗汗、潮热、腰膝酸软等症状。',
        descriptionMs: 'Formula klasik untuk menyuburkan Yin Buah Pinggang. Menangani gejala seperti peluh malam dan kelemahan pinggang.',
        indications: ['Kidney Yin Deficiency', 'Night Sweats', 'Hot Flashes', 'Lower Back Pain'],
        ingredients: [
            { name: 'Rehmannia (Shu Di Huang)', nameZh: '熟地黄', weight: '24g' },
            { name: 'Cornus (Shan Zhu Yu)', nameZh: '山茱萸', weight: '12g' },
            { name: 'Dioscorea (Shan Yao)', nameZh: '山药', weight: '12g' },
            { name: 'Alisma (Ze Xie)', nameZh: '泽泻', weight: '9g' },
            { name: 'Poria (Fu Ling)', nameZh: '茯苓', weight: '9g' },
            { name: 'Moutan (Mu Dan Pi)', nameZh: '牡丹皮', weight: '9g' },
        ],
        productType: 'capsules',
        price: 58.00,
        currency: 'MYR',
        quantity: '120 capsules (1 month supply)',
        servingsPerPack: 30,
        preparationTime: 'Ready to take',
        inStock: true,
        estimatedDelivery: '2-3 business days',
        pharmacyPartner: 'Hai-O',
        pharmacyLocation: 'Shah Alam',
        isPopular: true,
    },
    si_wu_tang: {
        id: 'si_wu_tang',
        formulaName: 'Four Substance Decoction',
        formulaNameZh: '四物汤',
        formulaNameMs: 'Ramuan Empat Bahan',
        description: 'The foundational blood-nourishing formula, especially beneficial for women. Addresses blood deficiency symptoms like pale complexion and irregular menstruation.',
        descriptionZh: '滋血养血的基础方剂，对女性特别有益。适用于面色苍白、月经不调等血虚症状。',
        descriptionMs: 'Formula asas untuk menyuburkan darah, terutamanya bermanfaat untuk wanita.',
        indications: ['Blood Deficiency', 'Pale Complexion', 'Dizziness', 'Irregular Menstruation'],
        ingredients: [
            { name: 'Rehmannia (Shu Di Huang)', nameZh: '熟地黄', weight: '12g' },
            { name: 'Angelica (Dang Gui)', nameZh: '当归', weight: '9g' },
            { name: 'White Peony (Bai Shao)', nameZh: '白芍', weight: '9g' },
            { name: 'Ligusticum (Chuan Xiong)', nameZh: '川芎', weight: '6g' },
        ],
        productType: 'tea_bags',
        price: 48.00,
        currency: 'MYR',
        quantity: '14 tea bags (2 week supply)',
        servingsPerPack: 14,
        preparationTime: '10 minutes steeping',
        inStock: true,
        estimatedDelivery: '2-3 business days',
        pharmacyPartner: 'Yu Ren Tang',
        pharmacyLocation: 'George Town',
    },
    xiao_yao_san: {
        id: 'xiao_yao_san',
        formulaName: 'Free & Easy Wanderer',
        formulaNameZh: '逍遥散',
        formulaNameMs: 'Serbuk Pengembara Bebas',
        description: 'The go-to formula for Liver Qi stagnation with Spleen deficiency. Perfect for stress, mood swings, and digestive issues.',
        descriptionZh: '治疗肝郁脾虚的首选方剂。适用于压力、情绪波动和消化问题。',
        descriptionMs: 'Formula utama untuk stagnasi Qi Hati dengan kekurangan Limpa. Sesuai untuk tekanan dan masalah pencernaan.',
        indications: ['Liver Qi Stagnation', 'Stress', 'Mood Swings', 'PMS', 'Poor Appetite'],
        ingredients: [
            { name: 'Bupleurum (Chai Hu)', nameZh: '柴胡', weight: '9g' },
            { name: 'Angelica (Dang Gui)', nameZh: '当归', weight: '9g' },
            { name: 'White Peony (Bai Shao)', nameZh: '白芍', weight: '9g' },
            { name: 'White Atractylodes (Bai Zhu)', nameZh: '白术', weight: '9g' },
            { name: 'Poria (Fu Ling)', nameZh: '茯苓', weight: '9g' },
            { name: 'Licorice Root (Zhi Gan Cao)', nameZh: '炙甘草', weight: '6g' },
            { name: 'Ginger (Sheng Jiang)', nameZh: '生姜', weight: '3g' },
            { name: 'Mint (Bo He)', nameZh: '薄荷', weight: '3g' },
        ],
        productType: 'granules',
        price: 72.00,
        currency: 'MYR',
        quantity: '7 sachets (1 week supply)',
        servingsPerPack: 7,
        preparationTime: '5 minutes',
        inStock: true,
        estimatedDelivery: '2-3 business days',
        pharmacyPartner: 'Beijing Tong Ren Tang',
        pharmacyLocation: 'Kuala Lumpur',
        isPopular: true,
    },
    jin_gui_shen_qi_wan: {
        id: 'jin_gui_shen_qi_wan',
        formulaName: 'Golden Cabinet Kidney Qi Pill',
        formulaNameZh: '金匮肾气丸',
        formulaNameMs: 'Pil Qi Ginjal Kabinet Emas',
        description: 'Warms and tonifies Kidney Yang. Ideal for cold extremities, frequent urination at night, and lower back coldness.',
        descriptionZh: '温补肾阳。适用于四肢冰冷、夜尿频多、腰部畏寒等症状。',
        descriptionMs: 'Menghangatkan dan menguatkan Yang Buah Pinggang. Sesuai untuk anggota badan sejuk dan kerap kencing malam.',
        indications: ['Kidney Yang Deficiency', 'Cold Extremities', 'Frequent Night Urination', 'Lower Back Coldness'],
        ingredients: [
            { name: 'Rehmannia (Shu Di Huang)', nameZh: '熟地黄', weight: '24g' },
            { name: 'Cornus (Shan Zhu Yu)', nameZh: '山茱萸', weight: '12g' },
            { name: 'Dioscorea (Shan Yao)', nameZh: '山药', weight: '12g' },
            { name: 'Alisma (Ze Xie)', nameZh: '泽泻', weight: '9g' },
            { name: 'Poria (Fu Ling)', nameZh: '茯苓', weight: '9g' },
            { name: 'Moutan (Mu Dan Pi)', nameZh: '牡丹皮', weight: '9g' },
            { name: 'Aconite (Fu Zi)', nameZh: '附子', weight: '3g' },
            { name: 'Cinnamon Bark (Rou Gui)', nameZh: '肉桂', weight: '3g' },
        ],
        productType: 'capsules',
        price: 68.00,
        currency: 'MYR',
        quantity: '90 capsules (1 month supply)',
        servingsPerPack: 30,
        preparationTime: 'Ready to take',
        inStock: true,
        estimatedDelivery: '2-3 business days',
        pharmacyPartner: 'Hai-O',
        pharmacyLocation: 'Penang',
    },
    gui_pi_tang: {
        id: 'gui_pi_tang',
        formulaName: 'Restore the Spleen Decoction',
        formulaNameZh: '归脾汤',
        formulaNameMs: 'Ramuan Pemulihan Limpa',
        description: 'Tonifies both Qi and Blood while calming the spirit. Excellent for insomnia, anxiety, and overthinking with fatigue.',
        descriptionZh: '补气血、安神志。适用于失眠、焦虑、思虑过度伴疲劳。',
        descriptionMs: 'Menguatkan Qi dan Darah sambil menenangkan jiwa. Sangat baik untuk insomnia dan kebimbangan.',
        indications: ['Heart-Spleen Deficiency', 'Insomnia', 'Anxiety', 'Poor Memory', 'Fatigue'],
        ingredients: [
            { name: 'Ginseng (Ren Shen)', nameZh: '人参', weight: '9g' },
            { name: 'Astragalus (Huang Qi)', nameZh: '黄芪', weight: '12g' },
            { name: 'White Atractylodes (Bai Zhu)', nameZh: '白术', weight: '9g' },
            { name: 'Poria (Fu Ling)', nameZh: '茯苓', weight: '9g' },
            { name: 'Longan (Long Yan Rou)', nameZh: '龙眼肉', weight: '9g' },
            { name: 'Ziziphus (Suan Zao Ren)', nameZh: '酸枣仁', weight: '9g' },
            { name: 'Angelica (Dang Gui)', nameZh: '当归', weight: '9g' },
            { name: 'Polygala (Yuan Zhi)', nameZh: '远志', weight: '6g' },
        ],
        productType: 'granules',
        price: 85.00,
        currency: 'MYR',
        quantity: '7 sachets (1 week supply)',
        servingsPerPack: 7,
        preparationTime: '5 minutes',
        inStock: true,
        estimatedDelivery: '2-3 business days',
        pharmacyPartner: 'Eu Yan Sang',
        pharmacyLocation: 'Johor Bahru',
    },
    er_chen_tang: {
        id: 'er_chen_tang',
        formulaName: 'Two Aged Herb Decoction',
        formulaNameZh: '二陈汤',
        formulaNameMs: 'Ramuan Dua Herba Tua',
        description: 'The foundational formula for resolving phlegm-dampness. Ideal for chronic cough with phlegm, chest congestion, and nausea.',
        descriptionZh: '化痰祛湿的基础方剂。适用于慢性咳嗽有痰、胸闷、恶心等症状。',
        descriptionMs: 'Formula asas untuk menyelesaikan kahak-lembapan. Sesuai untuk batuk kronik dengan kahak.',
        indications: ['Phlegm-Dampness', 'Chronic Cough', 'Chest Congestion', 'Nausea'],
        ingredients: [
            { name: 'Pinellia (Ban Xia)', nameZh: '半夏', weight: '12g' },
            { name: 'Tangerine Peel (Chen Pi)', nameZh: '陈皮', weight: '12g' },
            { name: 'Poria (Fu Ling)', nameZh: '茯苓', weight: '9g' },
            { name: 'Licorice Root (Zhi Gan Cao)', nameZh: '炙甘草', weight: '6g' },
        ],
        productType: 'tea_bags',
        price: 42.00,
        currency: 'MYR',
        quantity: '14 tea bags (2 week supply)',
        servingsPerPack: 14,
        preparationTime: '10 minutes steeping',
        inStock: true,
        estimatedDelivery: '2-3 business days',
        pharmacyPartner: 'Sin Huat Medical Hall',
        pharmacyLocation: 'Ipoh',
    },
    bao_he_wan: {
        id: 'bao_he_wan',
        formulaName: 'Preserve Harmony Pill',
        formulaNameZh: '保和丸',
        formulaNameMs: 'Pil Keharmonian',
        description: 'Relieves food stagnation and promotes digestion. Perfect after overeating or for chronic indigestion.',
        descriptionZh: '消食导滞、促进消化。适用于暴饮暴食后或慢性消化不良。',
        descriptionMs: 'Melegakan kesesakan makanan dan menggalakkan pencernaan. Sesuai selepas makan berlebihan.',
        indications: ['Food Stagnation', 'Indigestion', 'Bloating', 'Acid Reflux'],
        ingredients: [
            { name: 'Hawthorn (Shan Zha)', nameZh: '山楂', weight: '12g' },
            { name: 'Medicated Leaven (Shen Qu)', nameZh: '神曲', weight: '9g' },
            { name: 'Radish Seed (Lai Fu Zi)', nameZh: '莱菔子', weight: '9g' },
            { name: 'Pinellia (Ban Xia)', nameZh: '半夏', weight: '9g' },
            { name: 'Tangerine Peel (Chen Pi)', nameZh: '陈皮', weight: '6g' },
            { name: 'Poria (Fu Ling)', nameZh: '茯苓', weight: '6g' },
            { name: 'Forsythia (Lian Qiao)', nameZh: '连翘', weight: '6g' },
        ],
        productType: 'capsules',
        price: 38.00,
        currency: 'MYR',
        quantity: '60 capsules (2 week supply)',
        servingsPerPack: 14,
        preparationTime: 'Ready to take',
        inStock: true,
        estimatedDelivery: '2-3 business days',
        pharmacyPartner: 'Thye Shan Medical Hall',
        pharmacyLocation: 'Kuala Lumpur',
    },
};

// Helper function to get recommended products based on diagnosis
export function getRecommendedProducts(diagnosis: string): HerbalProduct[] {
    // Normalize diagnosis string
    const normalizedDiagnosis = diagnosis
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .replace(/\s+/g, '_');

    // Find matching products
    let productIds: string[] = [];

    // Check direct match
    if (DIAGNOSIS_TO_PRODUCTS[normalizedDiagnosis]) {
        productIds = DIAGNOSIS_TO_PRODUCTS[normalizedDiagnosis];
    } else {
        // Try to find partial matches
        for (const [key, ids] of Object.entries(DIAGNOSIS_TO_PRODUCTS)) {
            if (normalizedDiagnosis.includes(key.replace(/_/g, '')) ||
                key.replace(/_/g, '').includes(normalizedDiagnosis.replace(/_/g, ''))) {
                productIds = [...productIds, ...ids];
            }
        }
    }

    // Remove duplicates and get products
    const uniqueIds = [...new Set(productIds)];
    const products = uniqueIds
        .map(id => HERBAL_PRODUCTS[id])
        .filter(Boolean);

    // If no matches found, return popular products
    if (products.length === 0) {
        return Object.values(HERBAL_PRODUCTS)
            .filter(p => p.isPopular)
            .slice(0, 3);
    }

    return products;
}

// Helper function to get product by formula name
export function getProductByFormulaName(formulaName: string): HerbalProduct | undefined {
    const normalizedName = formulaName.toLowerCase();

    return Object.values(HERBAL_PRODUCTS).find(product =>
        product.formulaName.toLowerCase().includes(normalizedName) ||
        product.formulaNameZh.includes(formulaName) ||
        normalizedName.includes(product.formulaName.toLowerCase().split(' ')[0])
    );
}

// Format price for display
export function formatPrice(price: number, currency: string = 'MYR'): string {
    return `${currency} ${price.toFixed(2)}`;
}

// Get product type label
export function getProductTypeLabel(
    type: HerbalProduct['productType'],
    language: 'en' | 'zh' | 'ms' = 'en'
): string {
    const labels = {
        tea_bags: { en: 'Tea Bags', zh: '茶包', ms: 'Beg Teh' },
        granules: { en: 'Granules', zh: '颗粒剂', ms: 'Granul' },
        raw_herbs: { en: 'Raw Herbs', zh: '中药饮片', ms: 'Herba Mentah' },
        capsules: { en: 'Capsules', zh: '胶囊', ms: 'Kapsul' },
    };
    return labels[type]?.[language] || labels[type]?.en || type;
}
