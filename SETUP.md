# Setup — about 10 minutes, once

You'll do two things: create a free database, then put the app on the web.
Nothing here costs money and no credit card is asked for.

Everything in this folder is the finished app. You only ever edit **`config.js`**.

---

## Part 1 — the database (5 min)

**1.** Go to **supabase.com** → *Start your project* → sign in with GitHub or email.

**2.** Click **New project**.
- Name: anything (`spending`)
- Database password: let it generate one, then **save it in your password manager**
  (you won't need it for this app, but you'll want it someday)
- Region: **West US (North California)** — closest to Petaluma
- Click **Create new project**, then wait ~2 minutes while it builds.

**3.** In the left sidebar click **SQL Editor** → **New query**.

**4.** Open **`schema.sql`** from this folder, copy the whole file, paste it into
that box, and click **Run** (or ⌘↵).
You should see **"Success. No rows returned."** That's correct — it built the
table and locked it down.

**5.** In the left sidebar click **Project Settings** (the gear) → **Data API**.
Copy the **Project URL**. It looks like `https://abcdefghijklm.supabase.co`.

**6.** Still in Project Settings → **API Keys**. Copy the **`anon` / `public`** key.
It's a long string. ⚠️ Copy the **anon** one, *not* `service_role` — service_role
is a master key and must never go in a web page.

**7.** Open **`config.js`** in this folder and paste both values in:

```js
SUPABASE_URL: "https://abcdefghijklm.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...the long string...",
```

Save the file. **Part 1 done.**

---

## Part 2 — put it on the web (5 min)

**1.** Go to **github.com** → **New repository**.
- Name: `spending`
- **Public** (GitHub Pages needs Public on a free account — this is safe; see
  *Is this secure?* below)
- Click **Create repository**

**2.** On the new repo page click **uploading an existing file**.

**3.** Drag in **everything inside this `spendlog` folder** — `index.html`,
`app.css`, `app.js`, `config.js`, `manifest.webmanifest`, `sw.js`, and the
**`icons` folder**. Drag the `icons` folder itself so the structure is kept.
Then click **Commit changes**.

**4.** Go to **Settings** → **Pages** (left sidebar).
- Source: **Deploy from a branch**
- Branch: **main**, folder: **/ (root)** → **Save**

**5.** Wait 1–2 minutes, then refresh. GitHub shows your link at the top:

```
https://YOURNAME.github.io/spending/
```

**That's the link.** Text it to Kellie.

---

## Part 3 — both phones (1 min each)

On **each** iPhone:

1. Open the link in **Safari** (it must be Safari, not Chrome, for step 3)
2. Tap the person's name when it asks who's using the phone
3. Tap the **Share** button (the box with an arrow) → scroll → **Add to Home Screen** → **Add**

It now sits on the home screen with its own icon and opens full-screen, like any
other app. Both phones share one ledger — log something on one and it shows on
the other within a few seconds.

---

## How it works day to day

- Tap the amount, tap a category, tap **Log it**. Three seconds.
- The number at the top is what's left this month, and what that means per day.
- **Month** shows every category against its target, and a split of who spent what.
- **History** shows everything, newest first. Tap **×** to fix a mistake.
- **No signal?** Log anyway. It queues on the phone and sends itself when you're
  back on. The dot by "Synced" turns orange and the entry looks faded until it lands.

---

## Is this secure?

The repo is public, so the page's code is public. That's fine, and here's why:

- The **anon key is designed to be public.** It's in every Supabase web app.
- Your data is **not** reachable with that key alone. `schema.sql` removes all
  direct access to the table and exposes only three functions, each of which
  requires your **household code** — the long random string in `config.js`.
- So the only thing protecting your data is that household code. **Don't paste
  it anywhere public** (a forum, a screenshot, a support ticket).
- If you ever want to rotate it: change `HOUSEHOLD` in `config.js` to a new random
  string and re-upload. Your old entries stay under the old code — move them in the
  SQL editor with
  `update entries set household = 'NEW' where household = 'OLD';`

If you'd rather the code not be public at all, deploy to **Cloudflare Pages** or
**Netlify** instead — both are free and both support private repos. Same files,
just drag the folder onto their dashboard.

---

## Changing the budget

Edit the `CATEGORIES` numbers in `config.js` and re-upload that one file. Both
phones pick it up next time they open. The targets that ship with it come from
`SPENDING-CUT-PLAN.md`:

| | |
|---|--:|
| The twelve things you tap in | **$2,932/mo** |
| Autopay bills (rent, insurance, phone, utilities, subscriptions) | $793/mo |
| **Total plan** | **$3,725/mo** |

---

## If something's wrong

**"Almost there" screen** — `config.js` still has the `PASTE_...` placeholders,
or the URL doesn't start with `https://`.

**Dot stays orange, says "Sync problem"** — the URL or anon key is wrong. Open the
page on a computer, press ⌥⌘I → Console, and look at the error. A 404 means the
`schema.sql` step didn't run; re-run it.

**Nothing loads after uploading** — check the files sit at the repo *root*, not
inside a `spendlog/` folder. `index.html` must be top level.

**Changes don't show up** — the app caches itself so it opens instantly offline.
Close it fully and reopen, or bump `CACHE = "spendlog-v1"` to `v2` in `sw.js`.

---

## Getting the data back to the analysis

**History → Export as spreadsheet** gives a CSV of everything, with who logged
each item. That drops straight into the ledger in this project.
