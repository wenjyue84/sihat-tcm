export interface Author {
  id: string;
  name: string;
  role: string;
  bio: {
    en: string;
    ms: string;
    zh: string;
  };
  avatar: string; // URL to image
  socials?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export const authors: Record<string, Author> = {
  "dr-ai": {
    id: "dr-ai",
    name: "Dr. AI (TCM)",
    role: "AI Health Consultant",
    bio: {
      en: "An advanced AI model trained on traditional Chinese medicine principles and modern diagnostics. Validated by certified TCM practitioners.",
      ms: "Model AI canggih yang dilatih berdasarkan prinsip perubatan tradisional Cina dan diagnostik moden. Disahkan oleh pengamal TCM bertauliah.",
      zh: "基于传统中医理论和现代诊断技术训练的高级 AI 模型。由认证中医师验证。",
    },
    avatar: "/authors/dr-ai.png", // Ensure this image exists or use a placeholder
  },
  "sihat-team": {
    id: "sihat-team",
    name: "Sihat TCM Team",
    role: "Editorial Team",
    bio: {
      en: "A dedicated team of health enthusiasts, developers, and TCM researchers committed to bringing digital health solutions to everyone.",
      ms: "Pasukan berdedikasi yang terdiri daripada peminat kesihatan, pembangun, dan penyelidik TCM yang komited untuk membawa penyelesaian kesihatan digital kepada semua.",
      zh: "由健康爱好者、开发人员和中医研究人员组成的专业团队，致力于为大家带来数字健康解决方案。",
    },
    avatar: "/authors/sihat-team.png",
  },
  "tcm-expert": {
    id: "tcm-expert",
    name: "Dr. Lim Wei Hong",
    role: "Senior TCM Practioner",
    bio: {
      en: "Licensed TCM practitioner with over 15 years of clinical experience. Specializes in acupuncture and herbal medicine.",
      ms: "Pengamal TCM berlesen dengan lebih 15 tahun pengalaman klinikal. Pakar dalam akupunktur dan perubatan herba.",
      zh: "拥有超过15年临床经验的执业中医师。专长于针灸和草药医学。",
    },
    avatar: "/authors/dr-lim.jpg",
    socials: {
      linkedin: "https://linkedin.com",
    },
  },
};

export function getAuthor(id: string): Author {
  return authors[id] || authors["sihat-team"];
}
