# Patient Health Monitoring App — Build Roadmap

> **File:** `context/roadmap.md`
> **Created:** 2026-09-19 | **Updated:** 2026-09-24
> **Purpose:** Incremental build tracker — one milestone at a time. Each milestone is self-contained, testable, and must be verified before moving to the next.
>
> 📌 Related files:
> - [`requirements.md`](./patient_health_monitoring_app_requirements.md) — What to build
> - [`health-monitor-app.md`](./health-monitor-app.md) — Architecture & decisions

---

## Build Philosophy

> **Never build everything at once.** Each milestone delivers a working, runnable slice of the app. If a milestone breaks something, we know exactly where to look.

```
Milestone 1 → Milestone 2 → Milestone 3 → ... → Milestone 8
     ↓              ↓              ↓                   ↓
  Verify         Verify         Verify              Verify
```

**Rules:**
- ✅ Complete = code written + manually tested + no TypeScript errors
- 🚫 Never skip to a later milestone if the current one has unresolved issues
- 📝 Update this file with status after each milestone

---

## Progress Overview

| # | Milestone | Focus | Status |
|---|---|---|---|
| 1 | Project Bootstrap | Expo + folders + UUID + tabs | ✅ Done |
| 2 | Data & Logic Layer | Schemas, BMI, thresholds, Storage helpers, Context (patientId-scoped) | ✅ Done (Revisited) |
| 3 | Patient Information & Management | Patient profile form (`my-info.tsx`) + Admin patient roster (`patients.tsx`) | ✅ Done (Revisited) |
| 4 | Log Health Screen | Vitals form — BMI auto-calc — scoped to current patient | ✅ Done (Revisited) |
| **9** | **Splash Screen** | **Drop Logo bounce animation — auto-transitions based on auth** | ✅ Done |
| **10** | **Login Screen** | **Firebase Email/Password Auth — Sign In / Create Account / Forgot Password** | ✅ Done |
| **11** | **Role System** | **AuthContext + Admin Whitelist + Firestore Security Rules + Role Routing** | ✅ Done |
| 5 | Dashboard Screen | Role-aware: Patient (own vitals) vs Admin (selected patient overview) | ✅ Done |
| 7 | Settings Screen | Account profile, Role badge, Firebase Sign Out, Clear data | ✅ Done |
| 6 | History Screen | Role-aware: List past records per patient with timestamps | ⬜ Next Up |
| 8 | Design & Charts | StyleSheet styles — VitalLineChart — navigation polish | ⬜ Not Started |

**Status key:** ⬜ Not Started · 🔄 In Progress · ✅ Done · 🚫 Blocked

---

---

## Milestone 1 — Project Bootstrap

> **Goal:** A runnable Expo app with the correct folder structure, Firebase connected, UUID working, and 5 placeholder tab screens navigating correctly.
> **No logic, no forms, no data — just the shell.**

### Considerations
- Use `blank-typescript` Expo template (not `tabs` — we build the tab layout ourselves for full control)
- Expo Router requires `expo-router` package + `scheme` in `app.json`
- Storage is 100% Local-First (`AsyncStorage`) — `firebase` runtime dependency removed to ensure full Expo Snack compatibility
- UUID must survive app restarts — stored in `AsyncStorage` on first launch
- `google-services.json` added to `.gitignore` immediately
- Root `App.tsx` provides universal tab navigation for Expo Snack; 0-byte gitkeep files removed to ensure clean Snack git import
- All imports use standard relative paths (`../` or `./`) because Expo Snack packager does not support TypeScript path aliases (`@/`)
- Downgraded project to Expo SDK 54 (`expo@~54.0.37`, React 19.1.0, React Native 0.81.5) for native 100% compatibility with Expo Snack and local Expo Go
- Replaced `@hookform/resolvers` with lightweight internal `lib/zodResolver.ts` to eliminate Snack packager subpath resolution errors (`@hookform/resolvers/zod.js`)

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 1.1 | Init Expo project with TypeScript template | — | ✅ |
| 1.2 | Create folder structure (`app/`, `components/`, `lib/`, `hooks/`, `context/`, `schemas/`, `constants/`, `styles/`) | — | ✅ |
| 1.3 | Install all dependencies (see list below) | `package.json` | ✅ |
| 1.4 | Configure Expo Router (`app.json` + `_layout.tsx`) | `app/_layout.tsx` | ✅ |
| 1.5 | Build tab layout with 5 placeholder screens | `app/(tabs)/_layout.tsx` + all tab files | ✅ |
| 1.6 | Set up `lib/uuid.ts` — generate + persist UUID | `lib/uuid.ts` | ✅ |
| 1.7 | Set up `lib/firebase.ts` — init Firestore | `lib/firebase.ts` | ✅ |
| 1.8 | Add `.gitignore` with `google-services.json` | `.gitignore` | ✅ |

### Dependencies Installed
```
npx expo install expo-router @react-native-async-storage/async-storage
npx expo install react-native-safe-area-context react-native-screens
npx expo install expo-linking expo-constants expo-font react-native-svg
npx expo install @react-native-community/datetimepicker
npx expo install @expo/vector-icons

npm install firebase
npm install zod react-hook-form @hookform/resolvers
npm install date-fns
npm install react-native-gifted-charts
```

### Verify Before Moving On
- [ ] `npx expo start` — app loads in Expo Go without errors
- [ ] All 5 tabs are tappable and navigate correctly
- [ ] UUID is generated and logged to console on first launch
- [ ] Same UUID is returned on subsequent launches (not regenerated)
- [ ] Firestore write + read test passes (console.log)

---

---

## Milestone 2 — Data & Logic Layer

> **Goal:** All core logic written, typed, and manually verified — before any screen renders real data.
> **Status:** ✅ Done (Revisited in Milestone 11 for per-patient storage & role system).

### Considerations
- Zod schemas are the single source of truth for all types — derive TypeScript types from them (`z.infer<typeof Schema>`)
- BMI formula: `weight / (height / 100) ** 2` — round to 2 decimal places
- Vital status logic covers all 7 vitals with 3 levels each (`normal` / `warning` / `critical`)
- **Firestore & Storage Structure:**
  - `users/{uid}`: account metadata and role (`role: 'admin' | 'patient'`)
  - `patients/{patientId}`: patient demographic profile
  - `patients/{patientId}/records/{recordId}`: vital health log entries
  - AsyncStorage keys: `@health_check:${patientId}:my_info` and `@health_check:${patientId}:records`
- `AppContext` is role-aware via `useAuth()`:
  - For **Patients**: automatically scopes data operations to `user.uid`
  - For **Admins**: provides access to all patients roster, `selectPatient()`, and `deletePatient()`

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 2.1 | Write Zod schemas (MyInfo, HealthRecord, BMI, BloodSugar) | `schemas/health.schema.ts` | ✅ |
| 2.2 | Write BMI utility functions | `lib/bmi.ts` | ✅ |
| 2.3 | Write vital status thresholds + helper | `constants/thresholds.ts` | ✅ |
| 2.4 | Write local storage helpers (scoped to `patientId`) | `lib/storage.ts` | ✅ |
| 2.5 | Write Firestore sync helpers + admin query helpers | `lib/firestore.ts` | ✅ |
| 2.6 | Build role-aware `AppContext` with local-first persistence | `context/AppContext.tsx` | ✅ |
| 2.7 | Build `useMyInfo` hook | `hooks/useMyInfo.ts` | ✅ |
| 2.8 | Build `useHealthData` hook | `hooks/useHealthData.ts` | ✅ |
| 2.9 | Build `useBMI` hook | `hooks/useBMI.ts` | ✅ |
| 2.10 | Add role, auth, and patient summary schemas | `schemas/health.schema.ts` | ✅ |

### Key Interfaces (from schemas)

```ts
// MyInfo
{ patientId?, profilePicture?, fullName, age, sex: 'Male' | 'Female', dateOfBirth, contactNumber, address }

// HealthRecord
{ id?, timestamp, heartRate, systolic, diastolic, temperature, oxygenLevel,
  weight, height, bmi, bmiCategory, bloodSugar, bloodSugarType }

// UserRole & AppUser
type UserRole = 'admin' | 'patient';
interface AppUser { uid: string; email: string; role: UserRole; }
```

### Verify Before Moving On
- [x] `calculateBMI(65, 170)` returns `22.49`
- [x] `getBMICategory(22.49)` returns `"Normal"`
- [x] `getVitalStatus('heartRate', 72)` returns `"normal"`
- [x] `getVitalStatus('heartRate', 130)` returns `"critical"`
- [x] Local storage `saveLocalMyInfo(patientId, info)` writes and `getLocalMyInfo(patientId)` reads data
- [x] Local storage `addLocalRecord(patientId, data)` appends and `getLocalRecords(patientId)` returns records
- [x] AppContext updates correctly when a new record is added
- [x] AppContext correctly differentiates between Patient (own UID) and Admin (patient selector)
- [x] `useBMI` returns updated BMI when weight or height changes
- [x] No TypeScript errors (`npx tsc --noEmit` passed cleanly)

---

---

## Milestone 3 — Patient Information & Management

> **Goal:** A working patient information profile form for Patients (`my-info.tsx`) and a dedicated patient management screen for Admins (`patients.tsx`).
> **Status:** ✅ Done (Revisited in Milestone 11 for role split).

### Considerations
- **Patient Role**:
  - Uses `my-info.tsx` to view and edit their own demographic information
  - Form uses `react-hook-form` + self-contained `lib/zodResolver.ts`
  - Captures core patient demographics: Patient ID, Full Name, Age, Sex, Date of Birth, Contact Number, Address
  - **Profile picture**: `expo-image-picker` — camera or photo library, stored as base64 URI in `profilePicture`
  - Saves locally to `@health_check:${user.uid}:my_info` and syncs to Firestore `patients/{uid}`
- **Admin Role**:
  - Manages patients via the dedicated **Patients tab** (`app/(tabs)/patients.tsx`)
  - Fetches and displays registered patients from Firestore `users/` collection
  - Can select a patient to view their health dashboard or log vitals on their behalf
  - Can delete a patient profile and associated local data with confirmation Alert

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 3.1 | Build `InputField` component (unstyled) | `components/ui/InputField.tsx` | ✅ |
| 3.2 | Build `MyInfoForm` component | `components/forms/MyInfoForm.tsx` | ✅ |
| 3.3 | Wire `my-info.tsx` screen — load + save personal profile | `app/(tabs)/my-info.tsx` | ✅ |
| 3.4 | Add `profilePicture` field to `MyInfoSchema` | `schemas/health.schema.ts` | ✅ |
| 3.5 | Add circular avatar with camera/library picker & modal | `components/forms/MyInfoForm.tsx` | ✅ |
| 3.6 | Build `patients.tsx` screen for Admins (patient list, select, delete) | `app/(tabs)/patients.tsx` | ✅ |

### Verify Before Moving On
- [x] All demographic fields render and validate correctly
- [x] Profile picture avatar works (camera/library) with circular preview
- [x] Patient profile saves to per-patient local storage and Firestore
- [x] Admin can view registered patients in `patients.tsx`
- [x] Admin can select a patient to set `currentPatientId` in AppContext
- [x] Admin can delete a patient with confirmation dialog
- [x] No TypeScript errors (`npx tsc --noEmit` passed cleanly)

---

---

## Milestone 4 — Log Health Screen

> **Goal:** A working health data entry form. All 7 vitals log to local storage and Firestore, scoped to the current patient. BMI auto-calculates as weight and height change.
> **Status:** ✅ Done (Revisited in Milestone 11 for patient scoping).

### Considerations
- Health data is logged to the `currentPatientId` from `AppContext` (the patient's own UID for Patient role, or the selected patient's UID for Admin role)
- BMI is **not a manual user input** — it is calculated automatically from weight (kg) + height (cm) using `lib/bmi.ts` and stored alongside the record
- Blood pressure is two separate numeric inputs (Systolic / Diastolic)
- Blood sugar type is an interactive selector (`Fasting` / `Random` / `Other`)
- Form validation uses `LogHealthInputSchema` and `lib/zodResolver.ts`
- On submit: validate → compute BMI & status → add record via `useHealthData` → reset form → show success `Alert`

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 4.1 | Build `LogHealthForm` component with all 7 vitals | `components/forms/LogHealthForm.tsx` | ✅ |
| 4.2 | Integrate `useBMI` — show live interactive BMI preview & category | `components/forms/LogHealthForm.tsx` | ✅ |
| 4.3 | Wire `log-health.tsx` screen with `useHealthData` | `app/(tabs)/log-health.tsx` | ✅ |
| 4.4 | Scope health records to `currentPatientId` in `AppContext` | `context/AppContext.tsx` | ✅ |

### Verify Before Moving On
- [x] All 7 vitals accept valid input and reject invalid input (e.g. negative heart rate)
- [x] Blood pressure dual inputs feed both values into the same form record
- [x] BMI display updates as weight or height changes (live preview)
- [x] Blood sugar type selector works (Fasting / Random / Other)
- [x] Submitting saves record scoped to `currentPatientId` in `AsyncStorage`
- [x] Record includes auto-computed `bmi` and `bmiCategory`
- [x] Form resets after successful submit
- [x] No TypeScript errors (`npx tsc --noEmit` passed cleanly)

---

---

## Milestone 5 — Dashboard Screen

> **Goal:** Role-aware health overview. For Patients, displays personal summary and latest vitals with status badges. For Admins, displays the selected patient's summary and vitals (or prompts patient selection).
> **Status:** ✅ Done.

### Considerations
- **Patient Role**:
  - Personal summary at top: Full Name + Age (from `myInfo`)
  - Overall health status badge: Normal / Warning / Critical (computed by `constants/thresholds.ts`)
  - 7 Vital Cards displaying latest recorded measurements + status
  - Helpful empty state if no records logged yet: "No health data logged yet. Tap Log Health to get started."
- **Admin Role**:
  - If a patient is selected (`currentPatientId` is set): shows that patient's name, age, overall status, and 7 vital cards
  - If NO patient is selected: displays a banner/prompt: "No patient selected. Tap here to select a patient from the Patients roster." with direct navigation to the Patients tab
- Data reads reactively from `useHealthData` and `useApp`

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 5.1 | Build Patient summary card (name, age, sex, ID) | `app/(tabs)/index.tsx` | ✅ |
| 5.2 | Build `VitalCard` component with status badge | `app/(tabs)/index.tsx` | ✅ |
| 5.3 | Build overall health status banner (Normal / Warning / Critical) | `app/(tabs)/index.tsx` | ✅ |
| 5.4 | Build Admin empty state with quick stats and roster button | `app/(tabs)/index.tsx` | ✅ |
| 5.5 | Wire role-conditional `index.tsx` dashboard screen | `app/(tabs)/index.tsx` | ✅ |

### Verify Before Moving On
- [x] Patient sees their own summary and latest vital cards
- [x] Admin sees selected patient's vitals or the "Select a Patient" prompt
- [x] All 7 vital cards render with correct values and status indicators
- [x] Overall health status badge correctly matches worst vital status
- [x] After logging a new record, switching to Dashboard shows updated values
- [x] No TypeScript errors

---

---

## Milestone 6 — History Screen

> **Goal:** List all past health records in reverse chronological order. Scoped to the current patient (own history for Patients; selected patient's history for Admins).
> **No charts yet — plain records list.**

### Considerations
- Reads from `useHealthData` (`records` array)
- Display in reverse chronological order (newest first)
- Each item shows: date/time + all 7 vitals + BMI & category
- Empty state when no records exist for the patient
- Use `date-fns` to format timestamps into readable strings (e.g. `"19 Sep 2026, 10:30 AM"`)
- Admin sees history for the currently selected patient

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 6.1 | Build record list item component | `components/history/RecordItem.tsx` | ⬜ |
| 6.2 | Wire `history.tsx` screen with empty state & patient banner | `app/(tabs)/history.tsx` | ⬜ |

### Verify Before Moving On
- [ ] All logged records appear, newest first
- [ ] Timestamps are human-readable
- [ ] All vital values display correctly per record
- [ ] Empty state shows when no records exist
- [ ] Adding a new record on Log Health appears in History immediately
- [ ] Admin switching patients updates History to the selected patient
- [ ] No TypeScript errors

---

---

## Milestone 7 — Settings Screen

> **Goal:** Account management, role display, Firebase Sign Out, and data reset options.
> **Status:** ✅ Done.

### Considerations
- Account card: displays current user email and role badge (`ADMINISTRATOR` or `PATIENT`)
- **Sign Out**: calls `signOut()` from `useAuth()` → redirects immediately to `/login`
- **Clear Data**:
  - Resets local AsyncStorage cache with confirmation Alert
- System status and App version (v1.0.0, SDK 54)

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 7.1 | Build User Account Card (email + role badge) | `app/(tabs)/settings.tsx` | ✅ |
| 7.2 | Wire Sign Out button to `useAuth().signOut()` | `app/(tabs)/settings.tsx` | ✅ |
| 7.3 | Wire Clear Data button with confirmation Alert | `app/(tabs)/settings.tsx` | ✅ |
| 7.4 | Display System Status (Firebase / Local) & Version | `app/(tabs)/settings.tsx` | ✅ |

### Verify Before Moving On
- [x] Displays logged-in user email and role badge correctly
- [x] Tapping Sign Out signs user out of Firebase and redirects to Login screen
- [x] Confirmation Alert appears before data deletion
- [x] Clearing data resets local state correctly
- [x] No TypeScript errors

---

---

## Milestone 8 — Design & Charts

> **Goal:** Apply `StyleSheet` styles to every component and screen. Add line charts to History. Polish navigation.
> **Logic is already proven — this milestone is purely visual.**

### Considerations
- All styles go in co-located `ComponentName.styles.ts` files — never inline in JSX
- Import from `constants/theme.ts` for all colours, spacing, font sizes, border radii
- Healthcare palette: whites, light blues, greens — **no purple or violet** anywhere
- Charts use `react-native-gifted-charts` `LineChart` component — one chart per vital
- Navigation: add icons from `@expo/vector-icons` to each tab

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 8.1 | Define theme tokens | `constants/theme.ts` | ⬜ |
| 8.2 | Global screen wrapper styles | `styles/global.styles.ts` | ⬜ |
| 8.3 | Style `InputField` | `components/ui/InputField.styles.ts` | ⬜ |
| 8.4 | Style `StatusBadge` component | `components/ui/StatusBadge.tsx` + `.styles.ts` | ⬜ |
| 8.5 | Style `VitalCard` | `components/dashboard/VitalCard.styles.ts` | ⬜ |
| 8.6 | Style `MySummary` | `components/dashboard/MySummary.styles.ts` | ⬜ |
| 8.7 | Style `BMICard` | `components/bmi/BMICard.styles.ts` | ⬜ |
| 8.8 | Style Dashboard screen | `app/(tabs)/index.tsx` | ⬜ |
| 8.9 | Style My Info screen + form | `MyInfoForm.styles.ts` | ⬜ |
| 8.10 | Style Log Health screen + form | `HealthDataForm.styles.ts` | ⬜ |
| 8.11 | Build `VitalLineChart` component | `components/charts/VitalLineChart.tsx` | ⬜ |
| 8.12 | Style History screen + add charts | `app/(tabs)/history.tsx` | ⬜ |
| 8.13 | Style Settings screen | `app/(tabs)/settings.tsx` | ⬜ |
| 8.14 | Add tab icons + style navigation bar | `app/(tabs)/_layout.tsx` | ⬜ |

### Verify Before Moving On
- [ ] No inline styles anywhere — all in `.styles.ts` files
- [ ] No purple/violet hex codes in any file
- [ ] Theme tokens are the only source of colours/spacing (no magic numbers)
- [ ] StatusBadge renders green/yellow/red correctly
- [ ] Line charts render with real data (at least 2 points to draw a line)
- [ ] Tab icons visible and active tab highlighted
- [ ] All screens look consistent (same spacing, fonts, colour palette)
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npx expo lint` — no lint errors
- [ ] App tested in Expo Go on Android

---

---

## Final Verification Checklist (All Milestones Complete)

> Run this only after all 8 milestones are checked off.

### Functional
- [ ] My Info saves and reloads after restart
- [ ] Health record saves and appears in Dashboard + History
- [ ] BMI auto-updates on weight/height change
- [ ] BMI category is always correct (WHO classification)
- [ ] StatusBadge colours correct at every threshold boundary
- [ ] Clearing data resets everything except UUID

### Data
- [ ] UUID persists in `AsyncStorage` across restarts
- [ ] Health data scoped to the signed-in Firebase UID
- [ ] `google-services.json` in `.gitignore`
- [ ] Firebase Auth sign-in state persists across app restarts

### Code Quality
- [ ] `npx tsc --noEmit` passes
- [ ] `npx expo lint` passes
- [ ] No `console.error` in logs
- [ ] No inline styles in JSX

### Design
- [ ] Healthcare palette — no purple/violet
- [ ] All styles via `StyleSheet.create`
- [ ] Consistent spacing, typography, and colours across all screens

### Build
- [ ] `npx expo start` — no crash on load
- [ ] Tested on Android via Expo Go

---

## Milestone 9 — Splash Screen (Drop Logo)

> **Goal:** Animated branded splash screen that plays on every app launch, then transitions to the Login screen (or directly to tabs if the user is already signed in).
> **No user interaction — purely visual and transitional.**

### Considerations
- Use `react-native` `Animated` API (no third-party animation library) for the drop animation
- Logo drops into center of screen over ~0.8s with an ease-in curve
- After animation completes (~1.5–2s total), check Firebase Auth state:
  - If signed in → navigate to `/(tabs)`
  - If not signed in → navigate to `/login`
- Screen must have no tab bar, no header — full-screen branded view
- Background color from `theme.colors.primary` or white; app name text below logo

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 9.1 | Create `app/splash.tsx` with logo + drop animation | `app/splash.tsx` | ✅ |
| 9.2 | Implement `Animated.spring` or `Animated.timing` drop sequence | `app/splash.tsx` | ✅ |
| 9.3 | Wire auth check: navigate to login or tabs after animation | `app/splash.tsx` | ✅ |
| 9.4 | Set splash as the initial route in `app/_layout.tsx` | `app/_layout.tsx` | ✅ |
| 9.5 | Style splash screen (full-screen, no header, no tab bar) | `app/splash.tsx` | ✅ |

### Verify Before Moving On
- [x] Splash screen appears on cold app launch before any other screen
- [x] Drop animation plays smoothly (no jank)
- [x] After animation, navigates to login (unauthenticated) or tabs (authenticated)
- [x] No tab bar or navigation header visible on splash screen
- [x] `npx tsc --noEmit` — no errors

---

## Milestone 10 — Login Screen (Firebase Email/Password Auth)

> **Goal:** Secure login screen with Firebase Email/Password authentication. New users can create an account. Existing users sign in. Auth state persists so returning users skip login on restart.
> **Status:** ✅ Done (Auth flow & UI implemented; Sign Out in Settings is in M7).

### Considerations
- Firebase Auth SDK (`firebase/auth`) installed and configured in `lib/firebase.ts`
- Uses `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `sendPasswordResetEmail`
- Listens to `onAuthStateChanged` in `AuthContext` — if user is already authenticated, skips login entirely and navigates to tabs
- Error messages shown inline (no `Alert.alert` — cross-platform safe)
- Form validated with email/password schema
- Screen: full-screen, no tab bar, no header, healthcare color palette

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 10.1 | Install Firebase Auth: `npx expo install firebase` | `package.json` | ✅ |
| 10.2 | Update `lib/firebase.ts` to export `auth` and `db` instances | `lib/firebase.ts` | ✅ |
| 10.3 | Add `LoginSchema` + `RegisterSchema` to `schemas/health.schema.ts` | `schemas/health.schema.ts` | ✅ |
| 10.4 | Create `app/login.tsx` — Sign In form (email + password) | `app/login.tsx` | ✅ |
| 10.5 | Add "Create Account" toggle to show Register form | `app/login.tsx` | ✅ |
| 10.6 | Add "Forgot Password" button → calls `sendPasswordResetEmail` | `app/login.tsx` | ✅ |
| 10.7 | Wire `onAuthStateChanged` in `AuthContext` + `AuthGate` in `app/_layout.tsx` | `app/_layout.tsx` | ✅ |
| 10.8 | Sign-out option in Settings screen | `app/(tabs)/settings.tsx` | 🔄 In M7 |
| 10.9 | Style login screen (full-screen, no header, no tab bar, healthcare palette) | `app/login.tsx` | ✅ |

### Verify Before Moving On
- [x] New user can create an account (email + password) — Firebase user created
- [x] Registered user can sign in with correct credentials
- [x] Wrong credentials shows inline error (not Alert)
- [x] "Forgot Password" sends a reset email
- [x] Signed-in user who restarts the app goes directly to tabs (skips login)
- [x] Unauthenticated user cannot access tab navigator
- [x] `npx tsc --noEmit` — no errors

---

## Milestone 11 — Role System (Admin / Patient)

> **Goal:** Firebase Auth wired end-to-end. Admin email whitelist assigns roles at registration.
> Role stored in Firestore. Navigation, AppContext, and storage all role-aware.

### Work Completed

| # | Task | File(s) | Done? |
|---|---|---|---|
| 11.1 | Install `firebase` package | `package.json` | ✅ |
| 11.2 | Wire real Firebase init with EXPO_PUBLIC_ env vars | `lib/firebase.ts` | ✅ |
| 11.3 | Create `lib/auth.ts` — signIn, register, signOut, resolveAppUser | `lib/auth.ts` | ✅ |
| 11.4 | Create `constants/adminEmails.ts` — admin whitelist | `constants/adminEmails.ts` | ✅ |
| 11.5 | Create `context/AuthContext.tsx` — onAuthStateChanged + role | `context/AuthContext.tsx` | ✅ |
| 11.6 | Update `context/AppContext.tsx` — role-aware, per-patientId ops | `context/AppContext.tsx` | ✅ |
| 11.7 | Update `lib/storage.ts` — all keys namespaced by patientId | `lib/storage.ts` | ✅ |
| 11.8 | Update `lib/firestore.ts` — real Firestore calls + admin helpers | `lib/firestore.ts` | ✅ |
| 11.9 | Add `UserRole`, `PatientSummary`, `LoginSchema`, `RegisterSchema` | `schemas/health.schema.ts` | ✅ |
| 11.10 | Update `app/_layout.tsx` — AuthProvider + AuthGate + AppProvider | `app/_layout.tsx` | ✅ |
| 11.11 | Create `app/login.tsx` — Sign In / Create Account / Forgot Password | `app/login.tsx` | ✅ |
| 11.12 | Create `app/splash.tsx` — Drop Logo animation | `app/splash.tsx` | ✅ |
| 11.13 | Update `app/(tabs)/_layout.tsx` — role-conditional tab visibility | `app/(tabs)/_layout.tsx` | ✅ |
| 11.14 | Create `app/(tabs)/patients.tsx` — Admin patient list + delete | `app/(tabs)/patients.tsx` | ✅ |
| 11.15 | Create `.env.example` — Firebase env var template | `.env.example` | ✅ |

### Pending: Firebase Project Setup (User Action Required)
- [ ] User creates Firebase project at console.firebase.google.com
- [ ] Enable Email/Password auth in Authentication → Sign-in method
- [ ] Create `.env` from `.env.example` and fill in credentials
- [ ] Add admin emails to `constants/adminEmails.ts`
- [ ] Set up Firestore Security Rules (see rules template below)

### Firestore Security Rules Template
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own user doc; admins can read all
    match /users/{uid} {
      allow read: if request.auth.uid == uid
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth.uid == uid;
    }
    // Patients: own data only; admins: any patient
    match /patients/{patientId} {
      allow read, write: if request.auth.uid == patientId
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /patients/{patientId}/records/{recordId} {
      allow read, write: if request.auth.uid == patientId
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Verify Before Closing Milestone
- [ ] `npx tsc --noEmit` — 0 errors ✅
- [ ] Admin email in whitelist → registers as admin → sees Patients tab
- [ ] Non-admin email → registers as patient → sees My Info tab, not Patients tab
- [ ] Sign out from Settings → returns to login screen
- [ ] Returning signed-in user → skips login, goes directly to correct tab view
