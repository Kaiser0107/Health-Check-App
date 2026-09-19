# Personal Health Monitoring App — Requirements

> **Updated:** 2026-09-19
> **Scope change:** Re-framed from a multi-patient clinical tool to a **personal health tracking app** for a single user (the owner of the device).
>
> 📌 Related files:
> - [`health-monitor-app.md`](./health-monitor-app.md) — Architecture, tech stack & decisions
> - [`roadmap.md`](./roadmap.md) — Incremental milestone build tracker

---

## 1. MAIN OBJECTIVE

Build a simple, modern, personal health tracking app for **self-monitoring**. The app is for the owner's own use — tracking vitals over time, calculating BMI, and viewing a health dashboard to understand personal health trends.

The app has two main sections:

1. **My Info** — personal profile (replaces "Patient Information")
2. **Health Dashboard** — live vitals overview and history

The interface should be clean, easy to understand, and suitable for mobile use.

---

## 2. MY INFORMATION (Personal Profile)

Provide editable fields for:

* Full Name
* Age (auto-calculated from Date of Birth or editable)
* Sex / Gender (Male or Female)
* Date of Birth (interactive calendar selector)
* Contact Number
* Address

> **Note:** "Patient ID" is removed — not relevant for a personal app. The owner is always the one and only user.

Include an **Edit Profile** function to modify previously entered information.

---

## 3. HEALTH DATA ENTRY

Input fields for the following measurements:

**Heart Rate**
* Input: beats per minute (BPM)
* Example: 72 BPM

**Blood Pressure**
* Two inputs: Systolic / Diastolic
* Example: 120/80 mmHg

**Temperature**
* Input: °C
* Example: 36.7 °C

**Oxygen Level**
* Input: SpO₂ percentage
* Example: 98%

**Weight**
* Input: kilograms (kg)
* Example: 65 kg

**Height**
* Input: centimeters (cm)
* Example: 170 cm
* Required for BMI calculation

**Blood Sugar**
* Input: mg/dL
* Optional measurement type selector: Fasting / Random / Other

---

## 4. BMI CALCULATOR

Auto-calculate BMI using:

```
BMI = Weight (kg) / Height² (m²)
```

Example:
* Weight = 65 kg, Height = 170 cm = 1.70 m
* BMI = 65 ÷ (1.70 × 1.70) = **22.49**

Display BMI value + category:

| Category | BMI Range |
|---|---|
| Underweight | < 18.5 |
| Normal | 18.5 – 24.9 |
| Overweight | 25.0 – 29.9 |
| Obese | ≥ 30.0 |

BMI updates automatically whenever weight or height changes.

---

## 5. APPLICATION STRUCTURE

Component-based structure with the following screens:

* **Dashboard** — My Summary, Overall Status, all vital cards (Heart Rate, Blood Pressure, Temperature, Oxygen, Weight, BMI, Blood Sugar)
* **My Info** — Full Name, Age, Sex, Birth Date, Contact, Address
* **Log Health** — Heart Rate, Blood Pressure, Temperature, Oxygen Level, Weight, Height, Blood Sugar
* **BMI** — Live BMI value + category
* **History** — Past health records with line charts per vital
* **Settings** — App preferences, data management

---

## 6. STYLING APPROACH

> Styling is a **separate concern** from logic and is applied after the app skeleton is built.

* Styles are written using **React Native `StyleSheet` API** (no utility-class libraries like NativeWind)
* Each screen and component has its own dedicated `styles` object or a co-located `*.styles.ts` file
* A shared `constants/theme.ts` defines the design tokens (colours, spacing, typography)
* Healthcare-appropriate palette: whites, blues, greens — **no purple/violet**

---

## 7. DATA & STORAGE

* Storage is **100% Local-First** using `@react-native-async-storage/async-storage`.
* **Zero authentication friction** — the app is strictly personal; a UUID is generated on first launch and stored in `AsyncStorage`.
* **Zero cloud/Firebase runtime dependencies** — ensures instant launch, full offline reliability, and 100% seamless compatibility with Expo Snack and Expo Go.
* Data export/clear functionality managed via the Settings screen.