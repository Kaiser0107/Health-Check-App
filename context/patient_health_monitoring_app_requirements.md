# Patient Health Monitoring App — Requirements

> **Updated:** 2026-09-24
> **Specification Reference:** Specifications aligned directly with original `health.pdf` requirements.
>
> 📌 Related files:
> - [`health-monitor-app.md`](./health-monitor-app.md) — Architecture, tech stack & decisions
> - [`roadmap.md`](./roadmap.md) — Incremental milestone build tracker

---

## 0. APP LAUNCH FLOW

The app follows a structured entry flow before any patient data is accessible:

```
App Launch / Reload / Sign Out
    │
    ▼
┌─────────────────────────┐
│  SPLASH SCREEN           │  Drop Logo bounce animation (1.5–2s)
│  (Drop Logo)             │  App name + logo centered on screen
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────┐
│  LOGIN SCREEN            │  Clinical & Patient Sign In (Username & Password)
│  (Authentication)        │  Public self-registration disabled;
│                          │  Admin provisions all patient accounts.
└─────────────┬───────────┘
              │  (on successful auth)
              ▼
┌─────────────────────────┐
│  ROLE ROUTING           │
│  ├─ Admin:              │  Lands on Patients tab (Roster)
│  └─ Patient/User:       │  Lands on Dashboard (Demographics + Vitals)
└─────────────────────────┘
```

### Splash Screen — Drop Logo
- Displays on cold launch, web page reload, and sign out
- Shows the app logo with a **drop / bounce animation** into the center of the screen
- Transitions automatically to Login screen after animation completes (~1.5–2 seconds)
- No user interaction required
- Implemented as a dedicated screen: `app/splash.tsx`

### Login Screen — Username & Password Authentication
- **Authentication method:** Username & Password backed by Firebase Auth (internal virtual domain `@healthcheck.local` — no external email required)
- Fields: Username, Password
- Actions: **Sign In** only (public registration is disabled to enforce clinical authority)
- **Role-based initial landing**: Admins land on the **Patients** tab; Patients land on the **Dashboard**
- On failed sign-in → shows inline error message (no native Alert)
- Quick-demo autofill buttons provided for fast role testing (`admin`, `patient1`)
- Implemented as a dedicated screen: `app/login.tsx`

---

## 1. MAIN OBJECTIVE

Develop a simple, modern, user-friendly **Patient Health Monitoring App** that can be used by **patients, caregivers, teachers, nurses, or healthcare personnel** to record basic patient information and vital health measurements.

The application automatically calculates BMI, evaluates entered health data against standard health thresholds, saves records, and displays an updated health monitoring dashboard.

The app has two core functional areas:
1. **Patient Information & Health Data Entry**
2. **Health Monitoring Dashboard**

The interface is clean, responsive, easy to understand, and optimized for mobile devices and cloud simulators (Expo Snack and Expo Go).

---

## 2. PATIENT INFORMATION

Provide editable fields for:

* **Profile Picture** (Camera capture or photo library picker — displayed as a circular avatar on the patient profile)
* **Patient ID** (Identification code / hospital or school record number)
* **Full Name**
* **Age** (Auto-calculated reactively from Date of Birth or manually editable)
* **Sex / Gender** (Male or Female)
* **Date of Birth** (Interactive modal calendar selector with Month/Day navigation and Year jump dialog to prevent date format errors)
* **Contact Number** (Country selector modal with flag & calling codes, defaulting to Philippines 🇵🇭 `+63`, automatically formatting local mobile digits)
* **Address**

Include an **Edit Patient Information** function allowing the Administrator to modify previously recorded patient details after account creation directly from the Patients roster, as well as via the patient profile.

---

## 3. HEALTH DATA ENTRY

Input fields for the following 7 vital measurements:

**Heart Rate**
* Input: beats per minute (BPM)
* Example: 72 BPM

**Blood Pressure**
* Two inputs:
  * Systolic (mmHg)
  * Diastolic (mmHg)
* Example: 120/80 mmHg

**Temperature**
* Input: °C
* Example: 36.7 °C

**Oxygen Level**
* Input: SpO2 percentage (%)
* Example: 98%

**Weight**
* Input: kilograms (kg)
* Example: 65 kg

**Height**
* Input: centimeters (cm)
* Example: 170 cm
* Required for live BMI calculation

**Blood Sugar**
* Input: mg/dL
* Selector for measurement type:
  * Fasting
  * Random
  * Other

---

## 4. BMI CALCULATOR

Automatically calculate BMI using:

$$\text{BMI} = \frac{\text{Weight (kg)}}{(\text{Height (m)})^2}$$

Example:
* Weight = 65 kg, Height = 170 cm = 1.70 m
* $\text{BMI} = 65 \div (1.70 \times 1.70) = \mathbf{22.49}$

Display BMI value and standard WHO category:

| Category | BMI Range |
|---|---|
| Underweight | < 18.5 |
| Normal | 18.5 – 24.9 |
| Overweight | 25.0 – 29.9 |
| Obese | ≥ 30.0 |

The BMI automatically updates whenever weight or height changes in the health entry form.

---

## 5. APPLICATION STRUCTURE

Component-based structure with the following screens:

* **Splash Screen** (Drop Logo — `app/splash.tsx`)
  * Animated app logo drop animation on launch
  * Auto-transitions to Login (or Main App if already signed in)
* **Login Screen** (Authentication — `app/login.tsx`)
  * Username + Password fields (no real email required)
  * Sign In, Create Account (with quick-demo autofill buttons for admin and patient)
  * Firebase Auth backing via internal virtual domain (`@healthcheck.local`) + hardcoded role resolution
* **Dashboard** (`app/(tabs)/index.tsx`)
  * **Patient Role**: Displays own summary (ID, Name, Age, Sex), overall status badge, and 7 vital cards
  * **Admin Role**: Displays selected patient's summary and vitals (or interactive prompt to select a patient from the roster)
* **Patients** (Admin Only — `app/(tabs)/patients.tsx`)
  * Registered patient roster with avatar, name, username, and patient ID
  * "Add Patient" modal allowing admin to register/provision new patients
  * Select patient to view on Dashboard or log vitals
  * Delete patient with confirmation dialog
* **Patient Info** (Patient Profile — `app/(tabs)/my-info.tsx`)
  * Patient only (hidden from Admin navigation)
  * Circular profile picture avatar (camera / photo library picker)
  * Patient ID, Name, Age, Sex, Date of Birth, Contact Number, Address
* **Log Health** (Health Data Form — `app/(tabs)/log-health.tsx`)
  * Inputs for all 7 vitals + Blood Sugar Type selector
  * Live interactive BMI calculation & category badge preview
  * Logs to the current active patient (`currentPatientId`)
* **Health History** (`app/(tabs)/history.tsx`)
  * Past health records with timestamps and line charts per vital
  * Scoped to the current patient
* **Settings** (`app/(tabs)/settings.tsx`)
  * Account username (`@username`) and User Role badge (Admin vs Patient)
  * Firebase Sign Out (returns to Login)
  * Data management and clear data option

---

## 6. STYLING APPROACH

* Styles written using the **React Native `StyleSheet` API** (no utility-class libraries like NativeWind).
* Separation of concerns: visual presentation kept clean and accessible.
* Professional healthcare palette: whites, blues, greens — **no purple/violet**.
* Minimum touch target size of 48dp on all interactive elements.

---

## 7. DATA & STORAGE

* **Authentication:** Username & Password mapped internally to Firebase Auth without real emails (`${username}@healthcheck.local`) — user identity managed via Firebase.
* **Health data storage** is **100% Local-First** using `@react-native-async-storage/async-storage`.
* Fast, lightweight, and fully offline-capable after initial sign-in.
* Health records are scoped to the signed-in Firebase UID (`@health_records_${patientId}`).
* Admin-managed patient summaries are stored locally and in Firestore `patients` collection.
* Guaranteed 100% compatible with Expo Snack and Expo Go without cloud database setup.

---

## 8. USER ROLES & PERMISSION BOUNDARIES (2 ROLES ONLY)

The system supports exactly two roles:
1. **Admin** (`constants/adminUsers.ts`)
2. **User / Patient Account** (Unified entity)

### Role Comparison Matrix

| Feature / Capability | Admin (`ADMIN_USERNAMES`) | User / Patient Account | Rationale / Limitation |
|---|---|---|---|
| **Visible Tabs** | Dashboard, Patients, Log Health, History, Settings | **Dashboard & Settings ONLY** | Patient has a focused, view-only monitoring experience |
| **Patients Management Tab** | ✅ Full Access (Add/Delete/Select) | ❌ **Hidden (`href: null`)** | Only admins manage clinical patient accounts |
| **Add Patient / User Account** | ✅ Yes (Modal in Patients tab) | ❌ **Blocked (No public register)** | Admin provisions credentials + demographics simultaneously |
| **Delete Patient Account & Records** | ✅ Yes (Cascade delete) | ❌ **Blocked** | Patients cannot delete accounts or audit records |
| **View Personal Demographic Profile** | Read-only for selected patient | ✅ **Displayed on Dashboard** | Full demographics rendered at the top of patient's Dashboard |
| **Personal Health Dashboard** | Shown for selected patient | ✅ **Self-only** | Patient lands directly on Dashboard with personal vitals |
| **Select Active Patient** | ✅ From roster list | ❌ **Locked to `user.uid`** | Patient cannot switch contexts or view others |
| **Log Health Vitals** | ✅ For any selected patient | ❌ **Admin-only** (`href: null`) | Attending clinical staff records vitals; prevents false entries |
| **View Health History Tab** | ✅ For any selected patient | ❌ **Admin-only** (`href: null`) | Deep longitudinal history managed by clinical personnel |
| **Settings (Sign Out)** | ✅ Yes | ✅ **Yes** | Both roles can sign out back to Drop Logo → Login screen |

### User / Patient Account Limitations
1. **Single Unified Entity**:
   - The user account IS the patient profile. There is no separate patient creation without a user account.
   - Credentials (`username` + `password`) and demographic profile (`fullName`, `age`, `sex`, `dateOfBirth`, `contactNumber`, `address`, `patientId`) are unified at creation.
2. **Dashboard-Only Access**:
   - Patient navigation only exposes **Dashboard** and **Settings**.
   - Tabs for `Patients`, `My Info`, `Log Health`, and `History` are removed from the patient view.
   - Personal demographic profile is embedded directly at the top of the personal Dashboard.
3. **No Self-Registration**:
   - Public "Create Account" is removed from the Login screen.
   - All patient accounts are provisioned exclusively by clinical Administrators from the Patients tab.
4. **Context-Locked Operations**:
   - In `AppContext`, `currentPatientId` is permanently locked to `user.uid` upon sign-in.
   - All storage operations use keys namespaced by the patient's own UID (`@health_records_${uid}`, `@patient_info_${uid}`).

### Administrator Capabilities & Authority
1. **Sole Account Authority**:
   - Only Admins can create new patient accounts with login credentials and medical demographics.
   - Uses an ephemeral secondary Firebase App instance so Admin is **never logged out** when creating patient credentials.
   - Only Admins can delete patient accounts and cascade delete all their Firestore/local records.
2. **Clinical Management**:
   - Admins select patients from the roster to monitor their dashboards, log new clinical vitals, and inspect past history.
   - Hardcoded admin usernames in `constants/adminUsers.ts` ensure tamper-proof privilege enforcement.