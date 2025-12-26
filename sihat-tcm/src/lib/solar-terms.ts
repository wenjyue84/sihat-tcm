import { Solar, Lunar } from 'lunar-javascript';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SolarTerm {
    name: string;
    nameZh: string;
    nameMs: string;
    date: Date;
    season: Season;
    healthFocus: {
        en: string;
        zh: string;
        ms: string;
    };
    recommendedFoods: {
        en: string[];
        zh: string[];
        ms: string[];
    };
    lifestyleAdvice: {
        en: string;
        zh: string;
        ms: string;
    };
}

// Solar terms names (24 节气)
const SOLAR_TERMS_NAMES: Array<{
    name: string;
    nameZh: string;
    nameMs: string;
    season: Season;
    healthFocus: { en: string; zh: string; ms: string };
    recommendedFoods: { en: string[]; zh: string[]; ms: string[] };
    lifestyleAdvice: { en: string; zh: string; ms: string };
}> = [
        {
            name: 'Beginning of Spring',
            nameZh: '立春',
            nameMs: 'Permulaan Musim Bunga',
            season: 'spring',
            healthFocus: {
                en: 'Nourish the Liver, Promote Qi Flow',
                zh: '养肝理气，升发阳气',
                ms: 'Pelihara Hati, Galakkan Aliran Qi',
            },
            recommendedFoods: {
                en: ['Spinach', 'Leeks', 'Spring Onions'],
                zh: ['菠菜', '韭菜', '春笋'],
                ms: ['Bayam', 'Daun Bawang', 'Rebung'],
            },
            lifestyleAdvice: {
                en: 'Wake early, stretch often, avoid anger',
                zh: '早睡早起，多伸展，戒怒',
                ms: 'Bangun awal, regangkan badan, elakkan marah',
            },
        },
        {
            name: 'Rain Water',
            nameZh: '雨水',
            nameMs: 'Air Hujan',
            season: 'spring',
            healthFocus: {
                en: 'Strengthen Spleen, Dispel Dampness',
                zh: '健脾祛湿，调和脾胃',
                ms: 'Kuatkan Limpa, Hapuskan Lembapan',
            },
            recommendedFoods: {
                en: ['Red Dates', 'Yam', 'Ginger'],
                zh: ['红枣', '山药', '生姜'],
                ms: ['Kurma Merah', 'Ubi', 'Halia'],
            },
            lifestyleAdvice: {
                en: 'Keep warm, avoid cold foods, moderate exercise',
                zh: '保暖防寒，少食生冷，适度运动',
                ms: 'Jaga suhu badan, elakkan makanan sejuk',
            },
        },
        {
            name: 'Awakening of Insects',
            nameZh: '惊蛰',
            nameMs: 'Kebangkitan Serangga',
            season: 'spring',
            healthFocus: {
                en: 'Calm the Liver, Nourish Yin',
                zh: '平肝息风，滋阴润燥',
                ms: 'Tenangkan Hati, Pelihara Yin',
            },
            recommendedFoods: {
                en: ['Pears', 'Honey', 'Lotus Root'],
                zh: ['梨', '蜂蜜', '莲藕'],
                ms: ['Pir', 'Madu', 'Akar Teratai'],
            },
            lifestyleAdvice: {
                en: 'Stay calm, avoid stress, rest well',
                zh: '心平气和，避免焦虑，充足睡眠',
                ms: 'Kekal tenang, elakkan tekanan, rehat cukup',
            },
        },
        {
            name: 'Spring Equinox',
            nameZh: '春分',
            nameMs: 'Ekuinoks Musim Bunga',
            season: 'spring',
            healthFocus: {
                en: 'Balance Yin and Yang',
                zh: '阴阳平衡，调和气血',
                ms: 'Seimbangkan Yin dan Yang',
            },
            recommendedFoods: {
                en: ['Eggs', 'Almonds', 'Mushrooms'],
                zh: ['鸡蛋', '杏仁', '香菇'],
                ms: ['Telur', 'Badam', 'Cendawan'],
            },
            lifestyleAdvice: {
                en: 'Balanced routine, moderate activity',
                zh: '作息规律，适度活动',
                ms: 'Rutin seimbang, aktiviti sederhana',
            },
        },
        {
            name: 'Clear and Bright',
            nameZh: '清明',
            nameMs: 'Cerah dan Terang',
            season: 'spring',
            healthFocus: {
                en: 'Soothe the Liver, Clear Heat',
                zh: '疏肝清热，祛湿解毒',
                ms: 'Redakan Hati, Hapuskan Panas',
            },
            recommendedFoods: {
                en: ['Chrysanthemum Tea', 'Bamboo Shoots', 'Tofu'],
                zh: ['菊花茶', '竹笋', '豆腐'],
                ms: ['Teh Kekwa', 'Rebung', 'Tauhu'],
            },
            lifestyleAdvice: {
                en: 'Outdoor walks, light exercise, stay hydrated',
                zh: '户外散步，轻运动，多饮水',
                ms: 'Berjalan di luar, senaman ringan',
            },
        },
        {
            name: 'Grain Rain',
            nameZh: '谷雨',
            nameMs: 'Hujan Bijirin',
            season: 'spring',
            healthFocus: {
                en: 'Nourish Stomach, Dispel Dampness',
                zh: '健脾养胃，祛湿化浊',
                ms: 'Pelihara Perut, Hapuskan Lembapan',
            },
            recommendedFoods: {
                en: ['Millet', 'Corn', 'Barley'],
                zh: ['小米', '玉米', '薏米'],
                ms: ['Bijan', 'Jagung', 'Barli'],
            },
            lifestyleAdvice: {
                en: 'Avoid dampness, dry clothes well',
                zh: '避免潮湿，衣物晾干',
                ms: 'Elakkan lembapan, keringkan pakaian',
            },
        },
        {
            name: 'Beginning of Summer',
            nameZh: '立夏',
            nameMs: 'Permulaan Musim Panas',
            season: 'summer',
            healthFocus: {
                en: 'Nourish the Heart, Clear Heat',
                zh: '养心安神，清热解暑',
                ms: 'Pelihara Jantung, Hapuskan Panas',
            },
            recommendedFoods: {
                en: ['Watermelon', 'Bitter Melon', 'Mung Beans'],
                zh: ['西瓜', '苦瓜', '绿豆'],
                ms: ['Tembikai', 'Peria', 'Kacang Hijau'],
            },
            lifestyleAdvice: {
                en: 'Stay cool, rest at noon, hydrate often',
                zh: '防暑降温，午间休息，多喝水',
                ms: 'Sejukkan badan, rehat tengah hari',
            },
        },
        {
            name: 'Grain Buds',
            nameZh: '小满',
            nameMs: 'Tunas Bijirin',
            season: 'summer',
            healthFocus: {
                en: 'Clear Heat, Strengthen Spleen',
                zh: '清热健脾，祛湿利水',
                ms: 'Hapuskan Panas, Kuatkan Limpa',
            },
            recommendedFoods: {
                en: ['Cucumber', 'Winter Melon', 'Celery'],
                zh: ['黄瓜', '冬瓜', '芹菜'],
                ms: ['Timun', 'Labu Air', 'Saderi'],
            },
            lifestyleAdvice: {
                en: 'Light meals, avoid greasy food',
                zh: '清淡饮食，忌油腻',
                ms: 'Makanan ringan, elakkan berminyak',
            },
        },
        {
            name: 'Grain in Ear',
            nameZh: '芒种',
            nameMs: 'Bijirin Berjendul',
            season: 'summer',
            healthFocus: {
                en: 'Clear Heat, Calm the Spirit',
                zh: '清热养阴，安神定志',
                ms: 'Hapuskan Panas, Tenangkan Jiwa',
            },
            recommendedFoods: {
                en: ['Lotus Seeds', 'Lily Bulbs', 'Green Tea'],
                zh: ['莲子', '百合', '绿茶'],
                ms: ['Biji Teratai', 'Bunga Bakung', 'Teh Hijau'],
            },
            lifestyleAdvice: {
                en: 'Stay indoors during peak heat, meditate',
                zh: '避开高温时段，静心冥想',
                ms: 'Elakkan panas terik, bermeditasi',
            },
        },
        {
            name: 'Summer Solstice',
            nameZh: '夏至',
            nameMs: 'Solstis Musim Panas',
            season: 'summer',
            healthFocus: {
                en: 'Nourish Yin, Clear Heart Fire',
                zh: '滋阴降火，养心安神',
                ms: 'Pelihara Yin, Hapuskan Api Jantung',
            },
            recommendedFoods: {
                en: ['Tomatoes', 'Strawberries', 'Lemon Water'],
                zh: ['番茄', '草莓', '柠檬水'],
                ms: ['Tomato', 'Strawberi', 'Air Lemon'],
            },
            lifestyleAdvice: {
                en: 'Sleep earlier, wake early, avoid cold showers',
                zh: '早睡早起，忌冷水浴',
                ms: 'Tidur awal, bangun awal, elakkan mandi sejuk',
            },
        },
        {
            name: 'Minor Heat',
            nameZh: '小暑',
            nameMs: 'Panas Kecil',
            season: 'summer',
            healthFocus: {
                en: 'Clear Summer Heat, Replenish Qi',
                zh: '清暑益气，健脾化湿',
                ms: 'Hapuskan Panas Musim Panas, Isi Qi',
            },
            recommendedFoods: {
                en: ['Ginseng', 'Lotus Root', 'Barley Tea'],
                zh: ['西洋参', '莲藕', '大麦茶'],
                ms: ['Ginseng', 'Akar Teratai', 'Teh Barli'],
            },
            lifestyleAdvice: {
                en: 'Avoid prolonged sun exposure, rest well',
                zh: '避免长时间暴晒，充足休息',
                ms: 'Elakkan pendedahan matahari lama',
            },
        },
        {
            name: 'Major Heat',
            nameZh: '大暑',
            nameMs: 'Panas Besar',
            season: 'summer',
            healthFocus: {
                en: 'Clear Extreme Heat, Protect Heart',
                zh: '清热解暑，护心养阴',
                ms: 'Hapuskan Panas Melampau, Lindungi Jantung',
            },
            recommendedFoods: {
                en: ['Coconut Water', 'Peaches', 'Mint'],
                zh: ['椰子水', '桃子', '薄荷'],
                ms: ['Air Kelapa', 'Pic', 'Pudina'],
            },
            lifestyleAdvice: {
                en: 'Stay in cool places, avoid strenuous work',
                zh: '保持凉爽，避免剧烈劳作',
                ms: 'Tempat sejuk, elakkan kerja berat',
            },
        },
        {
            name: 'Beginning of Autumn',
            nameZh: '立秋',
            nameMs: 'Permulaan Musim Luruh',
            season: 'autumn',
            healthFocus: {
                en: 'Nourish Lungs, Moisten Dryness',
                zh: '润肺养阴，防燥护肺',
                ms: 'Pelihara Paru-paru, Lembapkan Kekeringan',
            },
            recommendedFoods: {
                en: ['Pears', 'White Fungus', 'Sesame'],
                zh: ['梨', '银耳', '芝麻'],
                ms: ['Pir', 'Cendawan Putih', 'Bijan'],
            },
            lifestyleAdvice: {
                en: 'Adjust sleep schedule, avoid dry environments',
                zh: '调整作息，避免干燥环境',
                ms: 'Sesuaikan jadual tidur, elakkan kering',
            },
        },
        {
            name: 'End of Heat',
            nameZh: '处暑',
            nameMs: 'Tamat Panas',
            season: 'autumn',
            healthFocus: {
                en: 'Nourish Yin, Calm the Heart',
                zh: '滋阴润燥，养心安神',
                ms: 'Pelihara Yin, Tenangkan Hati',
            },
            recommendedFoods: {
                en: ['Honey', 'Tremella', 'Apples'],
                zh: ['蜂蜜', '银耳', '苹果'],
                ms: ['Madu', 'Tremella', 'Epal'],
            },
            lifestyleAdvice: {
                en: 'Gradual transition, keep warm in evenings',
                zh: '逐步过渡，晚间保暖',
                ms: 'Peralihan beransur, jaga suhu malam',
            },
        },
        {
            name: 'White Dew',
            nameZh: '白露',
            nameMs: 'Embun Putih',
            season: 'autumn',
            healthFocus: {
                en: 'Nourish Lungs, Strengthen Immunity',
                zh: '养肺润燥，增强体质',
                ms: 'Pelihara Paru-paru, Tingkatkan Imuniti',
            },
            recommendedFoods: {
                en: ['Longan', 'Walnuts', 'Lily Bulbs'],
                zh: ['龙眼', '核桃', '百合'],
                ms: ['Longan', 'Walnut', 'Bunga Bakung'],
            },
            lifestyleAdvice: {
                en: 'Wear layers, avoid cold feet',
                zh: '适当添衣，勿受凉',
                ms: 'Pakai berlapis, jaga kaki dari sejuk',
            },
        },
        {
            name: 'Autumn Equinox',
            nameZh: '秋分',
            nameMs: 'Ekuinoks Musim Luruh',
            season: 'autumn',
            healthFocus: {
                en: 'Balance Yin and Yang',
                zh: '平衡阴阳，调和脏腑',
                ms: 'Seimbangkan Yin dan Yang',
            },
            recommendedFoods: {
                en: ['Sweet Potatoes', 'Pumpkin', 'Chestnuts'],
                zh: ['红薯', '南瓜', '栗子'],
                ms: ['Ubi Keledek', 'Labu', 'Berangan'],
            },
            lifestyleAdvice: {
                en: 'Balanced diet, regular sleep',
                zh: '饮食均衡，作息规律',
                ms: 'Diet seimbang, tidur teratur',
            },
        },
        {
            name: 'Cold Dew',
            nameZh: '寒露',
            nameMs: 'Embun Sejuk',
            season: 'autumn',
            healthFocus: {
                en: 'Warm Yang, Nourish Yin',
                zh: '温养阳气，滋阴润燥',
                ms: 'Hangatkan Yang, Pelihara Yin',
            },
            recommendedFoods: {
                en: ['Dates', 'Ginger Tea', 'Persimmons'],
                zh: ['大枣', '姜茶', '柿子'],
                ms: ['Kurma', 'Teh Halia', 'Kesemek'],
            },
            lifestyleAdvice: {
                en: 'Keep feet warm, soak feet before bed',
                zh: '足部保暖，睡前泡脚',
                ms: 'Jaga kaki hangat, rendam kaki sebelum tidur',
            },
        },
        {
            name: "Frost's Descent",
            nameZh: '霜降',
            nameMs: 'Turun Fros',
            season: 'autumn',
            healthFocus: {
                en: 'Nourish Stomach, Warm Body',
                zh: '健脾养胃，温补身体',
                ms: 'Pelihara Perut, Hangatkan Badan',
            },
            recommendedFoods: {
                en: ['Radish', 'Beef', 'Ginger Soup'],
                zh: ['白萝卜', '牛肉', '姜汤'],
                ms: ['Lobak Putih', 'Daging Lembu', 'Sup Halia'],
            },
            lifestyleAdvice: {
                en: 'Dress warmly, avoid catching cold',
                zh: '注意保暖，防止受寒',
                ms: 'Pakai pakaian hangat, elakkan sejuk',
            },
        },
        {
            name: 'Beginning of Winter',
            nameZh: '立冬',
            nameMs: 'Permulaan Musim Sejuk',
            season: 'winter',
            healthFocus: {
                en: 'Nourish Kidneys, Store Essence',
                zh: '补肾藏精，温阳固本',
                ms: 'Pelihara Buah Pinggang, Simpan Esensi',
            },
            recommendedFoods: {
                en: ['Mutton', 'Black Beans', 'Chestnuts'],
                zh: ['羊肉', '黑豆', '栗子'],
                ms: ['Daging Kambing', 'Kacang Hitam', 'Berangan'],
            },
            lifestyleAdvice: {
                en: 'Sleep more, conserve energy',
                zh: '早睡晚起，养精蓄锐',
                ms: 'Tidur lebih banyak, simpan tenaga',
            },
        },
        {
            name: 'Minor Snow',
            nameZh: '小雪',
            nameMs: 'Salji Kecil',
            season: 'winter',
            healthFocus: {
                en: 'Warm Body, Nourish Kidneys',
                zh: '温补肾阳，御寒保暖',
                ms: 'Hangatkan Badan, Pelihara Buah Pinggang',
            },
            recommendedFoods: {
                en: ['Walnuts', 'Black Sesame', 'Ginger'],
                zh: ['核桃', '黑芝麻', '生姜'],
                ms: ['Walnut', 'Bijan Hitam', 'Halia'],
            },
            lifestyleAdvice: {
                en: 'Keep head and feet warm, avoid cold',
                zh: '头部足部保暖，避免寒冷',
                ms: 'Jaga kepala dan kaki hangat',
            },
        },
        {
            name: 'Major Snow',
            nameZh: '大雪',
            nameMs: 'Salji Besar',
            season: 'winter',
            healthFocus: {
                en: 'Tonify Yang, Store Energy',
                zh: '温阳补虚，藏精蓄锐',
                ms: 'Kuatkan Yang, Simpan Tenaga',
            },
            recommendedFoods: {
                en: ['Chinese Yam', 'Angelica Root', 'Goji Berries'],
                zh: ['山药', '当归', '枸杞'],
                ms: ['Ubi Cina', 'Akar Angelica', 'Goji'],
            },
            lifestyleAdvice: {
                en: 'Reduce outdoor activity, stay warm indoors',
                zh: '减少户外活动，室内保暖',
                ms: 'Kurangkan aktiviti luar, duduk dalam',
            },
        },
        {
            name: 'Winter Solstice',
            nameZh: '冬至',
            nameMs: 'Solstis Musim Sejuk',
            season: 'winter',
            healthFocus: {
                en: 'Nourish Kidneys and Yin, Tonify Yang',
                zh: '补肾养阴，温阳固本',
                ms: 'Pelihara Buah Pinggang dan Yin, Kuatkan Yang',
            },
            recommendedFoods: {
                en: ['Mutton', 'Walnuts', 'Black Beans'],
                zh: ['羊肉', '核桃', '黑豆'],
                ms: ['Daging Kambing', 'Walnut', 'Kacang Hitam'],
            },
            lifestyleAdvice: {
                en: 'Sleep early, wake late, stay warm and avoid cold',
                zh: '早睡晚起，避寒保暖',
                ms: 'Tidur awal, bangun lewat, jaga suhu badan',
            },
        },
        {
            name: 'Minor Cold',
            nameZh: '小寒',
            nameMs: 'Sejuk Kecil',
            season: 'winter',
            healthFocus: {
                en: 'Tonify Kidneys, Protect Yang',
                zh: '补肾护阳，防寒御冷',
                ms: 'Kuatkan Buah Pinggang, Lindungi Yang',
            },
            recommendedFoods: {
                en: ['Glutinous Rice', 'Lamb', 'Cinnamon'],
                zh: ['糯米', '羊肉', '桂圆'],
                ms: ['Beras Pulut', 'Daging Kambing', 'Kayu Manis'],
            },
            lifestyleAdvice: {
                en: 'Avoid cold wind, wear warm clothes',
                zh: '避免寒风，穿暖衣物',
                ms: 'Elakkan angin sejuk, pakai pakaian hangat',
            },
        },
        {
            name: 'Major Cold',
            nameZh: '大寒',
            nameMs: 'Sejuk Besar',
            season: 'winter',
            healthFocus: {
                en: 'Maximum Yang Tonification, Prepare for Spring',
                zh: '温阳补虚，为春做准备',
                ms: 'Maksimumkan Kuasa Yang, Sedia untuk Musim Bunga',
            },
            recommendedFoods: {
                en: ['Chicken Soup', 'Ginger', 'Garlic'],
                zh: ['鸡汤', '生姜', '大蒜'],
                ms: ['Sup Ayam', 'Halia', 'Bawang Putih'],
            },
            lifestyleAdvice: {
                en: 'Rest well, prepare body for spring transition',
                zh: '充分休息，为春季过渡做准备',
                ms: 'Rehat cukup, sediakan badan untuk musim bunga',
            },
        },
    ];

/**
 * Get current solar term based on current date
 */
export function getCurrentSolarTerm(): SolarTerm {
    const today = Solar.fromDate(new Date());
    const solarTerms = getSolarTermsForYear(today.getYear());

    // Find the current solar term
    const now = new Date().getTime();
    for (let i = solarTerms.length - 1; i >= 0; i--) {
        if (solarTerms[i].date.getTime() <= now) {
            return solarTerms[i];
        }
    }

    // If we're before the first solar term of the year, return the last solar term of previous year
    const previousYearTerms = getSolarTermsForYear(today.getYear() - 1);
    return previousYearTerms[previousYearTerms.length - 1];
}

/**
 * Get all 24 solar terms for a specific year
 */
export function getSolarTermsForYear(year: number): SolarTerm[] {
    const solarTerms: SolarTerm[] = [];

    // The lunar-javascript library provides solar term dates
    // We fetch JieQi tables from both start and end of year to ensure we cover the full Gregorian year
    // as Lunar years don't align perfectly with Gregorian years.
    const lunarStart = Lunar.fromDate(new Date(year, 0, 1));
    const lunarEnd = Lunar.fromDate(new Date(year, 11, 31));
    const table1 = (lunarStart as any).getJieQiTable();
    const table2 = (lunarEnd as any).getJieQiTable();

    // Combine all entries and filter for the current Gregorian year
    const allEntries = [...Object.entries(table1), ...Object.entries(table2)];

    SOLAR_TERMS_NAMES.forEach((termData, index) => {
        // Find the solar term date that matches the name and is within the requested year
        const matchedEntry = allEntries.find(([key, solarDate]: [string, any]) => {
            // Check if name matches
            if (!key.includes(termData.nameZh)) return false;

            // Check if year matches (solarDate is a Solar object from lunar-javascript)
            return solarDate.getYear() === year;
        });

        let termDate: Date;
        if (matchedEntry) {
            const solarObj = matchedEntry[1] as Solar;
            // solarObj is a Solar object, we can convert it to Date
            // Note: lunar-javascript Solar months are 1-based, JS Date months are 0-based
            termDate = new Date(solarObj.getYear(), solarObj.getMonth() - 1, solarObj.getDay());
        } else {
            // Fallback: approximate dates based on solar term index
            const approximateDates = [
                [2, 4], [2, 19], [3, 6], [3, 21], [4, 5], [4, 20], // Spring
                [5, 6], [5, 21], [6, 6], [6, 21], [7, 7], [7, 23], // Summer
                [8, 8], [8, 23], [9, 8], [9, 23], [10, 8], [10, 23], // Autumn
                [11, 7], [11, 22], [12, 7], [12, 22], [1, 6], [1, 20], // Winter
            ];
            const [month, day] = approximateDates[index];
            termDate = new Date(year, month - 1, day);
        }

        solarTerms.push({
            ...termData,
            date: termDate,
        });
    });

    return solarTerms.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get the next solar term after a given date
 */
export function getNextSolarTerm(fromDate: Date = new Date()): SolarTerm {
    const year = fromDate.getFullYear();
    const solarTerms = [
        ...getSolarTermsForYear(year),
        ...getSolarTermsForYear(year + 1),
    ];

    const now = fromDate.getTime();
    for (const term of solarTerms) {
        if (term.date.getTime() > now) {
            return term;
        }
    }

    return solarTerms[0];
}

/**
 * Get solar terms in a range (for timeline display)
 */
export function getSolarTermsInRange(
    startDate: Date,
    endDate: Date
): SolarTerm[] {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    let allTerms: SolarTerm[] = [];
    for (let year = startYear; year <= endYear; year++) {
        allTerms = [...allTerms, ...getSolarTermsForYear(year)];
    }

    return allTerms.filter(
        (term) =>
            term.date.getTime() >= startDate.getTime() &&
            term.date.getTime() <= endDate.getTime()
    );
}

/**
 * Get color for a season
 */
export function getSeasonColor(season: Season): string {
    const colors = {
        spring: '#10b981', // emerald-500
        summer: '#ef4444', // red-500
        autumn: '#f59e0b', // amber-500
        winter: '#3b82f6', // blue-500
    };
    return colors[season];
}

/**
 * Get background gradient for a season
 */
export function getSeasonGradient(season: Season): string {
    const gradients = {
        spring: 'from-emerald-500 to-green-600',
        summer: 'from-red-500 to-orange-600',
        autumn: 'from-amber-500 to-yellow-600',
        winter: 'from-blue-500 to-cyan-600',
    };
    return gradients[season];
}

/**
 * Check if a solar term has passed
 */
export function hasSolarTermPassed(term: SolarTerm): boolean {
    return term.date.getTime() < new Date().getTime();
}

/**
 * Check if a solar term is current (within ±7 days)
 */
export function isCurrentSolarTerm(term: SolarTerm): boolean {
    const now = new Date().getTime();
    const termTime = term.date.getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    return Math.abs(now - termTime) <= sevenDays;
}
