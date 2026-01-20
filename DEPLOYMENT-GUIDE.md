# 🚀 Unified Site Deployment Guide

## One-Command Deployment

We've created a **unified deployment script** that handles everything in a single command:

```bash
pnpm deploy-site <site-name> [reference-url] [tour-type]
```

**Note:** The site name is automatically used as both the internal folder name AND the Cloudflare project name.

This single command will:
1. ✅ Create the site from template
2. ✅ Fetch reference content from URL
3. ✅ Select and set placeholder images
4. ✅ Build the site
5. ✅ Deploy to Cloudflare Pages

## Quick Examples

### Deploy a Fishing Tour Site
```bash
pnpm deploy-site fishing-jaco https://jacofishing.com fishing
```
→ Creates site `fishing-jaco` and deploys to `https://fishing-jaco.pages.dev`

### Deploy a Catamaran Tour Site
```bash
pnpm deploy-site tortuga-cruise https://costacatcruises.com catamaran
```
→ Creates site `tortuga-cruise` and deploys to `https://tortuga-cruise.pages.dev`

### Deploy a Snorkeling Tour Site
```bash
pnpm deploy-site coral-reef-tours https://example.com snorkeling
```
→ Creates site `coral-reef-tours` and deploys to `https://coral-reef-tours.pages.dev`

## Step-by-Step Process

The script shows clear progress:

```
🚀 ========================================
   DEPLOYING: your-site-name
========================================

📦 STEP 1/5: Creating site...
   📂 Copying template...
   ✅ Site scaffolded

🌍 STEP 2/5: Fetching reference content...
   ✅ Reference saved from https://example.com

🖼️  STEP 3/5: Setting placeholder images for "catamaran" tours...
   ✅ Images configured

🔨 STEP 4/5: Building site...
   ✅ Build successful

☁️  STEP 5/5: Deploying to Cloudflare Pages...
   ✅ Deployment successful!

✅ ========================================
   DEPLOYMENT COMPLETE!
========================================

🌐 Your site should be live at:
   https://your-project.pages.dev
```

## Arguments Explained

| Argument | Required | Description | Example |
|----------|----------|-------------|---------|
| `site-name` | ✅ Yes | Name for the site (used as folder name AND Cloudflare project name) | `fishing-jaco` |
| `reference-url` | ⭐ Optional | URL to fetch reference content from | `https://example.com` |
| `tour-type` | ⭐ Optional | Tour type for automatic image selection | `fishing`, `catamaran`, `snorkeling` |

**Note:** The `site-name` you provide will be used as:
- The internal app folder name (`apps/fishing-jaco`)
- The npm package name (`@firecow/fishing-jaco`)
- The Cloudflare Pages project name (`fishing-jaco`)
- Part of the live URL (`https://fishing-jaco.pages.dev`)

## Supported Tour Types

The script automatically selects appropriate images for:
- `fishing` - Deep sea fishing imagery
- `catamaran` - Sailing and catamaran scenes
- `snorkeling` - Underwater snorkeling shots
- `diving` - Scuba diving imagery
- `surfing` - Surfing action shots

If no tour type is specified, generic tropical beach images are used.

## Prerequisites

Before running the deployment:

1. **Cloudflare Login**
   ```bash
   npx wrangler login
   ```

2. **Create Cloudflare Project** (if it doesn't exist)
   ```bash
   pnpm create-cloud-project <project-name>
   ```

## Error Handling

The script will:
- ✅ Skip steps if already completed (e.g., site exists, reference already fetched)
- ⚠️  Show warnings for non-critical failures (e.g., reference fetch fails)
- ❌ Stop and show errors for critical failures (e.g., build fails)

### Common Issues

**Build Fails:**
- Check that the template has no syntax errors
- Verify all Astro components have proper frontmatter fences (`---`)

**Deployment Fails:**
- Make sure you're logged in: `npx wrangler login`
- Verify the Cloudflare project exists

**Images Not Set:**
- Ensure `settings.yaml` exists in the template
- Check that tour type is spelled correctly

## Alternative Workflows

### Just Create Site (No Deployment)
```bash
pnpm new-site my-site https://example.com fishing
```

### Manual Build & Deploy
```bash
pnpm --filter @firecow/my-site build
npx wrangler pages deploy apps/my-site/dist --project-name=my-cloudflare-project
```

### Local Development
```bash
pnpm --filter @firecow/my-site dev
```

## What Gets Created

After running `deploy-site`, you'll have:

```
apps/your-site/
├── src/
│   └── content/
│       └── homepage/
│           └── settings.yaml  # ← Images auto-configured
├── REFERENCE.md              # ← Content from reference URL
├── package.json              # ← Updated with site name
└── dist/                     # ← Built files (ready for deployment)
```

## Next Steps After Deployment

1. **View Your Site**
   - Visit `https://your-project.pages.dev`

2. **Customize Content**
   - Edit via Keystatic: `https://your-project.pages.dev/keystatic`
   - Or directly edit `settings.yaml`

3. **Replace Placeholder Images**
   - Upload real images to bunny.net
   - Update URLs in settings.yaml or Keystatic

4. **Add Custom Domain**
   - Configure in Cloudflare Pages dashboard

## Summary

**Before (3 separate steps):**
```bash
pnpm new-site my-site https://example.com fishing
pnpm --filter @firecow/my-site build
npx wrangler pages deploy apps/my-site/dist --project-name=my-site
```

**Now (1 command):**
```bash
pnpm deploy-site my-site https://example.com fishing
```

🎉 **That's it!** Your site is live at `https://my-site.pages.dev` in one command!
