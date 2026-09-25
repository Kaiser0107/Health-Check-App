# Patient Health Monitoring App — Project Plan

> **File:** `context/health-monitor-app.md`
> **Created:** 2026-09-18 | **Updated:** 2026-09-24
> **Status:** APPROVED — Build in progress (see roadmap)
>
> 📌 Related files:
> - [`requirements.md`](./patient_health_monitoring_app_requirements.md) — Full feature requirements
> - [`roadmap.md`](./roadmap.md) — Incremental milestone build tracker ← **Start here when building**

---

## Overview

Build a **Patient Health Monitoring App** using **React Native + Expo** (managed workflow SDK 54 / Expo Go / Expo Snack).

This application allows **patients, caregivers, teachers, nurses, or healthcare personnel** to record basic patient information and vital health measurements. The app automatically calculates BMI, evaluates the entered health data against standard healthcare thresholds, saves records locally, and displays an updated health monitoring dashboard.

### Core Sections:
1. **Patient Information & Health Data Entry**: Patient ID and demographics form + 7 vitals entry form with live interactive BMI calculation.
2. **Health Monitoring Dashboard**: Patient summary card, overall health status badge, and individual vital cards with status evaluation.

### Build Strategy: Skeleton-First

> 🔴 **Foundation before design.** Build the full logical skeleton first — data models, storage wiring, BMI logic, navigation shell, state management — before visual polish is applied.

```
Bootstrap & Schemas  →  Data Layer (Storage & Context)  →  Forms & Screens
                                 ↓
                   Dashboard & History Charts  →  Verification
```

---

## Project Type

> 🔴 **MOBILE** — Primary agent: `mobile-developer`

---

## Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Domain | Patient Health Monitoring | Used by patients, caregivers, teachers, nurses, or healthcare staff |
| Platform | React Native + Expo Managed (Expo Go & Snack) | Easiest setup, SDK 54 compatibility, cross-platform |
| Backend / Storage | 100% Local-First (`AsyncStorage`) | Zero setup needed to run immediately; works offline and on Expo Snack with 0 runtime dependencies |
| Patient ID | Captured in Patient Info Form | Allows unique tracking of patient records |
| Profile Picture | `expo-image-picker` (camera + photo library) stored as base64 URI in `AsyncStorage` | No server upload needed; local-first; Snack-compatible |
| Device UUID | UUID generated on first launch, stored in `AsyncStorage` | Internal stable device/instance identifier |
| Styling | React Native `StyleSheet` API | Separated from logic; no utility-class library |
| Build order | Skeleton-first, design second | Correct logic before visual polish |
| History charts | Yes — line chart per vital | Meaningful trend visibility |
| **Splash Screen** | **Animated Drop Logo screen** (`app/splash.tsx`) | Branded entry point; appears on every app launch, reload, and sign out |
| **Authentication** | **Username & Password** (Firebase Auth with internal domain) | No real email required; unique usernames with persistent cloud auth |
| **Login Screen** | **Dedicated screen** (`app/login.tsx`) — Sign In Only | Public register removed; Admin provisions all patient accounts |
| **Two Roles Only** | **Admin vs User/Patient** | Simplified 2-tier role hierarchy; User and Patient are 1:1 identical |
| **Admin Role** | Hardcoded list in `constants/adminUsers.ts` | High security, tamper-proof, non-elevatable |
| **Patient Provisioning** | Ephemeral Secondary Firebase App (`lib/auth.ts`) | Admin provisions patient credentials without being logged out |
| **Patient Data Scope** | `patientId` (Firebase UID) as storage key namespace | Prevents cross-patient data leakage on shared device |
| **Web Reload & Sign Out** | Route to Drop Logo (`/splash`) before Login | Ensures reload and sign-out always replay drop logo animation cleanly |
| **Date Selection** | `DatePickerField` modal with year jump | Replaces manual typing; prevents date formatting issues & auto-calculates age |
| **Country Phone Formatting** | `CountryPhoneInput` with Philippines 🇵🇭 default | Country selector dialog formatting calling code + national digits (+63) |
| **Admin Patient Edit** | `updatePatient` modal in Patients tab | Allows Admins to update patient demographics post-creation |

---

## Why Username & Password + Local-First Health Data?

1. **Frictionless Authentication** — Users do not need a personal or corporate email address to use the health app. They simply pick a username and password.
2. **Hardcoded Admin Management** — The app developer manually controls who holds the Admin role via `constants/adminUsers.ts`.
3. **Full Offline Reliability for Health Data** — All health records are stored locally in `AsyncStorage`. The app functions reliably in clinics, schools, homes, and remote areas without internet.
4. **Simulator & Snack Ready** — Deterministic local storage and offline demo fallback ensure the app runs anywhere for testing and grading.

---

## Role Limitations & Security Boundaries (2 Roles Only)

### User / Patient Account Limitations:
- **Dashboard & Settings Only**: Patients can only access their personal **Dashboard** and **Settings** (for sign out). `Patients`, `Log Health`, `History`, and `My Info` are hidden.
- **Embedded Demographics**: Personal demographics are displayed directly on the top card of the personal Dashboard.
- **No Self-Registration**: Accounts are provisioned solely by clinical Administrators.
- **No Cross-Patient Access**: The user cannot view, select, edit, or delete any other patient's data.
- **Context-Locked**: `currentPatientId` is permanently locked to `user.uid`. All vitals displayed are strictly the user's own.

### Administrator Capabilities:
- **Sole Account Provisioning**: Only Admins can create or delete User/Patient accounts.
- **Roster & Clinical Management**: Admins select patients from the roster, monitor vitals on the dashboard, record clinical measurements, and review history.
- **Session Preservation**: Admin account creation uses an ephemeral secondary Firebase app so the Admin session is never interrupted.

---

## Success Criteria

- [x] Patient profile (Patient Information) fully editable with all fields (Patient ID, Full Name, Age, Sex, Date of Birth, Contact, Address)
- [x] Patient profile picture: camera / photo library picker with circular avatar display
- [x] Health data entry covers all 7 vitals (Heart Rate, BP, Temp, SpO2, Weight, Height, Blood Sugar)
- [x] BMI auto-calculates and updates reactively on weight/height change
- [x] BMI category label (Underweight / Normal / Overweight / Obese) displays correctly
- [x] **Splash Screen:** Drop Logo animation plays on cold app launch
- [x] **Login Screen:** Username & Password sign-in and account registration (no email required)
- [x] **Auth gate:** Unauthenticated users cannot reach tabs; signed-in users skip login
- [x] **Dashboard:** Role-aware health overview (Patient metrics vs Admin patient monitoring)
- [x] **Settings:** Role badge (`ADMINISTRATOR` vs `PATIENT`), System status, and Sign Out
- [x] Admin username list in `constants/adminUsers.ts` correctly assigns admin role
- [x] Admin can see all registered patients in the Patients tab and add new patients via modal
- [x] Admin can delete a patient record
- [x] Patient cannot see the Patients admin tab
- [x] Data is scoped per-patientId (no cross-patient data leakage)
- [ ] Health History shows past records with a line chart per vital
- [x] All records persist to AsyncStorage and survive app restart (100% Local-First)
- [x] App runs on Android and iOS via Expo Go and Expo Snack without errors
- [ ] Styles are in separate `StyleSheet` files — no inline styles, no NativeWind
- [x] No purple/violet hex codes in UI

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | React Native (Expo Managed SDK 54) | Cross-platform, Snack & Expo Go compatibility |
| Navigation | Expo Router + Universal `App.tsx` | Native tab routing + Snack simulator support |
| State | React Context (`AppContext.tsx`) | Lightweight reactive state; zero boilerplate |
| Storage | `@react-native-async-storage/async-storage` | 100% Local-First; zero account friction; offline |
| Auth | Username & Password (Firebase Auth + virtual domain) | No real email required; persistent auth state |
| User ID | `AsyncStorage` UUID (`lib/uuid.ts`) | Internal stable device identifier |
| Charts | `react-native-gifted-charts` | Expo-compatible line charts |
| Forms | `react-hook-form` + `zod` + `lib/zodResolver.ts` | Type-safe validation without subpath export issues |
| Date Picker | `@react-native-community/datetimepicker` | Native modal calendar picker |
| Image Picker | `expo-image-picker` | Camera + photo library access for profile picture |
| Styling | React Native `StyleSheet` API | Native, separated from logic — no NativeWind |
| Icons | `@expo/vector-icons` | Built into Expo SDK |
| Date | `date-fns` | Lightweight date formatting |
| Role System | `constants/adminUsers.ts` + Firestore `users/{uid}` | Hardcoded username list for admin role assignment |

> **Removed:** `nativewind`, `tailwindcss`, `@hookform/resolvers`

---

## File Structure

```
Health Check App/
├── app/
│   ├── splash.tsx                # Splash Screen (Drop Logo animation)
│   ├── login.tsx                 # Login Screen (Firebase Email/Password Auth)
│   ├── (tabs)/
│   │   ├── index.tsx             # Dashboard (Health Overview)
│   │   ├── my-info.tsx           # My Information (personal profile)
│   │   ├── log-health.tsx        # Log Health Data
│   │   ├── history.tsx           # Health History + Charts
│   │   ├── patients.tsx          # Admin-only: Patient list with CRUD
│   │   └── settings.tsx          # Settings
│   ├── _layout.tsx               # Root layout (auth state gate → Splash → Login → Tabs)
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
│   ├── firebase.ts               # Firebase Firestore & Auth init
│   ├── firestore.ts              # CRUD & Admin helpers
│   ├── auth.ts                   # signIn, register, signOut, resolveAppUser
│   ├── bmi.ts                    # BMI calculation + category logic
│   ├── storage.ts                # Per-patient AsyncStorage helpers
│   └── uuid.ts                   # UUID generation + AsyncStorage persistence
│
├── hooks/
│   ├── useMyInfo.ts
│   ├── useHealthData.ts
│   └── useBMI.ts
│
├── context/
│   ├── AppContext.tsx             # Global state (user info + records)
│   └── AuthContext.tsx            # Firebase auth state + role
│
├── schemas/
│   └── health.schema.ts          # Zod schemas for all inputs & roles
│
├── constants/
│   ├── thresholds.ts             # Normal ranges per vital
│   ├── theme.ts                  # Design tokens (colours, spacing, font sizes)
│   └── adminEmails.ts            # Admin email whitelist
│
├── context/ (project docs)
│   ├── patient_health_monitoring_app_requirements.md
│   ├── roadmap.md
│   └── health-monitor-app.md     ← this file
│
├── .env.example                  # Environment variables template
├── firestore.rules               # Firestore security rules
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
users/{uid}/                      ← user metadata & role (created on registration)
  ├── uid: string                 ← Firebase Auth UID
  ├── email: string
  ├── role: "admin" | "patient"   ← resolved from ADMIN_EMAILS whitelist
  └── createdAt: string (ISO)

patients/{patientId}/             ← patient demographic profile
  ├── patientId?: string          ← optional hospital/school ID
  ├── fullName: string
  ├── age: number
  ├── sex: "Male" | "Female"
  ├── dateOfBirth: string (ISO)
  ├── contactNumber: string
  ├── address: string
  └── profilePicture?: string     ← base64 data URI

patients/{patientId}/records/{recordId}  ← vital health log entries (sub-collection)
  ├── timestamp: string (ISO)
  ├── heartRate: number           (BPM)
  ├── systolic: number            (mmHg)
  ├── diastolic: number           (mmHg)
  ├── temperature: number         (°C)
  ├── oxygenLevel: number         (%)
  ├── weight: number              (kg)
  ├── height: number              (cm)
  ├── bmi: number                 (auto-computed)
  ├── bmiCategory: "Underweight" | "Normal" | "Overweight" | "Obese"
  ├── bloodSugar: number          (mg/dL)
  ├── bloodSugarType: "Fasting" | "Random" | "Other"
  └── syncedAt?: Timestamp
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
- [ ] Firebase Auth sign-in state persists across app restarts
- [ ] Firestore security rules enforce patient data scoping (`patients/{patientId}`)
- [ ] Admin role stored in `users/{uid}/role` and verified against `constants/adminEmails.ts`
- [ ] `.env` and `google-services.json` listed in `.gitignore`
- [ ] Local storage scoped by `patientId` (no data leakage on shared device)

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
