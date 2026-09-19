# Personal Health Monitoring App — Build Roadmap

> **File:** `context/roadmap.md`
> **Created:** 2026-09-19
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
| 1 | Project Bootstrap | Expo + folders + Firebase + UUID + tabs | ✅ Done |
| 2 | Data & Logic Layer | Schemas, BMI, thresholds, Storage/Firestore helpers, Context | ✅ Done |
| 3 | My Info Screen | Profile form — save & load from storage | ✅ Done |
| 4 | Log Health Screen | Vitals form — BMI auto-calc — save record | ⬜ Not Started |
| 5 | Dashboard Screen | Read latest record — display vitals + status | ⬜ Not Started |
| 6 | History Screen | List past records — timestamps — no charts yet | ⬜ Not Started |
| 7 | Settings Screen | Clear all data — about info | ⬜ Not Started |
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
> **No UI changes in this milestone — logic files only.**

### Considerations
- Zod schemas are the single source of truth for all types — derive TypeScript types from them (`z.infer<typeof Schema>`)
- BMI formula: `weight / (height / 100) ** 2` — round to 2 decimal places
- Vital status logic must cover all 7 vitals with 3 levels each (`normal` / `warning` / `critical`)
- Firestore structure: `users/{uuid}` (doc) + `users/{uuid}/records/{autoId}` (sub-collection)
- AppContext wraps the entire app — all screens read data through context hooks, not direct Firestore calls

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 2.1 | Write Zod schemas | `schemas/health.schema.ts` | ✅ |
| 2.2 | Write BMI utility functions | `lib/bmi.ts` | ✅ |
| 2.3 | Write vital status thresholds + helper | `constants/thresholds.ts` | ✅ |
| 2.4 | Write local storage + Firestore sync helpers | `lib/storage.ts`, `lib/firestore.ts` | ✅ |
| 2.5 | Build AppContext with local-first persistence | `context/AppContext.tsx` | ✅ |
| 2.6 | Build `useMyInfo` hook | `hooks/useMyInfo.ts` | ✅ |
| 2.7 | Build `useHealthData` hook | `hooks/useHealthData.ts` | ✅ |
| 2.8 | Build `useBMI` hook | `hooks/useBMI.ts` | ✅ |
| 2.9 | Wrap app root in `AppContext.Provider` | `app/_layout.tsx` | ✅ |

### Key Interfaces (from schemas)

```ts
// MyInfo
{ fullName, age, sex: 'Male' | 'Female', dateOfBirth, contactNumber, address }

// HealthRecord
{ heartRate, systolic, diastolic, temperature, oxygenLevel,
  weight, height, bmi, bloodSugar, bloodSugarType, timestamp }
```

### Verify Before Moving On
- [x] `calculateBMI(65, 170)` returns `22.49`
- [x] `getBMICategory(22.49)` returns `"Normal"`
- [x] `getVitalStatus('heartRate', 72)` returns `"normal"`
- [x] `getVitalStatus('heartRate', 130)` returns `"critical"`
- [x] Local storage `saveLocalMyInfo` writes and `getLocalMyInfo` reads data
- [x] Local storage `addLocalRecord` appends and `getLocalRecords` returns array with record
- [x] AppContext updates correctly when a new record is added
- [x] `useBMI` returns updated BMI when weight or height changes
- [x] No TypeScript errors (`npx tsc --noEmit` passed cleanly)

---

---

## Milestone 3 — My Info Screen

> **Goal:** A working, unstyled personal profile form. Data loads from Firestore on mount, edits save back to Firestore.
> **No design — plain `<View>` and `<Text>` only.**

### Considerations
- Form uses `react-hook-form` + zod resolver — no manual `useState` per field
- On mount: read from Firestore → populate form defaults
- On submit: validate → save to Firestore via `saveMyInfo` → show success `Alert`
- All fields are optional on first open (user may not have set them yet)
- The `InputField` shared component is created here — it will be reused everywhere

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 3.1 | Build `InputField` component (unstyled) | `components/ui/InputField.tsx` | ✅ |
| 3.2 | Build `MyInfoForm` component | `components/forms/MyInfoForm.tsx` | ✅ |
| 3.3 | Wire `my-info.tsx` screen — load + save | `app/(tabs)/my-info.tsx` | ✅ |

### Verify Before Moving On
- [x] All 6 fields render correctly
- [x] Submitting with empty required fields shows inline validation errors
- [x] Valid data saves to local storage (and syncs to Firestore if configured)
- [x] Reopening the screen loads previously saved data into form fields
- [x] No TypeScript errors (`npx tsc --noEmit` passed cleanly)

---

---

## Milestone 4 — Log Health Screen

> **Goal:** A working, unstyled health data entry form. All 7 vitals log to Firestore. BMI auto-calculates as weight and height change.
> **No design — plain `<View>` and `<Text>` only.**

### Considerations
- BMI is **not a user input** — it is calculated from weight + height and stored alongside the record
- Blood pressure is two separate numeric inputs (Systolic / Diastolic) composed into one `BloodPressureInput` component
- Blood sugar type is a simple selector (`Fasting` / `Random` / `Other`) — use `Picker` or basic `TouchableOpacity` buttons for now
- On submit: validate → compute BMI → add record to Firestore → reset form → show success `Alert`
- Height field: if the user has logged it before, pre-fill from the last record to save repetitive entry

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 4.1 | Build `BloodPressureInput` component | `components/forms/BloodPressureInput.tsx` | ⬜ |
| 4.2 | Build `HealthDataForm` component | `components/forms/HealthDataForm.tsx` | ⬜ |
| 4.3 | Integrate `useBMI` — show live BMI preview | `components/forms/HealthDataForm.tsx` | ⬜ |
| 4.4 | Wire `log-health.tsx` screen | `app/(tabs)/log-health.tsx` | ⬜ |

### Verify Before Moving On
- [ ] All 7 vitals accept valid input and reject invalid input (e.g. negative heart rate)
- [ ] Blood pressure dual input feeds both values into the same form record
- [ ] BMI display updates as weight or height changes (live preview)
- [ ] Blood sugar type selector works (one of 3 options selectable)
- [ ] Submitting saves a complete record to Firestore (verify in Firebase Console)
- [ ] Record includes auto-computed `bmi` field
- [ ] Form resets after successful submit
- [ ] No TypeScript errors

---

---

## Milestone 5 — Dashboard Screen

> **Goal:** Read the latest health record from Firestore and display all vitals with plain-text status labels. Shows personal profile summary at the top.
> **No design — plain `<View>` and `<Text>` only.**

### Considerations
- Dashboard reads from AppContext (which already holds latest record via real-time listener)
- "Latest record" = the most recent entry by timestamp
- Each vital shows: value + unit + status string (`"normal"` / `"warning"` / `"critical"`)
- If no records logged yet, show a helpful empty state message: "No health data logged yet. Tap Log Health to get started."
- Personal summary at top: Full Name + Age (from My Info)

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 5.1 | Build `MySummary` component (unstyled) | `components/dashboard/MySummary.tsx` | ⬜ |
| 5.2 | Build `VitalCard` component (unstyled) | `components/dashboard/VitalCard.tsx` | ⬜ |
| 5.3 | Build `OverallStatus` component (unstyled) | `components/dashboard/OverallStatus.tsx` | ⬜ |
| 5.4 | Wire `index.tsx` dashboard screen | `app/(tabs)/index.tsx` | ⬜ |

### Verify Before Moving On
- [ ] Dashboard shows the personal name and age from My Info
- [ ] All 7 vital cards render with values from the latest record
- [ ] Status string (`normal` / `warning` / `critical`) is correct for each vital
- [ ] Empty state message shows when no records exist
- [ ] After logging a new record on the Log Health screen, switching to Dashboard shows updated values
- [ ] No TypeScript errors

---

---

## Milestone 6 — History Screen

> **Goal:** List all past health records in reverse chronological order. Each record shows timestamp + all vital values. No charts yet.
> **No design — plain `<View>` and `<Text>` only.**

### Considerations
- Records come from AppContext (real-time Firestore listener — already set up in Milestone 2)
- Display in reverse order (newest first)
- Each item shows: date/time + all 7 vitals + BMI
- Empty state when no records exist
- Use `date-fns` to format timestamps into readable strings (e.g. `"19 Sep 2026, 10:30 AM"`)
- Charts are **not added here** — that is Phase 8 (design milestone)

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 6.1 | Build record list item component (unstyled) | `components/history/RecordItem.tsx` | ⬜ |
| 6.2 | Wire `history.tsx` screen | `app/(tabs)/history.tsx` | ⬜ |

### Verify Before Moving On
- [ ] All logged records appear, newest first
- [ ] Timestamps are human-readable (not raw Firestore Timestamps)
- [ ] All vital values display correctly per record
- [ ] Empty state shows when no records exist
- [ ] Adding a new record on Log Health appears in History without needing to restart
- [ ] No TypeScript errors

---

---

## Milestone 7 — Settings Screen

> **Goal:** Basic settings — clear all data and view app info. Fully functional, unstyled.

### Considerations
- "Clear all data" must delete:
  1. The `users/{uuid}` Firestore document
  2. All documents in `users/{uuid}/records/` sub-collection
  3. Reset AppContext state to empty
- After clearing, Dashboard shows empty state, History shows empty state
- **Do not** delete the UUID from AsyncStorage — the same identifier is reused if the user wants to start fresh
- Show a confirmation `Alert` before deleting (destructive action)

### Tasks

| # | Task | File(s) | Done? |
|---|---|---|---|
| 7.1 | Add `deleteAllData` Firestore helper | `lib/firestore.ts` | ⬜ |
| 7.2 | Wire `settings.tsx` screen | `app/(tabs)/settings.tsx` | ⬜ |

### Verify Before Moving On
- [ ] Confirmation Alert appears before deletion
- [ ] After confirming, all Firestore data is deleted (verify in Firebase Console)
- [ ] Dashboard and History show empty states immediately after clear
- [ ] My Info fields are blank on next visit to that screen
- [ ] UUID in AsyncStorage is unchanged (not deleted)
- [ ] No TypeScript errors

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
- [ ] Firestore data scoped to `users/{uuid}` only
- [ ] No Firebase Auth SDK in codebase
- [ ] `google-services.json` in `.gitignore`

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

