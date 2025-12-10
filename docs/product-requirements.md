# 🛠 Product Requirements Document (PRD)

## 1. Core Identity

- **Product Name:** Stochi (`stochi_`)
- **Tagline:** "Balance your chemistry."
- **Core Persona:** "Nikita the Developer" / "The Quantified Self"
  - **Needs:** Speed, Data Density, Privacy, Hardware-level Security.
  - **Hates:** Passwords, Gamification, "Loading..." spinners.
- **Platform:** Mobile-First PWA (Progressive Web App) + Desktop Command Center.

## 2. Functional Specifications

### A. Authentication (The "Hacker" Flow)

- **Provider:** BetterAuth.
- **Method:** **Passkey First** (TouchID / FaceID).
- **Why:** Biohackers hate passwords. Biometric login reinforces the "High Security Vault" vibe.
- **Fallback:** Magic Link (Email). No social logins (Google/Facebook) to minimize privacy leakage.

### B. The "Fast Log" UX (Mobile Priority)

- **Goal:** < 3 seconds to log a daily stack.
- **Interface:** "Stack Bundles" (e.g., [ Morning Protocol ] button).
- **Input:** Natural Language Command Bar (Desktop/Mobile).
  - Command: `/log mag 200mg` -> Automapped to `Magnesium Bisglycinate`.

### C. The Interaction Engine (The Core Value)

- **Logic:** Must detect three types of conflict:
  1. **Stoichiometric Imbalance:** (e.g., Zinc:Copper ratio > 15:1).
  2. **Absorption Block:** (e.g., Taking Fat-Soluble Vitamin D with Black Coffee = 0% Absorption).
  3. **Pharmacokinetic:** (e.g., Piperine inhibiting CYP3A4, potentiating other drugs).
- **Output:** Traffic Light System (Green/Yellow/Red) with deep-links to PubMed papers.

### D. Data Sovereignty

- **Export:** Full JSON/CSV dump of user data available instantly.
- **Local-First Feel:** The PWA must cache the user's stack offline so they can view it in a gym with no signal.

## 3. The "Anti-Features" (Do NOT Build)

1. **Native iOS/Android App:** We are building a PWA. Do not waste time on the App Store review process.
2. **Social Feeds:** No "Share your stack with friends." Privacy is paramount.
3. **Calorie Counting:** We track _molecules_ (Mg, Zn, Li), not macros.

## 4. UX/UI Philosophy

- **Aesthetic:** "Terminal Chic."
- **Colors:** Deep Charcoal (`#0D1117`) background, Neon Green (`#39FF14`) for success, Cyber Cyan (`#00F0FF`) for links.
- **Typography:** **JetBrains Mono** for data/headers. **Inter** for help text.
- **Density:** High. Avoid whitespace. Show the numbers.
