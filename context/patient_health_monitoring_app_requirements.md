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
App Launch
    │
    ▼
┌─────────────────────────┐
│  SPLASH SCREEN           │  Drop Logo animation (1.5–2s)
│  (Drop Logo)             │  App name + logo centered on screen
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────┐
│  LOGIN SCREEN            │  Firebase Email/Password Authentication
│  (Authentication)        │  Email + Password inputs + Sign In button
│                          │  "Create Account" option for new users
└─────────────┬───────────┘
              │  (on successful auth)
              ▼
┌─────────────────────────┐
│  MAIN APP                │  Tab Navigator: Dashboard, My Info,
│  (Tab Navigator)         │  Log Health, History, Settings
└─────────────────────────┘
```

### Splash Screen — Drop Logo
- Displays on every app launch (before auth check)
- Shows the app logo with a **drop / fall animation** into the center of the screen
- Transitions automatically to Login screen after animation completes (~1.5–2 seconds)
- No user interaction required
- Implemented as a dedicated screen: `app/splash.tsx`

### Login Screen — Firebase Authentication
- **Authentication method:** Firebase Email/Password (`firebase/auth`)
- Fields: Email address, Password
- Actions: **Sign In**, **Create Account** (register new user), **Forgot Password** (reset via email)
- On successful sign-in → navigates to the main tab navigator with **role-based routing**: Admins are routed to the **Patients** tab; Patients are routed to the **Dashboard**
- On failed sign-in → shows inline error message (no native Alert)
- Auth state persisted by Firebase SDK — returning users go straight to main app (skip login re-entry)
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
* **Age** (Auto-calculated from Date of Birth or manually editable)
* **Sex / Gender** (Male or Female)
* **Date of Birth** (Interactive modal calendar selector)
* **Contact Number**
* **Address**

Include an **Edit Patient Information** function allowing the user (patient, caregiver, teacher, or nurse) to modify previously recorded patient details, including replacing the profile picture.

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

* **Splash Screen** (Drop Logo)
  * Animated app logo drop animation on launch
  * Auto-transitions to Login (or Main App if already signed in)
* **Login Screen** (Authentication)
  * Email + Password fields
  * Sign In, Create Account, Forgot Password
  * Firebase Email/Password auth
* **Dashboard**
  * Patient Summary (Patient ID, Name, Age, Sex)
  * Overall Health Status (Normal / Warning / Critical)
  * Vital Cards: Heart Rate, Blood Pressure, Temperature, Oxygen Level, Weight, BMI, Blood Sugar
* **Patient Info** (Patient Profile)
  * Circular profile picture avatar (camera / photo library picker)
  * Patient ID, Name, Age, Sex, Date of Birth, Contact Number, Address
* **Log Health** (Health Data Form)
  * Inputs for all 7 vitals + Blood Sugar Type selector
  * Live interactive BMI calculation & category badge preview
* **Health History**
  * Past health records with timestamps and line charts per vital
* **Settings**
  * App preferences, data management, clear data option

---

## 6. STYLING APPROACH

* Styles written using the **React Native `StyleSheet` API** (no utility-class libraries like NativeWind).
* Separation of concerns: visual presentation kept clean and accessible.
* Professional healthcare palette: whites, blues, greens — **no purple/violet**.
* Minimum touch target size of 48dp on all interactive elements.

---

## 7. DATA & STORAGE

* **Authentication:** Firebase Email/Password (`firebase/auth`) — user identity managed in Firebase.
* **Health data storage** is **100% Local-First** using `@react-native-async-storage/async-storage`.
* Fast, lightweight, and fully offline-capable after initial sign-in.
* Health records are scoped to the signed-in Firebase UID.
* Guaranteed 100% compatible with Expo Snack and Expo Go without cloud database setup.

---

## 8. USER ROLES

### Admin Role
- Assigned by email whitelist in `constants/adminEmails.ts`
- Admin accounts are **management-only** — no personal health records
- Can: Create, Read, Update, Delete any patient profile
- Can: View any patient's health dashboard and history
- Can: Log health for any selected patient
- Cannot: Have their own health record
- Sees: Dashboard (selected patient), Patients (CRUD list), Log Health, History, Settings

### Patient Role
- All non-admin accounts are Patients
- Can: View and edit their own profile info
- Can: Log their own health vitals
- Can: View their own dashboard and history
- Cannot: View other patients' data
- Cannot: Access the Patients admin tab
- Sees: Dashboard (own), My Info, Log Health, History, Settings

### Role Assignment
- At registration: email is checked against `constants/adminEmails.ts`
- Role is stored in Firestore `users/{uid}/role`
- Role persists across app restarts via Firebase Auth + Firestore