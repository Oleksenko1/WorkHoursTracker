# Technical Specification: "Work Hours Tracker" — Mobile Web App

## 1. Project Summary

Build a **mobile-first web application** that lets a user clock in/out of work shifts, see real-time earnings accumulate based on an hourly rate, "collect" accumulated money from an animated piggy bank into their daily total, and review statistics (calendar, weekly earnings, daily average, etc.). A small "Lucky Block" button shows a random "food-for-thought" question pulled from a Firebase-hosted JSON dataset, to give the user something to think about during work.

- **All UI text must be in English.**
- The app is **mobile-first** (design for phone screens ~375–430px wide first, then make it reasonably usable on desktop/tablet as a bonus, not a requirement).
- **Hosting:** static site hosted on **GitHub Pages**.
- **Auth & Database:** **Firebase** (Firebase Authentication + Firestore, or Firebase Realtime Database — pick one and justify the choice; Firestore is preferred for structured per-day documents).

---

## 2. Tech Stack

- Frontend framework: React (Vite) is preferred for a GitHub Pages-friendly static build. Plain HTML/CSS/JS is acceptable if simpler, but React + Vite is recommended for maintainability and component-based animations.
- Styling: CSS Modules / Tailwind CSS / styled-components — agent's choice, but must produce a polished, "juicy," app-like mobile UI (rounded cards, soft shadows, smooth transitions).
- Auth: **Firebase Authentication**
  - Email/Password sign-up & sign-in
  - Google Sign-In (OAuth popup/redirect)
- Database: **Firebase Firestore** (or Realtime Database) for:
  - User profile (hourly rate, settings)
  - Work sessions (clock-in/clock-out timestamps, duration, earnings)
  - Daily aggregated stats (for fast calendar/statistics rendering)
  - "Lucky Block" questions collection (JSON-like documents), read-only from the client
- Animation library: Framer Motion (if React) or CSS keyframes/GSAP — should be used for all the "juicy" money/piggy-bank effects.
- Hosting/deploy: GitHub Pages via GitHub Actions (auto-deploy on push to `main`), or `gh-pages` npm package — agent's choice.

---

## 3. Data Model (Firestore — recommended structure)

```
users/{uid}
  - email: string
  - displayName: string
  - hourlyRate: number            // $/hour, editable by user
  - createdAt: timestamp

users/{uid}/sessions/{sessionId}
  - clockInAt: timestamp
  - clockOutAt: timestamp | null   // null while clocked in
  - durationSeconds: number        // computed on clock-out
  - earnings: number               // computed on clock-out (hourlyRate applied to durationSeconds)
  - rateAtTimeOfSession: number    // snapshot of hourlyRate used, for historical accuracy

users/{uid}/dailyStats/{yyyy-mm-dd}
  - totalSecondsWorked: number
  - totalEarnings: number
  - collectedEarnings: number      // money moved from piggy bank into "today's total" via Collect button
  - pendingPiggyBank: number       // money currently sitting in the piggy bank, not yet collected
  - lastUpdatedAt: timestamp

luckyQuestions/{questionId}        // top-level collection, read-only for authenticated users
  - text: string
  - category: string (optional)
```

> The agent should design exact field names/collections as needed, but must preserve the core separation: **session records** (raw clock in/out events) vs **daily aggregates** (for fast stats/calendar rendering) vs **lucky questions** (separate top-level collection).

---

## 4. Screens & Features (Detailed)

### 4.1 Authentication Screen
- Two options: **Sign in with Email & Password** (with a Sign Up toggle/link for new accounts) and **Sign in with Google**.
- Standard validation: email format, password length, error messages in English (e.g. "Invalid email or password", "Email already in use").
- On first sign-up, create the `users/{uid}` document with a default `hourlyRate` (e.g. $15/hour) that the user can edit later.
- Persist auth session (Firebase handles this by default) so returning users go straight to the Main Screen.
- After login, redirect to the Main Screen.

### 4.2 Main Screen (Home)
This is the core screen. Elements, top to bottom:

1. **Top bar**
   - App name/logo on the left (or center).
   - Small **"Lucky Block"** button/icon in the **top-right corner**.
2. **Editable hourly rate** — a small field/label like `Rate: $15.00/hr` that opens an inline editor or modal to change the value. Saves to `users/{uid}.hourlyRate` in Firestore.
3. **Center of screen — big earnings display**: "Earned Today: $XX.XX" — this is the **cumulative earnings collected so far today** (i.e., `dailyStats.collectedEarnings`), NOT including whatever is currently sitting in the piggy bank.
4. **Worked time today**, formatted `HH:MM:SS`, counting up live while clocked in (based on current session's elapsed time + any previously accumulated time today).
5. **Piggy Bank widget**: a piggy bank icon/illustration with a running counter next to/inside it, e.g. `$0.42`. 
   - While the user is **clocked in**, this value increases **every second** by `hourlyRate / 3600`.
   - This value represents "uncollected" money (`dailyStats.pendingPiggyBank`), separate from "Earned Today".
   - It should persist correctly across refresh/reload (computed from `clockInAt` timestamp + rate, not just an in-memory counter, so it survives page reloads).
6. **Collect button**: pressing it:
   - Empties the piggy bank to `$0.00` with a "poof/coins fly out" animation.
   - Adds the collected amount into "Earned Today".
   - Persists the change to Firestore (`pendingPiggyBank` → 0, `collectedEarnings` += amount).
7. **ClockIn / ClockOut button** — large, primary, thumb-friendly button (bottom area, easy mobile reach):
   - Shows "Clock In" when not working; tapping starts a session (`sessions` doc created, `clockInAt` = now), timer + piggy bank start running.
   - Shows "Clock Out" when working; tapping ends the session (`clockOutAt` = now, `durationSeconds` & `earnings` computed), and updates `dailyStats.totalSecondsWorked`. **Money in the piggy bank at clock-out time is NOT auto-collected** — it stays in the piggy bank until the user presses Collect (clarify this behavior in the UI, e.g. piggy bank keeps showing pending amount and stops increasing once clocked out).
   - Button visually reflects state (color/icon change, e.g. green "Clock In" vs red "Clock Out").
8. **Bottom navigation** (or a simple icon/link) to reach the **Statistics** page.

### 4.3 Lucky Block (small button, top-right)
- Tapping it opens a modal/overlay showing **one random question** fetched from the `luckyQuestions` Firestore collection.
- Fetch strategy: read the full (or a reasonably sized) list of questions and pick one at random client-side, OR maintain a `count` field and fetch a random index — agent should implement whichever is simpler and cost-efficient for Firestore reads.
- Include a "Next question" button inside the modal to get another random one, and a close (X) button.
- Should feel light and fun (subtle pop-in animation).

### 4.4 Statistics Screen
- **Calendar view**: month grid; days with worked sessions are visually marked (e.g., colored dot or shaded background), tapping a day shows that day's total hours worked and earnings.
- **Weekly earnings**: total $ earned in the current week (Mon–Sun or Sun–Sat, pick one and be consistent), ideally with a simple bar chart (day-by-day breakdown, 7 bars).
- **Average earnings per day**: computed over a selectable period (e.g., last 7 days / last 30 days / all-time) — simple toggle or dropdown.
- Optional but encouraged: average hours worked per day, total hours this month, best day, current streak.
- All numbers formatted as currency (`$X.XX`) and duration as `HH:MM` or `Xh Ym`.
- Data source: read from `dailyStats` collection (fast aggregates) rather than recomputing from every raw session on each visit.

---

## 5. Animations ("Juicy" UX) — Required Moments

Implement smooth, satisfying animations for:
1. **Every second while clocked in**: the piggy bank counter ticks up — small pulse/scale bounce on the number and/or a subtle coin icon animation.
2. **Collect button press**: coins/particles fly from the piggy bank toward the "Earned Today" number; piggy bank does a "squish/empty" animation; "Earned Today" number does a satisfying count-up/pulse to its new value.
3. **Clock In**: button press feedback (scale down/up), a small confirmation animation (e.g., ripple, checkmark, or timer starting to visibly tick).
4. **Clock Out**: similar distinct feedback so it's clearly different from Clock In (e.g., different color flash).
5. **Lucky Block modal**: pop/fade-in transition when opening, subtle shuffle/dice animation when fetching a new question.
6. General micro-interactions: button press states, page/route transitions, calendar day selection highlight.

Use a real animation approach (CSS transitions/keyframes, Framer Motion, or GSAP) — avoid static/instant state changes for these key interactions.

---

## 6. Non-Functional Requirements

- **Mobile-first responsive design** — must look and work great on a phone screen; should not break on desktop (basic centered layout with max-width is fine for larger screens).
- **All interface text in English** (buttons, labels, error messages, modals, etc.).
- Real-time countdown/counters must remain accurate even if the tab is backgrounded or the page is refreshed (recompute elapsed time from stored timestamps rather than relying purely on `setInterval` accumulation).
- Reasonable Firestore security rules: users can only read/write their own `users/{uid}` and subcollections; `luckyQuestions` is read-only for authenticated users (no client writes).
- Basic loading and error states (e.g., "Loading your data…", network error messages).
- Code should be organized into clear components/modules (Auth, MainScreen, PiggyBank, ClockButton, StatsScreen, Calendar, LuckyBlockModal, Firebase config/service layer).

---

## 7. Deployment Requirements

- Repository hosted on **GitHub**, deployed via **GitHub Pages**.
- Set up either:
  - A GitHub Actions workflow that builds the Vite/React app and publishes `dist/` to the `gh-pages` branch on every push to `main`, **or**
  - The `gh-pages` npm package with a `deploy` script.
- Ensure routing works correctly on GitHub Pages (client-side routing quirks — e.g. use `HashRouter` if using React Router, or configure a 404.html fallback for BrowserRouter).
- Firebase config keys (apiKey, authDomain, projectId, etc.) should be stored in a config file / environment variables, with a clear note in the README about which values are safe to expose publicly (Firebase client config is not a secret, but security rules must still protect the data).

---

## 8. REQUIRED: Post-Completion Setup Guide for the User

**After the code is complete, the AI agent must provide the human user with a clear, step-by-step guide (in plain, non-technical language where possible) covering:**

1. **Creating a Firebase project**:
   - Go to the Firebase Console, create a new project.
   - Enable **Authentication** → turn on **Email/Password** and **Google** sign-in providers.
   - Create a **Firestore Database** (production or test mode) and set the security rules provided by the agent.
   - Add a **Web App** in Firebase project settings to get the `firebaseConfig` object (apiKey, authDomain, etc.).
2. **Where to paste the Firebase config** in the codebase (exact file/path).
3. **Seeding the `luckyQuestions` collection**: how to manually add sample question documents in the Firestore console (with an example document structure), or a script to bulk-import them.
4. **Setting up Google Sign-In specifically**: adding the correct authorized domains (including the GitHub Pages domain) in Firebase Auth settings, since Google OAuth requires domain whitelisting.
5. **Deploying to GitHub Pages**:
   - How to push the repo to GitHub.
   - How to enable GitHub Pages in repo settings (source branch/folder).
   - How to trigger/verify the GitHub Actions deploy (if used).
   - Reminder to add the deployed GitHub Pages URL to Firebase Auth's **authorized domains** list (otherwise login will fail on the live site).
6. **Testing checklist**: sign up, sign in with Google, edit hourly rate, clock in, watch piggy bank tick, collect, clock out, check stats page, check lucky block.

This guide must be delivered as a final explanation/document once implementation is done — the user is not a developer and needs concrete click-by-click instructions for the Firebase Console and GitHub UI.

---

## 9. Acceptance Criteria (Definition of Done)

- [ ] User can sign up / log in via Email+Password and Google.
- [ ] Hourly rate is editable and persists per user.
- [ ] Clock In starts a live `HH:MM:SS` timer and piggy bank accumulation ($/sec = rate/3600).
- [ ] Clock Out stops the timer/accumulation and correctly records the session.
- [ ] Collect button empties piggy bank into "Earned Today" with animation, and this persists correctly after page reload.
- [ ] "Earned Today" and piggy bank amount survive page refresh with correct values (recomputed from timestamps, not lost).
- [ ] Lucky Block button shows a random question from Firestore, with a way to get another.
- [ ] Statistics page shows a calendar, weekly earnings, and average daily earnings, all pulling real data.
- [ ] All required animations are implemented and feel smooth, not jarring or instant.
- [ ] All UI text is in English.
- [ ] Site is live on GitHub Pages and login works on the deployed domain (not just localhost).
- [ ] A written, non-technical setup guide (Firebase + GitHub Pages) has been delivered to the user.
