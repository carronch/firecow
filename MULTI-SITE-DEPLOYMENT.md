# 🚨 Important: Deployment & Multi-Site Setup Guide

## ❓ Why Only Isla Tortuga Deployed?

### The Issue:
Only **isla-tortuga-costa-rica** deployed because that's the only site with a **Cloudflare Pages project** configured.

### How Cloudflare Pages Works:
- Each website needs its **own Cloudflare Pages project**
- One GitHub push ≠ all sites deploy automatically
- You need to set up each site individually in Cloudflare

---

## 🔧 Solution: Deploy All Sites

### Option 1: Manual Deploy via Wrangler (Fastest)
Deploy each site individually using the command line:

```bash
# Build all sites
pnpm build

# Deploy each site one by one
npx wrangler pages deploy apps/isla-tortuga-costa-rica/dist --project-name=isla-tortuga-costa-rica
npx wrangler pages deploy apps/catamaran-tour-isla-tortuga/dist --project-name=catamaran-tour-isla-tortuga
npx wrangler pages deploy apps/private-charter-isla-tortuga/dist --project-name=private-charter-isla-tortuga
npx wrangler pages deploy apps/fishing-jaco-costa-rica/dist --project-name=fishing-jaco-costa-rica
npx wrangler pages deploy apps/catamaran-sunset/dist --project-name=catamaran-sunset
```

**First time?** You'll need to login:
```bash
npx wrangler login
```

### Option 2: Set Up Cloudflare Pages Projects (For Auto-Deploy)
To get automatic deployments like isla-tortuga has:

1. **Go to Cloudflare Dashboard:**
   https://dash.cloudflare.com/pages

2. **Create a New Pages Project for Each Site:**
   - Click "Create a project"
   - Connect to GitHub repo: `carronch/firecow`
   - **Build settings for each:**
     - Build command: `cd apps/[site-name] && npm run build`
     - Build output: `apps/[site-name]/dist`
     - Root directory: `/`

3. **Repeat for all 5 sites:**
   - catamaran-tour-isla-tortuga
   - private-charter-isla-tortuga
   - fishing-jaco-costa-rica
   - catamaran-sunset

**Note:** This is tedious but only needs to be done once!

---

## 📊 CSV Update Workflow

### ❌ What Happened:
You edited `sites-content.numbers` (or Excel) but the changes didn't deploy because:
1. The `.numbers` file isn't tracked by git (and shouldn't be)
2. You need to **export to CSV** before syncing

### ✅ Correct Workflow:

#### Step 1: Edit Content
Edit in **Excel, Google Sheets, or Numbers**:
- Open `sites-content.csv` OR `sites-content.numbers`
- Make your changes
- **Save** / **Export as CSV** (must be `sites-content.csv`)

#### Step 2: Sync CSV to Sites
```bash
pnpm sync-csv
```
This generates the `site.config.ts` files for all sites.

#### Step 3: Commit & Push
```bash
git add -A
git commit -m "Updated site content from CSV"
git push origin main
```

#### Step 4: Deploy

**If you have Cloudflare Pages projects set up:**
- Sites deploy automatically on push ✅

**If you DON'T (which is your case):**
```bash
# Build all
pnpm build

# Deploy manually
npx wrangler pages deploy apps/[site-name]/dist --project-name=[site-name]
```

---

## 🎯 Quick Action Plan for You

### Right Now:

1. **Did you edit the CSV/Numbers file?**
   - If yes: Make sure it's saved as `sites-content.csv`
   - Run: `pnpm sync-csv`
   - Commit: `git add -A && git commit -m "CSV updates" && git push`

2. **Deploy all sites:**
   ```bash
   # Build everything
   pnpm build
   
   # Deploy each site
   npx wrangler pages deploy apps/catamaran-tour-isla-tortuga/dist --project-name=catamaran-tour-isla-tortuga
   npx wrangler pages deploy apps/private-charter-isla-tortuga/dist --project-name=private-charter-isla-tortuga
   npx wrangler pages deploy apps/fishing-jaco-costa-rica/dist --project-name=fishing-jaco-costa-rica
   npx wrangler pages deploy apps/catamaran-sunset/dist --project-name=catamaran-sunset
   ```

### For the Future:

Set up Cloudflare Pages projects for each site so they auto-deploy on git push.

---

## 📝 Summary

**Why only isla-tortuga deployed:**
- Only that site has a Cloudflare Pages project configured

**Why new CSV lines didn't deploy:**
- You need to export Numbers → CSV, then `pnpm sync-csv`, then commit

**What to do:**
- Use `npx wrangler` to deploy each site manually
- OR set up Cloudflare Pages projects for auto-deploy
