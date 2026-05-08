# FI Dashboard — Financial Independence Planner

A single-file dashboard for tracking investments and projecting your FI age in both **USA** and **India**. No server, no build step. Your data lives in **your own Google Sheet**.

## What's in this folder

| File | Purpose |
|---|---|
| `index.html` | The whole app. Open it in any browser. |
| `apps-script.gs` | Google Apps Script that turns your Google Sheet into a tiny REST API. Paste it into the script editor of your sheet. |
| `README.md` | This file. |

## Setup (one-time, ~3 minutes)

1. **Create a Google Sheet** (any name).
2. In that sheet: **Extensions → Apps Script**.
3. Delete the default code, paste the contents of `apps-script.gs`, hit save.
4. **Deploy → New deployment → Type: Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize when prompted, copy the **Web App URL** (ends in `/exec`).
6. Open `index.html` in your browser (double-click is fine).
7. Go to the **Settings** tab → paste the Web App URL → **Save Connection** → **Test Connection**.

The script will auto-create two tabs in your sheet:
- `Common` — your age, monthly needs, USD↔INR rate
- `Investments` — one row per investment account

## Using the app

### Data Entry tab
- **Common Inputs:** current age, monthly needs in USA (USD), monthly needs in India (INR), USD→INR rate, **Inflation % USA**, **Inflation % India**.
- **Investments:** add as many as you like. Each has Account, Current Amount (USD), Yearly Contribution (USD), Yearly Return (%), and Type (`liquid` / `retirement` / `immovable`).
- **Save to Google Sheet** writes the full state to your sheet.
- **Reload from Google Sheet** pulls back what's stored.

### Dashboard tab
- **Total Investments**, **Total Liquid**, and your **FI age** in both India and USA.
- Allocation by type (chart + table).
- **Investments at a Future Age** — drag the slider to view total + per-type investments at any future age.

## How retirement age is calculated

- Withdrawal rate: **3% p.a.**
- Calculation uses **liquid investments only** (excludes retirement & immovable).
- For each future year, the corpus is projected as `corpus = (corpus + yearly_contribution) * (1 + return)`, using the weighted-average return across your liquid accounts.
- **Contributions stop after age 60.** Once the projected age exceeds 60, no new yearly contribution is added — the corpus continues to compound on returns alone. This applies to both the FI-age math and the slider chart.
- **Inflation-adjusted needs** — at year *Y* from today:
  - `needs_USA(Y)   = (monthly_needs_USA × 12) × (1 + inflation_USA)^Y`
  - `needs_India(Y) = ((monthly_needs_INDIA × 12) / USD_to_INR) × (1 + inflation_India)^Y`
- Corpus needed at year *Y* = `needs(Y) / 0.03`.
- FI age = current age + the first year *Y* where projected liquid corpus ≥ corpus needed *that same year*.
- If your corpus never reaches the (rising) target within 60 years, the dashboard shows "Not reached".

## Privacy

Your data is sent only to the Apps Script Web App URL you paste — which writes to **your** Google Sheet under **your** Google account. There is no other backend. The browser also keeps a local cache (in `localStorage`) so the app still works if the network is down.

## Troubleshooting

- **"Connection failed"**: re-deploy the Apps Script with access set to "Anyone" (not "Anyone with Google account") and use the URL ending in `/exec`.
- **Numbers look off**: confirm "Monthly Needs — India" is in **INR** and "Monthly Needs — USA" is in **USD**.
- **Edits not appearing in sheet**: hit **Save to Google Sheet**. The Save button is the only thing that writes.
