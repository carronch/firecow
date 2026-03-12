# 🚀 Getting Started with FireCow Bookings

This guide will walk you through setting up your first tour site in under 30 minutes.

## Prerequisites

- **Node.js** 18+ installed
- **PNPM** installed (`npm install -g pnpm`)
- **Git** installed
- Code editor (VS Code recommended)

## Step 1: Clone and Install (5 minutes)

```bash
# Navigate to where you want the project
cd ~/Projects

# Clone the repository
git clone <your-repo-url> firecow-bookings
cd firecow-bookings

# Install all dependencies
pnpm install
```

This will install dependencies for:
- Root workspace
- Template app
- All packages

## Step 2: Set Up Environment Variables (5 minutes)

```bash
# Navigate to template
cd apps/template

# Copy example env file
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor
```

**For now, you can use placeholder values:**
- Zoho credentials: Get from [Zoho Developer Console](https://api-console.zoho.com/)
- Stripe keys: Get from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
- Leave others as defaults for local development

## Step 3: Start Development Server (2 minutes)

```bash
# Make sure you're in firecow-bookings root
cd /path/to/firecow-bookings

# Start the template dev server
pnpm --filter template dev
```

You should see:
```
🚀 astro v4.0.0 started in XXXms

  ┃ Local    http://localhost:4321/
  ┃ Network  use --host to expose
```

## Step 4: View Your Site (1 minute)

Open your browser and navigate to:
```
http://localhost:4321
```

You should see:
- ✅ Hero section with "Experience the Enchanted Islands"
- ✅ Trust banner with logos
- ✅ Tour cards
- ✅ Testimonials
- ✅ Contact section

**🎉 Congratulations! Your template is running!**

## Step 5: Open Keystatic CMS (2 minutes)

Navigate to the admin panel:
```
http://localhost:4321/keystatic
```

Here you can:
- Create/edit tours
- Add upsells
- Manage FAQs

## Step 6: Customize Your First Tour (10 minutes)

### Option A: Using Keystatic (Recommended)

1. Go to `http://localhost:4321/keystatic`
2. Click "Tours" in sidebar
3. Click "Create Tour"
4. Fill in the form:
   - Tour Name: "Catamaran Sunset Cruise"
   - Tagline: "Sail into paradise"
   - Duration: "3 hours"
   - Base Price: 150
   - Upload a hero image
5. Click "Create"

### Option B: Manual File Creation

Create `apps/template/src/content/tours/catamaran-sunset.md`:

```yaml
---
tourId: cat-001
tourName: catamaran-sunset
tagline: Sail into paradise as the sun paints the Pacific golden
zohoServiceId: ""
heroImage: /images/tours/catamaran-hero.jpg
duration: 3 hours
maxCapacity: 12
basePrice: 150
highSeasonPrice: 195
category: water-sports
featured: true
whatsIncluded:
  - Open bar with premium drinks
  - Snorkeling equipment
  - Professional crew
  - Sunset views
whatToBring:
  - Swimsuit and towel
  - Sunscreen
  - Camera
  - Light jacket for evening
---

Experience the magic of Costa Rica's Pacific coast aboard our luxury catamaran. Watch the sun sink into the ocean while dolphins play in our wake. This isn't just a boat ride—it's an unforgettable journey.

## What to Expect

Our premium catamaran accommodates up to 12 guests for an intimate experience. We depart at 4:00 PM and sail along the stunning coastline, with stops for snorkeling in crystal-clear waters.

As the golden hour approaches, we'll position ourselves for the perfect sunset view while you enjoy cocktails and appetizers.
```

## Step 7: See Your Changes (Instant)

The dev server hot-reloads automatically. Refresh your browser to see updates.

## Next Steps

### Create Your First Site Instance

Now that the template is working, let's create your first actual tour site:

```bash
# From project root
mkdir apps/catamaran-sunset
cd apps/catamaran-sunset
```

Create `package.json`:
```json
{
  "name": "catamaran-sunset",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@firecow/template": "workspace:*"
  },
  "scripts": {
    "dev": "astro dev --port 4322",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

Create `astro.config.mjs`:
```javascript
import { defineConfig } from 'astro/config';
import baseConfig from '../template/astro.config.mjs';

export default defineConfig({
  ...baseConfig,
  site: 'https://catamaransunset.com',
});
```

Create your content:
```bash
mkdir -p src/content/tours
cp ../template/src/content/tours/catamaran-sunset.md src/content/tours/tour.md
```

Install dependencies:
```bash
cd ../..  # Back to root
pnpm install
```

Start your site:
```bash
pnpm --filter catamaran-sunset dev
```

Open `http://localhost:4322` - you now have your first independent site! 🎊

### Add Images

1. Add images to `apps/catamaran-sunset/public/images/`
2. Or use Bunny CDN URLs
3. Reference in your content

### Customize Content

Edit the tour.md file to match your specific tour:
- Change tour name
- Update pricing
- Add your images
- Modify description

## Common Issues

### Port Already in Use
```bash
# Use a different port
pnpm --filter template dev -- --port 3000
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Changes Not Showing
```bash
# Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
# Or restart dev server
```

## What You've Built

✅ **Template**: Master design that all sites inherit from
✅ **Dev Environment**: Hot-reloading, fast builds
✅ **CMS**: Keystatic for easy content management
✅ **Components**: Reusable, typed components
✅ **Styling**: Tailwind CSS design system
✅ **First Site**: Ready to customize and deploy

## Next: Deploy to Production

See `DEPLOYMENT.md` for instructions on:
- Setting up Cloudflare Pages
- Connecting custom domain
- Configuring CI/CD
- Going live!

## Get Help

- **Documentation**: Check README.md
- **Examples**: Look at template files
- **Issues**: Create GitHub issue
- **Chat**: Join our Discord (coming soon)

---

**Time to first site: ~30 minutes ✨**

Now go build something amazing! 🚀
