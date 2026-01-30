# Sihat TCM

**AI-Powered Traditional Chinese Medicine Diagnosis System**

Sihat TCM is a digital health platform combining ancient Traditional Chinese Medicine (TCM) wisdom with modern AI. The system provides accessible, personalized, and multi-lingual health consultations.

## Repository Structure

```
sihat-tcm/
├── sihat-tcm-web/     # Next.js 16 web application
├── sihat-tcm-mobile/  # Expo React Native mobile app
├── docs/              # Project documentation
├── tools/             # Utility scripts
└── .claude/           # AI agent configuration
```

## Key Features

- **Four Pillars Diagnosis**: AI-powered analysis using Observation (望), Listening (闻), Inquiry (问), and Palpation (切)
- **Personalized Reports**: Detailed TCM diagnosis and holistic recommendations
- **AI Meal Planner**: Constitution-based personalized 7-day meal plans
- **Snore Analysis**: Sleep sound recording and analysis
- **Vitality Rhythm**: Meridian Organ Clock and 24 Solar Terms guidance
- **Multi-Language**: English, Chinese (Simplified), Bahasa Malaysia

## Tech Stack

| Component | Web | Mobile |
|-----------|-----|--------|
| Framework | Next.js 16 (App Router) | Expo React Native |
| Language | TypeScript | JavaScript |
| Styling | Tailwind CSS v4 | StyleSheet |
| UI | Radix UI, Framer Motion | React Native components |
| Database | Supabase (PostgreSQL) | Supabase |
| AI | Gemini 2.0 Flash (via AI SDK) | @google/generative-ai |

## Quick Start

### Web App

```bash
cd sihat-tcm-web
npm install
npm run dev  # Opens at http://localhost:3100
```

### Mobile App

```bash
cd sihat-tcm-mobile
npm install
npx expo start --clear
```

## For AI Agents

- **Project purpose**: AI-powered TCM diagnostic platform implementing 4-Examination Model (四诊合参)
- **Key directories**:
  - `sihat-tcm-web/src/` — Web app source code
  - `sihat-tcm-mobile/screens/` — Mobile app screens
  - `.claude/` — Agent configuration and rules
- **Constraints**:
  - Web uses TypeScript strict mode; zero `any` types
  - Mobile is JavaScript only (no TypeScript)
  - Follow rules in `.claude/rules/`
- **Critical import**: DiagnosisWizard uses **default export** (not named)

## Documentation

- [Web Developer Guide](./sihat-tcm-web/docs/DEVELOPER_GUIDE.md)
- [User Guide](./sihat-tcm-web/docs/USER_GUIDE.md)
- [Mobile APK Deployment](./sihat-tcm-mobile/docs/APK_DEPLOYMENT.md)
- [Project Rules](./.claude/CLAUDE.md)

## License

Copyright 2024-2026 Sihat TCM. All rights reserved.
