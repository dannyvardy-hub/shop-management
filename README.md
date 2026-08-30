# Order Book

A small app for recording orders. Every item you type into an order is
remembered, so next time you just start typing and pick it from the list
instead of retyping it. Data is stored in the cloud (Firebase) so it follows
you across devices, and the whole thing deploys for free on Vercel.

Built for tracking stock ordered from Kenya, priced in Kenyan Shillings and
paid for in Ugandan Shillings once converted — with tax settled after the
order arrives.

- **New order** — add items by price per piece (KSh) and quantity in dozens
  or bundles (1 bundle = 10 pieces). Enter today's KSh→UGX exchange rate to
  see the subtotal in both currencies (tax isn't included yet).
- **Orders** — every order, its status, and a running total. Tap into one to
  walk it through its lifecycle:
  1. **Approve** — deducts the UGX subtotal from My Deposit.
  2. **Mark received** — records the date it arrived.
  3. **Confirm received** — records a second confirmation date.
  4. **Enter tax** — type the tax rate per dozen; bundle quantities convert
     to dozens automatically. This deducts the tax from My Deposit and marks
     the order fully completed with a grand total.
  Each order can be downloaded as a PDF summary, or viewed on the page
  itself, at any stage.
- **Products** — the running list of items, built automatically as you use
  them. Edit names/prices or delete ones you don't need.
- **My Deposit** — your own float for paying these orders. Top it up
  whenever; approving an order and later confirming its tax both draw it
  down automatically. Deleting an order reverses any deductions it made.
- **People** — a separate, unrelated feature for people you lend items to.
  Each person has their own deposit balance you can add to or draw down —
  this is independent of My Deposit and doesn't affect orders.

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
