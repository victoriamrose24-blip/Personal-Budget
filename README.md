# Household Budget

An envelope-budgeting app: give every dollar a job, record what you spend,
reconcile against the bank, and see what's coming.

It is one HTML file. No build step, no framework, no accounts, no server.
You own the data and it never leaves your device.

---

## The files

All seven need to be deployed together. Only `index.html` normally changes.

| File | What it is |
|---|---|
| `index.html` | **The entire app** — markup, styles and logic in one file |
| `budget-manifest.json` | Lets the app install to a phone home screen |
| `budget-sw.js` | Service worker; makes the app open without a connection |
| `icon-192.png`, `icon-512.png` | App icons |
| `icon-512-maskable.png` | Icon for Android's shaped-icon slots |
| `apple-touch-icon.png` | iOS home-screen icon |

Deploy `index.html` on its own and the other six 404. The app still runs, but
installing to the home screen and offline access quietly stop working.

## Deploying

Push to the branch Netlify is watching, or drag all seven files into Netlify.
That's the whole process.

After deploying, if the app is already on your home screen, close it fully
(swipe it away from the app switcher) and reopen — switching back to it may
show the old version. The service worker fetches fresh whenever it can and only
falls back to its cache when offline, so you are never stuck on a stale build.

## Where your data actually lives

Nothing is stored on a server. There is no account to log into and nothing to
subscribe to. Everything is in two places in your browser, on the one device:

- **`localStorage`, key `householdBudgetState`** — envelopes, transactions,
  recurring items, reconcile balances.
- **IndexedDB, database `budgetReceiptsDB`** — receipt photos, kept separately
  because they are far too big for localStorage.

This is what makes the app durable: nothing can be discontinued out from under
it. It is also the thing to respect — clearing your browser's site data for
this site deletes your budget, and the app cannot get it back.

**Export is the real backup.** Keep a copy somewhere that is not the phone —
cloud drive, email to yourself, anywhere. The app nags every 14 days.

## If something goes wrong

**"It started empty and says the data couldn't be read."**
A red banner offers to download the unreadable data. Do that first, before
anything else. Unreadable JSON is usually still almost entirely readable text —
a bad write loses the end, not the years of records before it — so most of it
can normally be recovered by hand. The copy is kept safe from being overwritten,
but it is only worth keeping if you download it.

**"I imported the wrong file."**
A banner offers **Undo import** immediately afterwards, restoring what was there
before. It survives a reload.

**"It says storage is nearly full."**
localStorage is capped at 5 MB, which is roughly 17 years at 100 transactions a
month, or about 8 at 200. The warning appears at 80%, with real figures. Export
a backup, then delete some older transactions to free room. If a save ever fails
outright, the app offers to export on the spot — the unsaved change is still in
memory at that moment, so exporting rescues it.

**"A backup won't load."**
If it was written by a newer version of the app, it is refused on purpose rather
than loaded and stripped of fields this version doesn't understand. Open it with
the newer version.

## How the money works

- **Left to Assign** is income you have received but not yet given a job.
  Funding an envelope moves money from there into the envelope. Income always
  equals Left to Assign plus the sum of every envelope balance.
- **Goals** are per-paycheck targets. *Fund Goal* moves exactly that amount in.
- **Reconcile** compares what the app thinks has cleared against what the bank
  actually says. Tick things off as they clear; the difference should reach zero.
- **The Cash Flow Forecast** projects forward from the balance you entered on
  Reconcile, adjusted for anything recorded but not yet cleared — *not* from the
  ledger total, which only counts from your first recorded transaction. Keep the
  Reconcile balance current or the forecast drifts.
- **Card charges** don't reduce projected checking. They are listed and totalled
  separately, because cash only moves when you pay the card.

## Data format

State carries `schemaVersion` (currently `1`). Older files without one are
repaired on load: missing fields are filled in, bad dates and frequencies
replaced, and the version stamped. Exports include everything plus a
`__receipts` map of the photos.

## Notes for whoever edits this next

- The whole app is `index.html`. Styles live in one `<style>` block, logic in one
  `<script>` block at the end.
- Mobile is a fixed-height shell that never scrolls; the only scrolling element
  is `.scroll-area` inside the active tab. There is deliberately no
  `position: sticky` anywhere on mobile — headers are ordinary non-scrolling flex
  items, which is why they cannot drift.
- Which tab is open is one piece of state, with both the desktop and mobile
  flags always set together. The CSS decides which applies at the current width,
  so crossing the breakpoint — including rotating a phone — needs no JS.
- Anything user-entered that reaches `innerHTML` goes through `escapeHtml()`, and
  CSV fields go through `csvField()` to defuse spreadsheet formula injection.
- Money is handled with `roundMoney()` everywhere to avoid float drift.
- The only external dependency is Google Fonts, and it degrades to system fonts
  if unavailable. Keep it that way — the absence of dependencies is the feature.
