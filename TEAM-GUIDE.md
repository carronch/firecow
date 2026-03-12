# 📚 FireCow Team Guide

This guide covers everything you need to know to manage, deploy, and update our tour websites.

## 🚀 1. Creating a New Site

We have automated tools to create new tour sites in seconds.

### Quick Deploy (Recommended)
This command creates a new site, fills it with content from your CSV, builds it, and prepares it for deployment.

```bash
# Syntax: pnpm deploy-site <slug> <url> <type>
pnpm deploy-site my-new-tour https://example.com/tour fishing
```

*   `slug`: The internal name (e.g., `manual-antonio-fishing`).
*   `url`: The reference URL to scrape content from (optional).
*   `type`: The template type (`fishing`, `catamaran`, `snorkeling`, `diving`, `surfing`).

### Manual Creation
It is faster to just copy the `template` folder, rename it, and update `package.json`.

---

## 📝 2. Managing General Site Content (CSV)

We use a central **CSV file** to manage the general content for all our sites. This includes:
*   Hero Images & Text
*   Daily Activities
*   Customer Reviews
*   Contact Info (Phone, Map, Address)

**How to Update:**
1.  Open `firecow-bookings/sites-content.csv`.
2.  Find the row for your site (or add a new one).
3.  Edit the text or image URLs.
4.  **Ask the AI:** "I updated the CSV, please sync the content for [site-name]."

*For detailed instructions on the CSV format, see [CSV-CONTENT-GUIDE.md](CSV-CONTENT-GUIDE.md).*

---

## 💰 3. Managing Tours & Pricing (Markdown)

Specific Tour details (Prices, Durations, Checkouts) are **NOT** in the CSV. They are managed by editing **Markdown (.md)** files directly in the code.

**Location:** `apps/[site-name]/src/content/tours/[tour-name].md`

### 🏷️ Pricing Configuration
We support both simple and complex pricing structures.

**Option A: Simple Price (Same for everyone)**
```yaml
price: 100 
# Adult = $100, Child = $100
```

**Option B: Adult & Child Rates**
```yaml
price:
  adult: 100
  child: 75
```

### 📅 Seasonal Pricing
You can override the base price for specific date ranges (e.g., Holidays which are more expensive, or Low Season).

```yaml
seasonalPricing:
  - name: "Christmas Peak"
    startDate: "2026-12-20"
    endDate: "2027-01-05"
    price:
      adult: 150
      child: 100
  - name: "Low Season"
    startDate: "2026-09-01"
    endDate: "2026-10-31"
    price:
      adult: 80
      child: 50
```

### 🚫 Blackout Dates
To stop bookings on specific days (e.g., maintenance, closed holidays):

```yaml
blackoutDates:
  - "2026-12-25"
  - "2027-01-01"
```

---

## 🔒 4. Credentials & Environment

For the **Booking System** to work, each site needs access to Stripe (Payments) and Zoho (CRM).

### ⚡ Quick Setup (Automated)
Our tools now **automatically copy** the `.env` file and set the `PUBLIC_SITE_URL` for you when you create a new site!

**Prerequisites:**
1.  The site must be in `sites-content.csv`.
2.  The `public_site_url` column must be filled in the CSV.
3.  The `apps/template/.env` file must exist (it acts as the source).

If all of the above are true, you **don't need to do anything**. The script handles it.

### Manual Setup (Fallback)
If for some reason the automation fails, you can set it up manually:

```bash
cp apps/template/.env apps/my-new-site/.env
```

**⚠️ Important:** After copying, open the new `.env` file and update the `PUBLIC_SITE_URL` to match your new site's domain.

### Environment Variables Reference
If you need to set them manually:

```env
# Stripe Keys (Shared)
PUBLIC_STRIPE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Zoho Integration (Shared)
ZOHO_CLIENT_ID=1000.BXD...
ZOHO_CLIENT_SECRET=494...
ZOHO_REFRESH_TOKEN=1000.47c...

# Site Specific
PUBLIC_SITE_URL=https://my-new-site.com
```

### Production (Cloudflare Pages)
When deploying, you must add these same variables to the **Cloudflare Dashboard**:
1.  Go to **Pages** -> Your Project -> **Settings** -> **Environment Variables**.
2.  Add the keys and values listed above.
3.  **Redeploy** the latest commit for them to take effect.

---

## 🚢 5. Deployment

We use **Cloudflare Pages**.

1.  **Commit your changes** to Git:
    ```bash
    git add .
    git commit -m "Updated prices for holiday season"
    git push origin main
    ```
2.  Cloudflare will detect the change and build the site automatically.
3.  Typical build time is ~2 minutes.

### Troubleshooting Builds
If a build fails, check:
*   Did you set the Environment Variables in Cloudflare?
*   Are there JSON syntax errors in your tour files?
