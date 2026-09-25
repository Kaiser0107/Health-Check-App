# Task Plan: Unified User-Patient Entity & Role Flow Fix

> **Slug:** `user-patient-flow.md`  
> **Status:** Completed ✅  
> **Goal:** Connect Users and Patients into a unified entity, enforce Admin-only account provisioning, lock Patient role to personal Dashboard, and finalize the complete app flow.

---

## 1. Summary of Requirements & Clarifications

1. **Only Two Roles**:
   - `Admin`: Hardcoded clinic staff / supervisors / nurse leads in `constants/adminUsers.ts`.
   - `User/Patient Account`: Every registered user is a patient with demographic info and health records.
2. **Users and Patients are Connected**:
   - A User account **IS** the Patient. There is no separate abstract "User" vs "Patient".
   - Each patient has a `username`, `password`, and profile info (`fullName`, `age`, `sex`, `dateOfBirth`, `contactNumber`, `address`, `patientId`).
3. **Sole Admin Authority to Add or Delete**:
   - The Admin is the **only one** authorized to create or delete Patient accounts.
   - Public "Create Account" is removed from the Login screen.
   - In the `Patients` tab, Admin uses "+ Add Patient" to provision a new user-patient with username and password.
   - Admin can delete any patient profile, which deletes their credentials and all their health records.
4. **User/Patient Can Only See Dashboard**:
   - When a Patient logs in, they land on their **Dashboard**.
   - Their Dashboard displays their personal demographics card, overall status badge, and the 7 vital measurement cards.
   - The bottom navigation bar for Patients only shows **Dashboard** and **Settings** (for Sign Out).
   - Tabs like `Patients`, `My Info`, `Log Health`, and `History` are hidden from the Patient.
5. **Fixed Flow**:
   - **Splash (Drop Logo)** ➜ **Login (Sign In only)** ➜ **Role-Based App View**:
     - Admin ➜ lands on **Patients** tab.
     - Patient ➜ lands on **Dashboard**.
   - Sign Out ➜ returns to **Splash (Drop Logo)** ➜ **Login**.
   - Web Reload ➜ returns to **Splash (Drop Logo)** ➜ **Login**.

---

## 2. Affected Files & Task Breakdown

| # | Task | Target File |
|---|---|---|
| 1 | Create `CreatePatientAccountSchema` with username, password, and demographics | `schemas/health.schema.ts` |
| 2 | Add `adminCreatePatientUser` and `adminDeletePatientUser` helpers | `lib/auth.ts` |
| 3 | Update `AppContext` to create unified patient accounts and lock patient context | `context/AppContext.tsx` |
| 4 | Update Login screen to Sign In only (remove public self-registration) + demo chips | `app/login.tsx` |
| 5 | Configure bottom navigation tabs so Patients only see Dashboard and Settings | `app/(tabs)/_layout.tsx` |
| 6 | Enhance Dashboard to show patient demographics header + vitals in Patient view | `app/(tabs)/index.tsx` |
| 7 | Update "+ Add Patient" modal in Patients tab to include username and password | `app/(tabs)/patients.tsx` |
| 8 | Update context documentation files (`requirements.md`, `health-monitor-app.md`, `roadmap.md`) | `context/` |
| 9 | Verify TypeScript compilation (`npx tsc --noEmit`) and update graphify | `graphify update .` |
