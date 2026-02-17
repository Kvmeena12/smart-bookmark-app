# 🔖 Smart Bookmark App

A real-time bookmark manager built with Next.js 14 (App Router), Supabase, and Tailwind CSS.

**Live URL:** https://smart-bookmark-app-nu-wheat.vercel.app  
**GitHub:** https://github.com/yourusername/smart-bookmark-app

---

## Features

- ✅ Google OAuth sign-in (no email/password)
- ✅ Add bookmarks (URL + title with auto-detection)
- ✅ Private per-user bookmarks (Row Level Security)
- ✅ Real-time sync across tabs via Supabase Realtime
- ✅ Delete bookmarks with optimistic UI
- ✅ Search/filter bookmarks
- ✅ Favicon auto-loading
- ✅ Deployed on Vercel

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (PostgreSQL) |
| Real-time | Supabase Realtime (Postgres Changes) |
| Styling | Tailwind CSS + custom design system |
| Deployment | Vercel |

---

## Setup & Deployment

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/smart-bookmark-app.git
cd smart-bookmark-app
npm install
```

### 2. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → New Project
2. In the SQL Editor, run the contents of `supabase/schema.sql`
3. Go to **Settings → API** and copy your URL and anon key

### 3. Configure Google OAuth in Supabase
1. Go to **Authentication → Providers → Google**
2. Enable Google provider
3. In [Google Cloud Console](https://console.cloud.google.com):
   - Create an OAuth 2.0 Client ID
   - Add Authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
4. Paste Client ID and Secret into Supabase

### 4. Set environment variables
```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key
```

### 5. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

### 6. Deploy to Vercel
1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Add Vercel URL to Supabase **Authentication → URL Configuration → Redirect URLs**:
   - `https://your-app.vercel.app/auth/callback`

---

## Problems Encountered & How I Solved Them

### 1. Cookie handling in Next.js 14 App Router
**Problem:** `cookies()` from `next/headers` returns a read-only cookie store in Server Components, and attempting to `.set()` on it throws an error.

**Solution:** Used `@supabase/ssr` which handles this gracefully — the `setAll` method in `createServerClient` is wrapped in a try/catch that safely ignores the error when called from Server Components (since the session cookie is only needed for middleware). The actual cookie setting happens in middleware where the response object is mutable.

---

### 2. Real-time updates appearing twice (duplicate items)
**Problem:** When I added a bookmark, the optimistic update added it immediately, and then the Supabase Realtime INSERT event fired and added it again — causing duplicates.

**Solution:** In the `INSERT` handler, I check if the incoming bookmark's ID already exists in state:
```ts
setBookmarks((prev) => {
  if (prev.find((b) => b.id === newBookmark.id)) return prev;
  return [newBookmark, ...prev];
});
```
This de-duplicates across optimistic updates and real-time events from *other* tabs — the event from the same tab is filtered, while events from other tabs are added.

---

### 3. RLS blocking real-time events
**Problem:** Supabase Realtime wasn't delivering events even though the DB writes were working. The channel would subscribe but never fire callbacks.

**Solution:** Two-part fix:
1. Added `ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;` to the schema — Realtime only works on tables explicitly added to the publication.
2. Added `filter: user_id=eq.${user.id}` to the channel subscription so it only listens for the authenticated user's events. Without the filter, Supabase's RLS on Realtime silently drops events it can't verify.

---

### 4. Google OAuth redirect URI mismatch on Vercel
**Problem:** After deploying to Vercel, the OAuth redirect to `/auth/callback` was failing because the redirect URI wasn't whitelisted in both Supabase and Google Cloud Console.

**Solution:**
- Added the production URL to Supabase → Authentication → URL Configuration → Redirect URLs
- Added `https://your-app.vercel.app/auth/callback` to Google OAuth Client's authorized redirect URIs
- In the callback route, used `x-forwarded-host` header detection to handle Vercel's proxied requests correctly

---

### 5. Middleware redirect loop
**Problem:** The middleware was redirecting logged-in users from `/` to `/dashboard`, but on first OAuth callback, the user would land at `/` before the session cookie was set — causing a redirect loop.

**Solution:** Used `supabase.auth.getUser()` (not `getSession()`) in middleware — it validates the JWT via Supabase's auth server on every call, ensuring session state is always accurate and preventing stale session issues. The `/auth/callback` path is excluded from the middleware matcher.

---

### 6. Favicon images failing to load
**Problem:** `<img>` tags for favicon URLs from Google's favicon service would sometimes fail with broken images, especially for sites with strict CORS.

**Solution:** Added an `onError` handler that sets `faviconError = true`, which falls back to showing a colored div with the site's initials — providing a graceful degradation that always looks intentional.

---

## Architecture Notes

### Why App Router over Pages Router?
App Router enables server-side data fetching with React Server Components — the initial bookmark list is fetched on the server and hydrated immediately, with no loading flash. Client components (`"use client"`) handle real-time subscriptions and interactive UI.

### Why optimistic updates?
Adding a bookmark feels instant — the card appears immediately with a temporary ID, which is replaced with the real DB ID after the insert resolves. On error, it rolls back. This creates a snappy UX without waiting for network round-trips.

### Security
All bookmark queries use Row Level Security (RLS) policies that enforce `auth.uid() = user_id` at the database level — not just in application code. Even if someone bypassed the API, they couldn't read another user's bookmarks.
