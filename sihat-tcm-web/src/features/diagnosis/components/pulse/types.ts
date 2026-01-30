// Types for PulseCheck component
export interface PulseQuality {
  id: string;
  nameZh: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
}

export interface PulseCheckData {
  bpm: number;
  pulseQualities: { id: string; nameZh: string; nameEn: string }[];
}

// Static Pulse Quality Data
export const tcmPulseQualities: PulseQuality[] = [
  {
    id: "hua",
    nameZh: "滑脉",
    nameEn: "Slippery (Hua)",
    description: "脉来流利圆滑",
    descriptionEn: "Smooth and flowing",
  },
  {
    id: "se",
    nameZh: "涩脉",
    nameEn: "Rough (Se)",
    description: "脉来艰涩不畅",
    descriptionEn: "Unsmooth and hesitant",
  },
  {
    id: "xian",
    nameZh: "弦脉",
    nameEn: "Wiry (Xian)",
    description: "脉来端直如弦",
    descriptionEn: "Taut like a bowstring",
  },
  {
    id: "jin",
    nameZh: "紧脉",
    nameEn: "Tight (Jin)",
    description: "脉来紧张有力",
    descriptionEn: "Tight and forceful",
  },
  {
    id: "xi",
    nameZh: "细脉",
    nameEn: "Thin (Xi)",
    description: "脉来细如丝线",
    descriptionEn: "Fine like a thread",
  },
  {
    id: "hong",
    nameZh: "洪脉",
    nameEn: "Surging (Hong)",
    description: "脉来洪大有力",
    descriptionEn: "Large and forceful",
  },
  {
    id: "ruo",
    nameZh: "弱脉",
    nameEn: "Weak (Ruo)",
    description: "脉来软弱无力",
    descriptionEn: "Soft and weak",
  },
  {
    id: "chen",
    nameZh: "沉脉",
    nameEn: "Deep (Chen)",
    description: "脉位深沉",
    descriptionEn: "Deep, felt only with pressure",
  },
  {
    id: "fu",
    nameZh: "浮脉",
    nameEn: "Floating (Fu)",
    description: "脉位表浅",
    descriptionEn: "Superficial, felt with light touch",
  },
  {
    id: "chi",
    nameZh: "迟脉",
    nameEn: "Slow (Chi)",
    description: "脉来迟缓",
    descriptionEn: "Slow rate",
  },
  {
    id: "shuo",
    nameZh: "数脉",
    nameEn: "Rapid (Shuo)",
    description: "脉来急促",
    descriptionEn: "Fast rate",
  },
  {
    id: "normal",
    nameZh: "平脉",
    nameEn: "Normal (Ping)",
    description: "脉来平和有力",
    descriptionEn: "Normal and balanced",
  },
];

// Conflict map for mutually exclusive pulse qualities
export const pulseQualityConflicts: Record<string, string[]> = {
  xi: ["hong"],
  hong: ["xi", "ruo"],
  ruo: ["hong"],
  hua: ["se"],
  se: ["hua"],
  fu: ["chen"],
  chen: ["fu"],
  chi: ["shuo"],
  shuo: ["chi"],
};
