# Khan Digital Solution – Digital Visiting Card & Business Profile

A production-ready, mobile-first responsive Digital Visiting Card and Business Profile web application for **Khan Digital Solution** (Founder: **Shofikul Islam Samim**).

Built using **HTML5**, **CSS3**, **Vanilla JavaScript**, and powered by **Supabase** for Authentication, Database, and Storage. Deployable on **GitHub Pages** with zero paid backend or server overhead.

---

## 🚀 Live Pages Overview

- **Personal Profile Card**: `index.html` (Visiting card with direct Call, WhatsApp, Email, Save Contact vCard, dynamic QR Code, social media icons).
- **Business Profile**: `business.html` (Corporate identity, services showcase, independent social channels, business contact links, QR code).
- **Admin Panel**: `admin.html` (Secure dashboard for editing profile, business info, uploading avatar/logo to Supabase Storage, managing services, custom social channels, and QR code settings).

---

## 📁 File Structure

```
/
├── index.html                   # Public Personal Profile Digital Visiting Card
├── business.html                # Public Business Profile & Services Page
├── admin.html                   # Secure Admin Panel with Authentication
├── css/
│   └── style.css                # Premium modern mobile-first stylesheet
├── js/
│   ├── config.js                # Core configuration, Supabase client, & vCard generator
│   ├── app.js                   # Public frontend scripts (QR, actions, renderers)
│   └── admin.js                 # Admin dashboard, auth, image upload, & database sync
├── assets/
│   └── placeholders/
│       ├── avatar.jpg           # Founder headshot portrait
│       └── logo.jpg             # Khan Digital Solution corporate monogram logo
├── supabase.sql                 # Complete database schema, RLS, and storage policies
└── README.md                    # Setup, Supabase, and GitHub Pages deployment guide
```

---

## 🛠️ Step-by-Step Setup Guide

### 1. How to Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and click **Start your project** (Free tier).
2. Choose your organization and click **New project**.
3. Name your project (e.g., `khan-digital-solution`).
4. Set a strong database password and select a region near your primary audience (e.g., Singapore or Mumbai).
5. Click **Create new project** and wait 1–2 minutes for initialization.

---

### 2. How to Run `supabase.sql`

1. In your Supabase dashboard, click the **SQL Editor** tab (terminal icon on the left menu).
2. Click **New Query**.
3. Open the file `supabase.sql` from this repository and copy the entire content.
4. Paste it into the SQL Editor.
5. Click **Run** (or `Ctrl+Enter`).
6. You should see `Success. No rows returned`. This creates:
   - The `site_data` table with initial default values.
   - The `admin_users` table with `samim.khanmiyaa@gmail.com`.
   - The `is_admin()` security function.
   - Strict Row Level Security (RLS) policies (public read, admin-only write).
   - The `kds-assets` public storage bucket with admin write policies.

---

### 3. How to Verify / Create the Storage Bucket

Running `supabase.sql` automatically registers the storage bucket `kds-assets`! To verify:

1. In the Supabase dashboard, click **Storage** on the left menu.
2. Verify that `kds-assets` exists and has the **Public** badge.
3. If not already public, click the three dots next to `kds-assets` &rarr; **Edit bucket** &rarr; Toggle **Public bucket** &rarr; **Save**.

---

### 4. How to Create the Admin User

1. In Supabase dashboard, go to **Authentication** &rarr; **Users**.
2. Click **Add User** &rarr; **Create User**.
3. Enter your Admin Email:
   ```
   samim.khanmiyaa@gmail.com
   ```
4. Enter a secure password (e.g., at least 8 characters).
5. Toggle **Auto Confirm User?** to **ON** (so no confirmation email is required).
6. Click **Create User**.

*(Note: If you use a different admin email, also update it in the `admin_users` table via the SQL Editor: `insert into admin_users (email) values ('your-email@gmail.com');`)*

---

### 5 & 6. How to Configure Supabase URL and Publishable/Anon Key

1. In your Supabase dashboard, click **Project Settings** (gear icon) &rarr; **API**.
2. Copy:
   - **Project URL** (e.g., `https://abcdefghijkl.supabase.co`)
   - **Project API Keys** &rarr; **`anon` `public`** key.
   *(CRITICAL: NEVER use or expose the `service_role` secret key!)*

#### Two Easy Ways to Apply Credentials:

**Option A (Direct in Admin UI - No code editing needed!):**
1. Open `admin.html` in your browser.
2. Sign in with your admin credentials.
3. Click the **Settings** tab.
4. Paste your **Supabase Project URL** and **Anon Key**.
5. Click **Test Connection**, then click **Save & Connect Supabase**.
6. The app will immediately link to your live Supabase cloud database!

**Option B (In Code):**
Open `js/config.js` and paste your credentials into the constants:
```javascript
const DEFAULT_SUPABASE_URL = "https://your-project.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "your-anon-key-here";
```

---

### 7. How to Deploy to GitHub Pages

The application uses relative paths (`./css/style.css`, `./js/app.js`, etc.) specifically designed to work inside any GitHub Pages subfolder (e.g., `https://shofikulislamsamim.github.io/kds-digital-card/`).

1. Create a new GitHub repository named `kds-digital-card`.
2. Push or upload all repository files (`index.html`, `business.html`, `admin.html`, `css/`, `js/`, `assets/`, `supabase.sql`).
3. In GitHub, go to **Settings** &rarr; **Pages** (under Code and automation).
4. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: `main` (or `master`), folder: `/ (root)`
5. Click **Save**.
6. Within 1–2 minutes, your website will be live at:
   ```
   https://YOUR-USERNAME.github.io/kds-digital-card/
   ```

---

### 8. How to Use the Admin Panel

1. Navigate to:
   ```
   https://YOUR-USERNAME.github.io/kds-digital-card/admin.html
   ```
2. Log in with your admin email and password.
3. In the Dashboard:
   - **Personal Profile**: Update your name, title, bio, phone numbers, and upload a new headshot photo (auto-uploaded to `kds-assets` bucket).
   - **Personal Socials**: Add or toggle Facebook, Instagram, LinkedIn, YouTube, TikTok, and custom platforms.
   - **Business Profile**: Update company name, tagline, about section, contact info, and company logo.
   - **Business Socials**: Manage independent business accounts.
   - **Services**: Add new services, edit titles/descriptions/icons, drag or click **Move Up / Move Down** to reorder, or toggle active status.
   - **QR & Public**: Preview and download high-resolution QR codes.
   - **Settings**: Test Supabase connection, export JSON backups, or restore defaults.
4. Click the prominent **Save Changes** button at the top right.
5. Watch for the confirmation message:
   ```
   "Changes saved successfully"
   ```
6. Refresh your public profile (`index.html`) or business profile (`business.html`) to see your real-time updates!

---

## 🔒 Security Summary

- **Public Visitors**: Have read-only access to `site_data` through Row Level Security (`select using (true)`).
- **Admin Write**: Restricted to authenticated users whose email is validated by the `is_admin()` SQL function against `admin_users`.
- **Zero Exposed Secrets**: Only the safe public `anon` key is used in frontend JavaScript.
- **Client Storage**: Public images are served securely through the public bucket `kds-assets` with upload permissions locked to admins.

---

## 👤 Credits

- **Founder & CEO**: Shofikul Islam Samim
- **Company**: Khan Digital Solution
- **Tagline**: *Your Growth, Our Mission*
