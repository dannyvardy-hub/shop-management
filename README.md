# Order Book

A small app for recording orders. Every item you type into an order is
remembered, so next time you just start typing and pick it from the list
instead of retyping it. Data is stored in the cloud (Firebase) so it follows
you across devices, and the whole thing deploys for free on Vercel.

- **New order** — pick items from your saved product list (or type a new one,
  which gets saved automatically), set quantity and price, save the order.
- **Orders** — every order you've recorded, with status (open / fulfilled /
  cancelled) and a delete option.
- **Products** — the running list of items, built automatically as you use
  them. Edit names/prices or delete ones you don't need.
- **People** — people you lend items to. Each person has a deposit balance:
  add money to it any time, and optionally deduct an order's total from it
  when you record that order for them. Their page shows the full deposit
  history and every order linked to them.

It's locked behind a simple sign-in (one account, created by you) so your
data isn't public.

---

## 1. Set up Firebase (free)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
   and create a new project (you can turn off Google Analytics, you don't
   need it).
2. In the project, click **Build → Authentication → Get started**, then
   enable the **Email/Password** sign-in method.
3. Still in Authentication, go to the **Users** tab and click **Add user**.
   Enter the email and password you'll use to sign in — this is your login
   for the app.
4. Click **Build → Firestore Database → Create database**. Choose any
   location close to you, and start in **production mode** (we'll set the
   real rules next).
5. In Firestore, go to the **Rules** tab and replace the contents with what's
   in `firestore.rules` in this project, then click **Publish**. This makes
   sure only your signed-in account can read or write your data.
6. Click the gear icon → **Project settings**, scroll to **Your apps**, click
   the `</>` (web) icon, and register an app (any nickname). Firebase will
   show you a `firebaseConfig` object with keys like `apiKey`,
   `authDomain`, etc. — keep this tab open, you'll need it next.

## 2. Configure the project

Copy the example env file and fill it in with the values from step 1.6:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Then run it locally:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the
email/password you created in step 1.3.

## 3. Deploy to Vercel (free)

The easiest path is through GitHub:

1. Push this project to a new GitHub repository.
2. Go to [vercel.com](https://vercel.com), sign in, click **Add New →
   Project**, and import that repository.
3. Vercel auto-detects Next.js — before deploying, open **Environment
   Variables** and add the same six `NEXT_PUBLIC_FIREBASE_...` values from
   your `.env.local`.
4. Click **Deploy**. You'll get a free `your-project.vercel.app` URL you can
   open from any device.

Prefer not to use GitHub? You can also deploy straight from your machine with
the [Vercel CLI](https://vercel.com/docs/cli): run `npx vercel`, follow the
prompts, then add the same environment variables with `npx vercel env add`
(once per variable) and redeploy with `npx vercel --prod`.

---

## Notes

- Both Firebase's free "Spark" plan and Vercel's free "Hobby" plan comfortably
  cover personal, low-traffic use like this — no card required.
- If you ever want a second person to have their own login, add them as
  another user in Firebase Authentication; the Firestore rules already allow
  any signed-in user, so no rule changes are needed. If you'd rather each
  person only see their own orders, say so and the data model can be split
  per-user.
- Tech: Next.js (App Router) + Tailwind CSS v4 for the app, Firebase
  Authentication + Firestore for cloud storage and sync.
