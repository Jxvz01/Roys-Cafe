# Supabase Setup Guide for Roy's Cafe

Follow these steps once to connect your cafe website to a real backend.

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Choose a name (e.g. `roys-cafe`), set a strong DB password, pick your region
4. Wait ~2 minutes for the project to be ready

---

## Step 2 — Run the Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Click **"New Query"**
3. Open `supabase/schema.sql` from this project
4. Paste contents and click **Run**

---

## Step 3 — Create the Image Storage Bucket

1. Go to **Storage** in the sidebar
2. Click **"New Bucket"**
3. Name it exactly: `cafe-images`
4. Toggle **"Public bucket"** to ON
5. Click **Create**

Then set the upload policy:
1. Click on the `cafe-images` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"** → Choose **"For full customization"**
4. Set:
   - **Policy name**: `Authenticated upload`
   - **Allowed operation**: INSERT
   - **Target roles**: `authenticated`
   - **USING expression**: `true`
5. Save. Repeat for UPDATE and DELETE if needed.

---

## Step 4 — Create Your Admin Account

1. Go to **Authentication** → **Users** in Supabase
2. Click **"Invite user"** or **"Add user"**
3. Enter your email and a strong password
4. This email + password will be used to log in to `/admin.html`

---

## Step 5 — Get Your API Keys

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public** key (long string)

---

## Step 6 — Add Keys to the Project

Open `js/supabase-config.js` and replace the placeholders:

```js
const SUPABASE_URL      = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY-HERE';
```

---

## Step 7 — Push and Deploy

```bash
git add .
git commit -m "chore: add Supabase config"
git push
```

Vercel will auto-deploy. Your admin panel is at `/admin.html`.

---

## Notes

- The **anon key** is safe to expose publicly — it only allows what RLS policies permit
- Only **authenticated users** (your admin account) can modify data
- Everyone visiting the site can **read** menu and gallery data in real-time
- Images are stored in Supabase Storage (50MB/file, 1GB total on free tier)
