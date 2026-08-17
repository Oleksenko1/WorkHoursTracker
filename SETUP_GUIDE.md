# Work Hours Tracker — Setup & Deployment Guide

Welcome! Follow this simple step-by-step guide to connect your own **Firebase Project** and deploy your application to **GitHub Pages**.

---

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **"Add project"**.
2. Name your project (e.g., `work-hours-tracker`), then click **Continue** and **Create Project**.

### Enable Authentication
1. In the left menu, click **Build** → **Authentication** → click **Get Started**.
2. Under the **Sign-in method** tab:
   - Click **Email/Password** → turn on **Enable** → click **Save**.
   - Click **Add new provider** → select **Google** → turn on **Enable** → choose your support email → click **Save**.

### Enable Firestore Database
1. In the left menu, click **Build** → **Firestore Database** → click **Create database**.
2. Choose a location closest to you, keep default settings, and click **Next** → **Enable**.
3. Under the **Rules** tab in Firestore, paste these security rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can only read & write their own data
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       // Lucky questions are readable by all authenticated users
       match /luckyQuestions/{questionId} {
         allow read: if request.auth != null;
         allow write: if false; // Read-only from client
       }
     }
   }
   ```
4. Click **Publish**.

### Register Web App & Get API Keys
1. In Project Overview (gear icon top left) → click **Project settings**.
2. Under **Your apps**, click the **Web icon (`</>`)**.
3. Register your app name (e.g. `Work Hours Tracker Web`).
4. Copy the `firebaseConfig` credentials displayed on screen.

---

## 2. Where to Paste Your Firebase Config (.env & Security)

### Local Development
1. Open the `.env` file in the root of your project folder.
2. Paste your credentials:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
   ```

### Protecting `.env` in GitHub (Preventing Leaks)
1. **Never commit `.env` to Git**: `.gitignore` is already configured to block `.env`. Only commit `.env.example`.
2. **For GitHub Pages Automatic Deployment**:
   - Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**.
   - Click **New repository secret** and add each variable (e.g. `VITE_FIREBASE_API_KEY`).
   - GitHub Actions will inject them securely during build.
3. **Note on Client API Keys**: Firebase client keys are meant to be embedded in front-end JavaScript. Security is enforced by **Firestore Security Rules** and **Authorized Domains**, not by keeping client keys secret from browsers.

---

## 3. Seed `luckyQuestions` Collection in Firestore

To populate your custom questions in Firestore:

1. In the Firebase Console, go to **Firestore Database** → click **Start collection**.
2. Set Collection ID to: `luckyQuestions`.
3. Add document:
   - Document ID: `q1`
   - Field `text` (string): `"If you could master any skill instantly, what would it be?"`
   - Field `category` (string): `"Fun"`
4. Repeat for any questions you wish to add. *(Note: If this collection is empty, the app automatically falls back to built-in questions!)*

---

## 4. Setting Up Authorized Domains for Google Sign-In

Google OAuth requires your domain to be authorized:

1. Go to Firebase Console → **Authentication** → **Settings** tab → **Authorized domains**.
2. Click **Add domain**.
3. Add your GitHub Pages domain (e.g., `yourusername.github.io`).

---

## 5. Deploy to GitHub Pages

### Option A: Automatic via GitHub Actions (Recommended)
1. Push this codebase to a GitHub repository on the `main` branch.
2. Add your Firebase keys under **Settings** → **Secrets and variables** → **Actions**.
3. In GitHub, go to **Settings** → **Pages** → under **Build and deployment**, set Source to **Deploy from a branch** and select `gh-pages` branch.

### Option B: Manual via npm script
1. In `package.json`, update `"homepage"` to your URL: `https://<your-username>.github.io/<repo-name>`.
2. Run:
   ```bash
   cmd /c npm run deploy
   ```

---

## 6. Testing Checklist

- [x] **Sign Up / Sign In**: Create account with Email/Password & Google Sign-In.
- [x] **Hourly Rate**: Tap `Rate: $15.00/hr` pill, edit value, click Save.
- [x] **Clock In**: Tap large green button to start live `HH:MM:SS` timer & piggy bank counter.
- [x] **Piggy Bank Accumulation**: Watch piggy bank counter tick up every second. Refresh page to verify earnings persist.
- [x] **Collect Coins**: Tap Collect button to trigger coin shower animation and move money into "Earned Today".
- [x] **Clock Out**: Tap red Clock Out button to end session.
- [x] **Lucky Block**: Tap Lucky Block top right to read questions & roll next question.
- [x] **Statistics**: Click Statistics tab to view month calendar, 7-day weekly bar chart, and daily averages.
