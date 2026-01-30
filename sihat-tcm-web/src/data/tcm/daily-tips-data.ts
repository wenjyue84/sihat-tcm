/**
 * Daily Tips Data
 * Static data definitions for TCM health tips generator.
 */

export interface DietTip {
    food: string;
    effect: string;
    icon: string;
}

// Constitution-based diet advice (体质饮食建议)
export const CONSTITUTION_DIET_TIPS: Record<string, DietTip[]> = {
    平和质: [
        { food: "五谷杂粮", effect: "保持均衡营养", icon: "🌾" },
        { food: "时令蔬果", effect: "顺应自然", icon: "🥬" },
        { food: "适量肉类", effect: "补充蛋白质", icon: "🥩" },
    ],
    气虚质: [
        { food: "黄芪山药粥", effect: "补气健脾", icon: "🍚" },
        { food: "红枣桂圆茶", effect: "益气养血", icon: "🍵" },
        { food: "鸡肉香菇汤", effect: "补中益气", icon: "🍲" },
    ],
    阳虚质: [
        { food: "羊肉当归汤", effect: "温补肾阳", icon: "🍲" },
        { food: "生姜红糖茶", effect: "温中散寒", icon: "🍵" },
        { food: "核桃芝麻糊", effect: "补肾温阳", icon: "🥣" },
    ],
    阴虚质: [
        { food: "银耳雪梨汤", effect: "滋阴润肺", icon: "🍐" },
        { food: "百合莲子粥", effect: "养阴安神", icon: "🍚" },
        { food: "枸杞菊花茶", effect: "滋阴明目", icon: "🍵" },
    ],
    痰湿质: [
        { food: "薏米红豆粥", effect: "健脾祛湿", icon: "🍚" },
        { food: "冬瓜荷叶茶", effect: "化痰利湿", icon: "🍵" },
        { food: "山楂陈皮水", effect: "消食化痰", icon: "🫖" },
    ],
    湿热质: [
        { food: "绿豆汤", effect: "清热利湿", icon: "🍵" },
        { food: "苦瓜炒蛋", effect: "清热解毒", icon: "🥒" },
        { food: "白茅根竹蔗水", effect: "清热祛湿", icon: "🫖" },
    ],
    血瘀质: [
        { food: "山楂红糖水", effect: "活血化瘀", icon: "🫖" },
        { food: "黑木耳红枣", effect: "补血活血", icon: "🍄" },
        { food: "玫瑰花茶", effect: "疏肝理气", icon: "🌹" },
    ],
    气郁质: [
        { food: "玫瑰花茶", effect: "疏肝解郁", icon: "🌹" },
        { food: "佛手柑茶", effect: "理气宽胸", icon: "🍵" },
        { food: "柑橘类水果", effect: "理气开胃", icon: "🍊" },
    ],
    特禀质: [
        { food: "黄芪防风茶", effect: "固表防过敏", icon: "🍵" },
        { food: "灵芝煲汤", effect: "调节免疫", icon: "🍲" },
        { food: "益生菌食品", effect: "调理肠道", icon: "🥛" },
    ],
};

export const GENERAL_TIPS: DietTip[] = [
    { food: "温开水", effect: "晨起一杯，润肠通便", icon: "💧" },
    { food: "五色蔬果", effect: "营养均衡，五脏调和", icon: "🌈" },
    { food: "适量运动", effect: "气血通畅，强身健体", icon: "🏃" },
];

// Meridian Organ Clock (子午流注)
export const ORGAN_CLOCK = [
    { hour: 23, organ: "胆", organEn: "Gallbladder", advice: "宜入睡，养胆疏肝" },
    { hour: 1, organ: "肝", organEn: "Liver", advice: "深度睡眠，肝血回流" },
    { hour: 3, organ: "肺", organEn: "Lung", advice: "熟睡养肺，切勿熬夜" },
    { hour: 5, organ: "大肠", organEn: "Large Intestine", advice: "起床排毒，饮温水" },
    { hour: 7, organ: "胃", organEn: "Stomach", advice: "早餐时辰，宜营养丰富" },
    { hour: 9, organ: "脾", organEn: "Spleen", advice: "脾经当令，宜清淡早餐" },
    { hour: 11, organ: "心", organEn: "Heart", advice: "午时养心，可小憩片刻" },
    { hour: 13, organ: "小肠", organEn: "Small Intestine", advice: "分清浊，午餐消化时" },
    { hour: 15, organ: "膀胱", organEn: "Bladder", advice: "多饮水，排毒利尿" },
    { hour: 17, organ: "肾", organEn: "Kidney", advice: "补肾时辰，可适度运动" },
    { hour: 19, organ: "心包", organEn: "Pericardium", advice: "舒畅情志，散步轻运动" },
    { hour: 21, organ: "三焦", organEn: "Triple Burner", advice: "准备休息，勿过劳" },
] as const;

// Solar Terms (24 节气) - Simple version for daily tips
export const SIMPLE_SOLAR_TERMS = [
    { name: "立春", nameEn: "Start of Spring", month: 2, day: 4, advice: "春季养肝，宜食韭菜、春笋" },
    { name: "雨水", nameEn: "Rain Water", month: 2, day: 19, advice: "调养脾胃，少食辛辣" },
    { name: "惊蛰", nameEn: "Awakening of Insects", month: 3, day: 6, advice: "宜清淡饮食，多食梨" },
    { name: "春分", nameEn: "Spring Equinox", month: 3, day: 21, advice: "阴阳平衡，多食时令蔬菜" },
    { name: "清明", nameEn: "Pure Brightness", month: 4, day: 5, advice: "宜食青团、螺蛳" },
    { name: "谷雨", nameEn: "Grain Rain", month: 4, day: 20, advice: "祛湿养肝，喝绿茶" },
    { name: "立夏", nameEn: "Start of Summer", month: 5, day: 6, advice: "养心护心，清淡饮食" },
    { name: "小满", nameEn: "Grain Buds", month: 5, day: 21, advice: "清热健脾，多食苦瓜" },
    { name: "芒种", nameEn: "Grain in Ear", month: 6, day: 6, advice: "清热祛湿，少食油腻" },
    { name: "夏至", nameEn: "Summer Solstice", month: 6, day: 21, advice: "阳盛阴衰，防暑降温" },
    { name: "小暑", nameEn: "Minor Heat", month: 7, day: 7, advice: "清补为主，绿豆汤" },
    { name: "大暑", nameEn: "Major Heat", month: 7, day: 23, advice: "防暑降温，多饮清凉茶" },
    { name: "立秋", nameEn: "Start of Autumn", month: 8, day: 8, advice: "润肺养阴，食银耳莲子" },
    { name: "处暑", nameEn: "End of Heat", month: 8, day: 23, advice: "滋阴润燥，少食辛辣" },
    { name: "白露", nameEn: "White Dew", month: 9, day: 8, advice: "养阴润肺，食梨、百合" },
    { name: "秋分", nameEn: "Autumn Equinox", month: 9, day: 23, advice: "平衡阴阳，调养脾胃" },
    { name: "寒露", nameEn: "Cold Dew", month: 10, day: 8, advice: "防寒保暖，温补脾胃" },
    { name: "霜降", nameEn: "Frost Descent", month: 10, day: 24, advice: "温补为主，食栗子" },
    { name: "立冬", nameEn: "Start of Winter", month: 11, day: 7, advice: "冬季进补，羊肉汤" },
    { name: "小雪", nameEn: "Minor Snow", month: 11, day: 22, advice: "温补肾阳，食黑芝麻" },
    { name: "大雪", nameEn: "Major Snow", month: 12, day: 7, advice: "固护阳气，进补正当时" },
    { name: "冬至", nameEn: "Winter Solstice", month: 12, day: 22, advice: "一阳来复，饺子汤圆" },
    { name: "小寒", nameEn: "Minor Cold", month: 1, day: 6, advice: "御寒保暖，温补为主" },
    { name: "大寒", nameEn: "Major Cold", month: 1, day: 20, advice: "补气养血，迎接春天" },
] as const;
