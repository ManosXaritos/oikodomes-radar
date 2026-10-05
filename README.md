# Νέες Οικοδομές Radar — setup guide

This guide takes you from these files to a live website. You don't need to write code. Plan about
2 hours for the first setup. Do the steps in order.

**What you're setting up**

| Service | What it does | Cost to start |
|---|---|---|
| GitHub | Stores the code | Free |
| Supabase | Database and customer logins | Free plan |
| Vercel | Runs the website and the daily robot | Free to test; **Pro ($20/month) before you charge customers**, because the free plan is for non-commercial use |
| Stripe | Subscriptions, card payments, free trial | No monthly fee; a fee per payment |
| Resend | Sends the morning emails | Free up to 3,000 emails/month |
| A domain | Your address, e.g. oikodomesradar.gr; needed for sending email | ~€10–15/year |

---

## Step 1 — Put the code on GitHub

1. Go to github.com → **New repository**. Name: `oikodomes-radar`. Choose **Private**. Create.
2. On the new repository page, click **uploading an existing file**.
3. Unzip the file you got from Claude and drag **all the files and folders inside it** into the page
   (not the outer folder itself). Click **Commit changes**.

## Step 2 — Create the database (Supabase)

1. Go to supabase.com → sign up → **New project**. Name: `oikodomes-radar`. Region: **Central EU (Frankfurt)**.
   Save the database password somewhere safe.
2. When the project is ready: left menu → **SQL Editor** → **New query**.
3. Open the file `supabase/schema.sql`, copy everything, paste it in, click **Run**. You should see "Success".
4. Left menu → **Project Settings** → **API**. Keep this page open; you'll copy three values in Step 4:
   - Project URL
   - `anon` `public` key
   - `service_role` key (secret: never share it)
5. Left menu → **Authentication** → **URL Configuration**. You'll fill this in Step 5.

## Step 3 — Set up payments (Stripe)

Do all of this first in **Test mode** (toggle at the top right of Stripe). You'll repeat it in live mode at the end.

1. **Product catalog** → **Add product** three times:

   | Product name | Monthly price | Yearly price |
   |---|---|---|
   | Τοπικό | €29 recurring monthly | €290 recurring yearly |
   | Περιφέρεια | €49 recurring monthly | €490 recurring yearly |
   | Επαγγελματικό | €89 recurring monthly | €890 recurring yearly |

   For each product add **both** prices. Then click each price and copy its **ID** (starts with `price_`).
   You'll need all six.
2. **ΦΠΑ**: Product catalog → **Tax rates** → **New**: name `ΦΠΑ`, 24%, **Exclusive** (added on top),
   region Greece. Copy its ID (starts with `txr_`). Your prices stay €29/€49/€89 and Stripe adds 24% on each bill.
3. **Founding customer code**: Product catalog → **Coupons** → **New**: €10 off, Duration **Forever**,
   apply to product **Τοπικό** only, max 10 redemptions. Then add a **Promotion code** on it: `IDRYTIKOS`.
   (€29 − €10 = €19 for life.)
4. **Settings → Billing → Customer portal**: turn on "Customers can switch plans" (add the three products),
   "Cancel subscriptions", "Update payment methods" and "View invoice history". Save.
5. Webhook: you'll create it in Step 6, after the site has an address.

## Step 4 — Create the website (Vercel)

1. Go to vercel.com → sign up **with your GitHub account**.
2. **Add New → Project** → choose `oikodomes-radar` → **Import**.
3. Open **Environment Variables** and add every line from `.env.example`. For now:
   - `NEXT_PUBLIC_SITE_URL`: leave as `https://oikodomes-radar.vercel.app` (fix after deploy if different)
   - Supabase values from Step 2.4
   - Stripe secret key from Stripe → **Developers → API keys**, the six `price_` IDs and the `txr_` tax rate ID
   - `CRON_SECRET`: any long random text, e.g. 40 random letters and numbers
   - `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_COMPANY_DETAILS` (your business name, ΑΦΜ, ΔΟΥ, address)
   - Resend and `STRIPE_WEBHOOK_SECRET`: leave empty for now
4. Click **Deploy**. When it finishes you get your address, e.g. `https://oikodomes-radar.vercel.app`.
   If it's different, update `NEXT_PUBLIC_SITE_URL` (Settings → Environment Variables) and **Redeploy**.

## Step 5 — Connect logins

In Supabase → **Authentication → URL Configuration**:
- **Site URL**: your website address
- **Redirect URLs**: add `https://YOUR-ADDRESS/auth/callback`

Optional but nice: **Authentication → Email Templates → Magic Link**, translate the email to Greek.

## Step 6 — Connect Stripe to the site

1. Stripe → **Developers → Webhooks → Add endpoint**.
2. URL: `https://YOUR-ADDRESS/api/stripe/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`.
4. Copy the **Signing secret** (starts with `whsec_`) into Vercel as `STRIPE_WEBHOOK_SECRET`, then **Redeploy**.

## Step 7 — The morning email (Resend + domain)

1. Buy your domain (any Greek registrar for `.gr`).
2. resend.com → sign up → **Domains → Add domain** → follow the steps to add the DNS records at your registrar.
3. **API Keys → Create** → copy into Vercel as `RESEND_API_KEY`.
4. In Vercel set `EMAIL_FROM`, e.g. `Νέες Οικοδομές Radar <proi@yourdomain.gr>`. **Redeploy.**
5. Later, connect the same domain to Vercel (**Settings → Domains**) so the site lives at `yourdomain.gr`.
   Then update `NEXT_PUBLIC_SITE_URL`, Supabase URLs (Step 5) and the Stripe webhook URL (Step 6).

Tip: in Supabase → Authentication → **SMTP Settings**, you can also send the login emails through Resend
(host `smtp.resend.com`, port 465, user `resend`, password = your Resend API key). Supabase's built-in
sender is limited to a few emails per hour, so do this before you have real customers.

## Step 8 — Start the daily robot and test everything

1. Vercel → your project → **Settings → Cron Jobs**. You'll see two jobs. Click **Run** on `/api/cron/ingest`.
   It pulls the last 7 days of permits. Run it **3–4 more times** on the first day: each run places about
   20 more municipalities on the map. After that it runs by itself every morning.
2. Check it worked: Supabase → **Table Editor → permits** should have rows. **runs** shows each run.
3. Test a full customer journey in Stripe test mode:
   - Open your site → **Δοκίμασε δωρεάν 14 μέρες** → enter your email → open the link.
   - Choose a plan → pay with test card `4242 4242 4242 4242`, any future date, any CVC.
   - Choose your area and products → **Αποθήκευση** → **Χάρτης**.
   - Next morning you should get the email (or click **Run** on `/api/cron/digest`).

The robot runs at 07:00 Greek summer time (06:00 in winter), the email about 1.5 hours later.

## Step 9 — Go live

1. In Stripe, switch to **live mode** and repeat Step 3 (products, prices, coupon, portal) and Step 6 (webhook).
2. In Vercel replace the Stripe values with the **live** ones: secret key, six price IDs, webhook secret. Redeploy.
3. Upgrade Vercel to **Pro** before taking real payments.

## Before you charge your first customer (important)

- **Receipts for Greek tax (myDATA).** Stripe sends receipts, but these are not Greek legal documents.
  For every payment you must issue a proper receipt or invoice through your invoicing provider. Ask your
  accountant which provider to use; several connect to Stripe automatically.
- **Legal pages.** `/oroi` (terms) and `/aporrito` (privacy) are starting templates. Have a lawyer read them.
- **Privacy.** The site shows the project, the area and the official document, never owners. Keep telling
  customers to contact engineers and builders, not private homeowners.
- **Map tiles.** The map uses OpenStreetMap's free tiles, which is fine while you're small. If you grow to
  hundreds of daily users, switch to a map provider with a free tier (e.g. MapTiler); it's a one-line change
  in `app/app/MapView.js`.

## When something goes wrong

| Problem | Where to look |
|---|---|
| No new permits | Supabase → table `runs`: the latest `ingest` row shows the error |
| Customer paid but has no access | Stripe → Developers → Webhooks → your endpoint → failed events. Usually a wrong `STRIPE_WEBHOOK_SECRET` or price ID |
| Login email doesn't arrive | Supabase → Authentication → Logs; set up SMTP (Step 7 tip) |
| Morning email doesn't arrive | Resend → Logs; check the domain is verified and `EMAIL_FROM` uses it |
| Anything else | Vercel → your project → **Logs** |

## Where things are in the code

- `lib/diavgeia.js` — reads permits from Diavgeia
- `lib/classify.js` — project types, products, timelines
- `lib/plans.js` — prices and what each plan can see
- `app/page.js` — the public homepage
- `app/app/` — the customer area (map, settings, plan choice)
- `app/api/` — payments, permits, daily jobs
- `tests/core.test.js` — checks for the core logic (`npm test`)
