# Personal Health Monitoring App — Project Plan

> **File:** `context/health-monitor-app.md`
> **Created:** 2026-09-18 | **Updated:** 2026-09-19
> **Status:** APPROVED — Build in progress (see roadmap)
>
> 📌 Related files:
> - [`requirements.md`](./patient_health_monitoring_app_requirements.md) — Full feature requirements
> - [`roadmap.md`](./roadmap.md) — Incremental milestone build tracker ← **Start here when building**

---

## Overview

Build a **personal health tracking app** using **React Native + Expo** (managed workflow / Expo Go). This is a self-use app — the owner logs their own vitals, tracks BMI, and views a personal health dashboard with trend charts. Records sync to **Firebase Firestore** without any authentication layer. Styles are written using the **React Native `StyleSheet` API**, separated from logic in dedicated style files.

### Build Strategy: Skeleton-First

> 🔴 **Foundation before design.** Build the full logical skeleton first — data models, Firebase wiring, BMI logic, navigation shell, state management — before any styling is applied.

```
Phase 4A (Bootstrap)  →  Phase 4B (Logic Layer)  →  Phase 4C (Navigation Shell)
                                    ↓
                       Phase 5 (StyleSheet Design)  →  Phase X (Verification)
```

---

## Project Type

> 🔴 **MOBILE** — Primary agent: `mobile-developer`

---

## Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Platform | React Native + Expo Managed (Expo Go & Snack) | Easiest setup, SDK 54 compatibility, no native code needed |
| Backend / Storage | 100% Local-First (`AsyncStorage`) | Zero setup needed to run immediately; works offline and on Expo Snack with 0 runtime dependencies |
| User ID | UUID generated on first launch, stored in `AsyncStorage` | Stable device identifier without Auth SDK |
| Styling | React Native `StyleSheet` API | Separated from logic; no utility-class library |
| Build order | Skeleton-first, design second | Correct logic before visual polish |
| History charts | Yes — line chart per vital | Meaningful trend visibility |

---

## Why No Authentication?

Firebase Anonymous Auth was removed for the following reasons:

1. **Single user, single device** — there is no scenario where multiple users access the same data.
2. **No sign-in friction** — the app should open and be ready immediately.
3. **Simpler codebase** — no Auth SDK, no token refresh, no sign-in flows.
4. **Equivalent security** — a UUID stored in `AsyncStorage` + Firestore rules restricted to that UUID provides the same data isolation without the Auth overhead.

```
First launch:
  UUID generated → stored in AsyncStorage
  UUID used as Firestore document key (users/{uuid})

Every subsequent launch:
  UUID read from AsyncStorage
  Firestore reads/writes scoped to users/{uuid}
```

---

## Success Criteria

- [x] Personal profile (My Info) fully editable with all 6 fields (Male/Female gender chips, native calendar selector)
- [x] Health data entry covers all 7 vitals (Heart Rate, BP, Temp, SpO₂, Weight, Height, Blood Sugar)
- [x] BMI auto-calculates and updates reactively on weight/height change
- [x] BMI category label (Underweight / Normal / Overweight / Obese) displays correctly
- [ ] Dashboard shows cards for every vital with colour-coded status
- [ ] Health History shows past records with a line chart per vital
- [x] All records persist to AsyncStorage and survive app restart (100% Local-First)
- [x] App runs on Android and iOS via Expo Go and Expo Snack without errors
- [ ] Styles are in separate `StyleSheet` files — no inline styles, no NativeWind
- [ ] No purple/violet hex codes in UI

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | React Native (Expo Managed SDK 54) | Cross-platform, Snack & Expo Go compatibility |
| Navigation | Expo Router + Universal `App.tsx` | Native tab routing + Snack simulator support |
| State | React Context (`AppContext.tsx`) | Lightweight reactive state; zero boilerplate |
| Storage | `@react-native-async-storage/async-storage` | 100% Local-First; zero account friction; offline |
| Auth | ❌ None | Personal app — device UUID in AsyncStorage |
| User ID | `AsyncStorage` UUID (`lib/uuid.ts`) | Stable device identifier without Auth SDK |
| Charts | `react-native-gifted-charts` | Expo-compatible line charts |
| Forms | `react-hook-form` + `zod` + `lib/zodResolver.ts` | Type-safe validation without subpath export issues |
| Date Picker | `@react-native-community/datetimepicker` | Native modal calendar picker |
| Styling | React Native `StyleSheet` API | Native, separated from logic — no NativeWind |
| Icons | `@expo/vector-icons` | Built into Expo SDK |
| Date | `date-fns` | Lightweight date formatting |

> **Removed:** `nativewind`, `tailwindcss`, `firebase`, `firebase/auth`, `@hookform/resolvers`

---

## File Structure

```
Health Check App/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx             # Dashboard (Health Overview)
│   │   ├── my-info.tsx           # My Information (personal profile)
│   │   ├── log-health.tsx        # Log Health Data
│   │   ├── history.tsx           # Health History + Charts
│   │   └── settings.tsx          # Settings
│   ├── _layout.tsx               # Root layout (Firebase init, UUID setup)
│   └── +not-found.tsx
│
├── components/
│   ├── dashboard/
│   │   ├── VitalCard.tsx
│   │   ├── VitalCard.styles.ts   ← styles separated here
│   │   ├── MySummary.tsx
│   │   ├── MySummary.styles.ts
│   │   └── OverallStatus.tsx
│   ├── forms/
│   │   ├── MyInfoForm.tsx
│   │   ├── MyInfoForm.styles.ts
│   │   ├── HealthDataForm.tsx
│   │   ├── HealthDataForm.styles.ts
│   │   └── BloodPressureInput.tsx
│   ├── bmi/
│   │   ├── BMICard.tsx
│   │   └── BMICard.styles.ts
│   ├── charts/
│   │   └── VitalLineChart.tsx
│   └── ui/
│       ├── InputField.tsx
│       ├── InputField.styles.ts
│       ├── StatusBadge.tsx
│       ├── StatusBadge.styles.ts
│       └── SectionHeader.tsx
│
├── styles/
│   └── global.styles.ts          # Shared layout styles (screen wrappers, spacing)
│
├── lib/
│   ├── firebase.ts               # Firebase Firestore init
│   ├── firestore.ts              # CRUD helpers
│   ├── bmi.ts                    # BMI calculation + category logic
│   └── uuid.ts                   # UUID generation + AsyncStorage persistence
│
├── hooks/
│   ├── useMyInfo.ts
│   ├── useHealthData.ts
│   └── useBMI.ts
│
├── context/
│   └── AppContext.tsx             # Global state (user info + records)
│
├── schemas/
│   └── health.schema.ts          # Zod schemas for all inputs
│
├── constants/
│   ├── thresholds.ts             # Normal ranges per vital
│   └── theme.ts                  # Design tokens (colours, spacing, font sizes)
│
├── context/ (project docs)
│   ├── patient_health_monitoring_app_requirements.md
│   └── health-monitor-app.md     ← this file
│
├── app.json
├── babel.config.js
├── package.json
└── tsconfig.json
```

### Styling Convention

Every component that has visual styles follows this pattern:

```
ComponentName.tsx          ← logic, JSX only (no inline styles)
ComponentName.styles.ts    ← StyleSheet.create({ ... }) exported here
```

```ts
// ComponentName.styles.ts
import { StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
});
```

---

## Firebase Data Model

```
users/{uuid}/                     ← top-level document (no Auth)
  ├── fullName: string
  ├── age: number
  ├── sex: string
  ├── dateOfBirth: string (ISO)
  ├── contactNumber: string
  └── address: string

users/{uuid}/records/{autoId}     ← health log entries (sub-collection)
  ├── timestamp: Timestamp
  ├── heartRate: number            (BPM)
  ├── systolic: number             (mmHg)
  ├── diastolic: number            (mmHg)
  ├── temperature: number          (°C)
  ├── oxygenLevel: number          (%)
  ├── weight: number               (kg)
  ├── height: number               (cm)
  ├── bmi: number                  (auto-computed)
  ├── bloodSugar: number           (mg/dL)
  └── bloodSugarType: "Fasting" | "Random" | "Other"
```

---

## Vital Status Thresholds (`constants/thresholds.ts`)

| Vital | Normal | Warning | Critical |
|---|---|---|---|
| Heart Rate | 60–100 BPM | 50–59 / 101–120 | <50 / >120 |
| Systolic BP | 90–120 mmHg | 121–139 | <90 / ≥140 |
| Diastolic BP | 60–80 mmHg | 81–89 | <60 / ≥90 |
| Temperature | 36.1–37.2 °C | 37.3–38.0 | <36.1 / >38.0 |
| Oxygen Level | 95–100% | 90–94% | <90% |
| BMI | 18.5–24.9 | 25–29.9 | <18.5 / ≥30 |
| Blood Sugar (Fasting) | 70–99 mg/dL | 100–125 | <70 / ≥126 |

---

## Task Breakdown

### Phase 4A — Project Bootstrap (Skeleton)

> Goal: Working Expo app with Firebase connected and tab navigation loaded — zero styling.

| ID | Task | INPUT → OUTPUT → VERIFY |
|----|------|--------------------------|
| 4A.0 | Init Expo project | `npx create-expo-app health-check-app --template blank-typescript` → Scaffolded → `npx expo start` shows default screen |
| 4A.1 | Install dependencies | All packages from tech stack (excluding nativewind) → `package.json` updated → no install errors |
| 4A.2 | UUID setup | `lib/uuid.ts` → generates UUID on first launch, stores in `AsyncStorage`, returns same UUID on subsequent launches → verified via `console.log` |
| 4A.3 | Firebase init | `google-services.json` + `lib/firebase.ts` → Firestore initialised → test write/read confirmed in console |
| 4A.4 | Expo Router tab layout | `app/_layout.tsx` + `app/(tabs)/_layout.tsx` → 5 tabs (Dashboard, My Info, Log Health, History, Settings) with placeholder `<Text>` screens → navigation between tabs works |

---

### Phase 4B — Logic Layer (No UI yet)

> Goal: All data logic correct and unit-testable before any component is styled.

| ID | Task | INPUT → OUTPUT → VERIFY |
|----|------|--------------------------|
| 4B.0 | Zod schemas | Requirements spec → `schemas/health.schema.ts` (MyInfoSchema, HealthRecordSchema) → TypeScript types inferred; invalid input throws ZodError |
| 4B.1 | BMI utility | Formula → `lib/bmi.ts` (`calculateBMI`, `getBMICategory`) → `calculateBMI(65, 170)` returns `22.49`; `getBMICategory(22.49)` returns `"Normal"` |
| 4B.2 | Vital status logic | Thresholds table → `constants/thresholds.ts` + `getVitalStatus(vital, value)` helper → returns `"normal"` / `"warning"` / `"critical"` correctly at each boundary |
| 4B.3 | Firestore CRUD helpers | Schema types + Firestore SDK → `lib/firestore.ts` (`saveMyInfo`, `getMyInfo`, `addRecord`, `getRecords`) → manual test: write to Firestore and read back correctly |
| 4B.4 | AppContext + hooks | Firestore helpers + UUID → `context/AppContext.tsx`, `hooks/useMyInfo.ts`, `hooks/useHealthData.ts` → context updates on Firestore snapshot; confirmed via `console.log` |
| 4B.5 | useBMI hook | weight + height from context → `hooks/useBMI.ts` → BMI and category update reactively when weight or height changes |

---

### Phase 4C — Navigation Shell (Unstyled)

> Goal: All screens render real data and forms work end-to-end using plain `<View>` and `<Text>`. No StyleSheet applied yet.

| ID | Task | INPUT → OUTPUT → VERIFY |
|----|------|--------------------------|
| 4C.0 | InputField (unstyled) | `react-hook-form` + zod → `components/ui/InputField.tsx` → Renders input, shows validation error on blur |
| 4C.1 | MyInfoForm (unstyled) | MyInfoSchema → `components/forms/MyInfoForm.tsx` → All 6 fields validate; submit calls `saveMyInfo` |
| 4C.2 | My Info screen wired | MyInfoForm → `app/(tabs)/my-info.tsx` → Data loads from Firestore on mount; edit and save round-trip works |
| 4C.3 | BloodPressureInput (unstyled) | Dual numeric input → `components/forms/BloodPressureInput.tsx` → Accepts integers; feeds systolic + diastolic into form state |
| 4C.4 | HealthDataForm (unstyled) | HealthRecordSchema + useBMI → `components/forms/HealthDataForm.tsx` → All vitals validate; BMI auto-updates; submit adds record to Firestore |
| 4C.5 | Log Health screen wired | HealthDataForm → `app/(tabs)/log-health.tsx` → Submit saves record; success Alert shown |
| 4C.6 | Dashboard (data only) | AppContext + latest record → `app/(tabs)/index.tsx` → Vital values + status strings displayed as plain text |
| 4C.7 | History (data only) | `getRecords` → `app/(tabs)/history.tsx` → Past records listed with timestamps and values; no charts yet |
| 4C.8 | Settings screen | UUID + Firestore delete → `app/(tabs)/settings.tsx` → "Clear all data" deletes Firestore user doc + records; context resets |

---

### Phase 5 — StyleSheet Design

> Goal: Apply React Native `StyleSheet` styles. Logic already proven in Phase 4 — this phase is purely visual.

| ID | Task | INPUT → OUTPUT → VERIFY |
|----|------|--------------------------|
| 5.0 | Theme tokens | Healthcare palette (no purple) → `constants/theme.ts` (colors, spacing, fontSizes, radius) → Imported in all style files |
| 5.1 | Global layout styles | Common patterns → `styles/global.styles.ts` (screen wrapper, scrollContainer, etc.) → Applied to all tab screens |
| 5.2 | StatusBadge styled | Status string + theme → `components/ui/StatusBadge.tsx` + `.styles.ts` → Green / Yellow / Red badge renders |
| 5.3 | InputField styled | `components/ui/InputField.styles.ts` → Consistent field, label, and error styling across all forms |
| 5.4 | VitalCard styled | VitalCard + `.styles.ts` → Card shows value, unit, StatusBadge; styled with theme tokens |
| 5.5 | BMICard styled | `components/bmi/BMICard.styles.ts` → BMI value + category badge, clear visual hierarchy |
| 5.6 | MySummary styled | `components/dashboard/MySummary.styles.ts` → Name and age in styled header |
| 5.7 | Dashboard styled | All VitalCards in grid → `app/(tabs)/index.tsx` → Clean dashboard layout |
| 5.8 | Forms styled | MyInfoForm + HealthDataForm styles → Consistent spacing, labels, error messages |
| 5.9 | History + Charts | `react-native-gifted-charts` → `components/charts/VitalLineChart.tsx` + `app/(tabs)/history.tsx` → Line chart per vital renders with real data |
| 5.10 | Navigation styled | Tab icons + labels → `app/(tabs)/_layout.tsx` → Icons from `@expo/vector-icons`, active tab highlighted |

---

## Agent Assignments

| Phase | Agent | Responsibility |
|---|---|---|
| 4A Bootstrap | `mobile-developer` | Expo init, deps, UUID, Firebase, Router |
| 4B Logic | `mobile-developer` | Schemas, Firestore helpers, BMI utils, thresholds, Context |
| 4C Shell | `mobile-developer` | Unstyled screens and forms wired to real data |
| 5 Design | `mobile-developer` | StyleSheet styles, charts, navigation polish |
| Phase X | `mobile-developer` + `test-engineer` | TypeScript, lint, Expo Go smoke test |

---

## Phase X — Verification Checklist

> ❌ DO NOT mark complete until all pass.

### Code Quality
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npx expo lint` — ESLint passes
- [ ] No `console.error` during manual smoke test
- [ ] No inline styles in any component (all styles in `.styles.ts` files)

### Feature Verification
- [ ] My Info saves to Firestore and reloads on app restart
- [ ] Health record saves and appears in History
- [ ] BMI updates reactively when weight or height changes
- [ ] BMI category badge reflects correct WHO classification
- [ ] StatusBadge shows correct colour at each threshold boundary
- [ ] Line charts render with ≥ 2 data points

### Data / Security
- [ ] UUID persists in `AsyncStorage` across app restarts
- [ ] Firestore reads/writes scoped to `users/{uuid}`
- [ ] No Firebase Auth SDK present in codebase
- [ ] `google-services.json` listed in `.gitignore`

### Accessibility
- [ ] All inputs have `accessibilityLabel`
- [ ] Colour contrast ≥ 4.5:1 on all text

### Design
- [ ] No purple / violet hex codes in theme or any style file
- [ ] All styles defined via `StyleSheet.create` — no inline style objects in JSX
- [ ] Healthcare colour palette applied consistently

### Build
- [ ] `npx expo start` — loads on Expo Go without crash
- [ ] Tested on Android via Expo Go
- [ ] Tested on iOS via Expo Go (if available)
