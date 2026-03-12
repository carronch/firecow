# 🔥🐄 FireCow Bookings - Multi-Site Tour Booking Platform

A production-ready, multi-site booking platform built with Astro, Turborepo, Zoho Bookings, and Stripe. Create hundreds of conversion-optimized tour websites from a single template.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <your-repo-url> firecow-bookings
cd firecow-bookings

# Install dependencies
pnpm install

# Start development server
pnpm --filter template dev

# Open browser
# http://localhost:4321
```

## 📁 Project Structure

```
firecow-bookings/
├── apps/
│   ├── template/              # Master template (all sites inherit from this)
│   ├── catamaran-sunset/      # Individual tour site (content only)
│   └── [more sites]/
├── packages/
│   ├── ui/                    # Shared components
│   ├── booking-engine/        # Zoho + Stripe integration
│   └── config/                # Shared config
├── workers/
│   └── booking-api/           # Cloudflare Workers API
└── tools/
    └── site-generator/        # CLI to create new sites
```

## 🤠 FireCow Manager

Local dashboard for managing content and operations across all sites.

### Start Manager
```bash
pnpm manager
```

Opens at `http://localhost:3000`

### Features
-   **Sites & Content**: Edit `sites-content.csv` and tour markdown files with visual editors
-   **Operations Center**: View Zoho reservations and create Stripe payment links

### Deployment
**Manager runs locally only** - it requires Node.js file system access to read/write content files in the monorepo. For team collaboration, each member runs it locally on their machine.

**Note:** The manager cannot be deployed to Cloudflare Pages due to file system dependencies. For remote access, consider deploying to Railway, Render, or similar Node.js platforms.


## 🎨 Template Features

### Landing Page Sections
- ✅ **Hero Section** - Full-screen with overlay and CTAs
- ✅ **Trust Banner** - Featured in logos (TripAdvisor, Nat Geo, etc.)
- ✅ **Experiences Grid** - Tour cards with images and pricing
- ✅ **Testimonials** - Customer reviews with ratings
- ✅ **Contact Section** - WhatsApp & Email integration
- ✅ **Responsive Header** - Mobile menu, sticky navigation
- ✅ **Footer** - Multi-column with social links

### Design System
- **Colors**: Primary (Blue), Secondary (Purple), Accent (Yellow)
- **Typography**: Inter (body), Poppins (headings)
- **Components**: Buttons, Cards, Badges, Modals
- **Animations**: Fade-in, Slide-up, Hover effects
- **Utilities**: Responsive grid, spacing, shadows

### ⚡ Performance & Maintenance
- **PageSpeed Optimization**: Achieves 90+ scores on Mobile/Desktop (Core Web Vitals compliant).
- **Maintenance Scripts**:
    - `scripts/deep-clean-sites.sh`: Syncs all optimized components (Hero, Booking Widget, Headers, etc.) to all sites.
    - `scripts/update-all-sites.sh`: General content updates.
    - `scripts/apply-pagespeed-optimizations.sh`: Applies critical CSS/JS fixes.

## 🛠️ Tech Stack

- **Framework**: Astro 4.0 (Static Site Generation)
- **UI**: React + Tailwind CSS
- **CMS**: Keystatic (Git-based content management)
- **Booking**: Custom Booking Widget (Zoho Integrated)
- **Payments**: Stripe Elements
- **Live Chat**: Zoho SalesIQ
- **CDN**: Bunny CDN (images)
- **Hosting**: Cloudflare Pages
- **API**: Cloudflare Workers
- **Monorepo**: Turborepo + PNPM

## 📝 Creating a New Tour Site

### 🚀 Quick Deploy (Recommended)

Deploy a complete tour site with one command:

```bash
pnpm deploy-site test-sport-fishing https://example.com fishing
```

**What this does:**
- ✅ Creates site from template
- ✅ Fetches reference content from URL
- ✅ Selects tour-specific placeholder images
- ✅ Builds the site
- ✅ Deploys to Cloudflare Pages
- ✅ Live at `https://test-sport-fishing.pages.dev`

**Supported tour types:** `fishing`, `catamaran`, `snorkeling`, `diving`, `surfing`

📚 **Full Guide**: See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)

📘 **Team Operations Guide**: See [TEAM-GUIDE.md](TEAM-GUIDE.md) - Covers CMS, Pricing, and Day-to-Day Operations.

### 🎨 Create Site Only

Just create the site without building or deploying:

```bash
pnpm new-site my-tour https://example.com catamaran
pnpm --filter @firecow/my-tour dev
```

### Option 2: Manual Setup

1. **Create site directory**
```bash
mkdir apps/your-tour-name
cd apps/your-tour-name
```

2. **Create package.json**
```json
{
  "name": "your-tour-name",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@firecow/template": "workspace:*"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

3. **Create astro.config.mjs**
```javascript
import { defineConfig } from 'astro/config';
import baseConfig from '../template/astro.config.mjs';

export default defineConfig({
  ...baseConfig,
  site: 'https://yourtourname.com',
});
```

4. **Create content directory**
```bash
mkdir -p src/content/tours
```

5. **Add tour content** (src/content/tours/tour.md)
```yaml
---
tourId: your-tour-001
tourName: Amazing Beach Tour
tagline: Paradise awaits
zohoServiceId: "12345678"
heroImage: /images/hero.jpg
duration: "4 hours"
maxCapacity: 12
basePrice: 150
highSeasonPrice: 195
category: water-sports
featured: true
---

Your tour description here...
```

6. **Build and deploy**
```bash
pnpm install
pnpm build
```

## 🎯 Content Management

### Using Keystatic CMS

1. **Start dev server**
```bash
pnpm --filter your-tour-name dev
```

2. **Open Keystatic admin**
```
http://localhost:4321/keystatic
```

3. **Edit content**
- Tours: Add/edit tour details
- Upsells: Manage upsell options
- FAQs: Update frequently asked questions

### Content Collections

#### Tours
- Tour ID, Name, Tagline
- Pricing (base + high season)
- Images, descriptions
- Duration, capacity
- What's included/what to bring

#### Upsells
- Name, price, category
- Description, image
- Linked to tours

#### FAQs
- Question, answer
- Category, display order

## 🔧 Configuration

### Environment Variables

Create `.env` in each site:

```env
# Zoho Bookings
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Site Config
PUBLIC_SITE_URL=https://yourtourname.com
PUBLIC_WHATSAPP_NUMBER=+50612345678
```

### Zoho SalesIQ

Update in `BaseLayout.astro`:
```javascript
$zoho.salesiq = {
  widgetcode: 'YOUR_WIDGET_CODE_HERE',
  values: {
    tour_name: 'Your Tour Name',
    page_url: window.location.href,
  }
};
```

## 🚀 Deployment

### Cloudflare Pages

1. **Connect to GitHub**
- Go to Cloudflare Pages dashboard
- Connect your repository

2. **Configure build**
```
Build command: pnpm --filter your-tour-name build
Output directory: apps/your-tour-name/dist
```

3. **Set environment variables**
- Add all env vars from `.env`

4. **Deploy**
- Push to main branch
- Auto-deploys on every commit

### Custom Domain

1. Add domain in Cloudflare Pages
2. Update DNS records (CNAME)
3. SSL auto-provisioned

## 📊 Analytics

- **Cloudflare Web Analytics**: Privacy-friendly, built-in
- **Conversion Tracking**: Track booking completions
- **Zoho SalesIQ**: Chat analytics and visitor tracking

## 🎨 Customization

### Brand Colors

Edit `tailwind.config.mjs`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your primary color shades
      },
    },
  },
},
```

### Fonts

Edit `BaseLayout.astro`:
```html
<link
  href="https://fonts.googleapis.com/css2?family=YourFont"
  rel="stylesheet"
/>
```

### Components

All components in `apps/template/src/components/`:
- Modify once, updates all sites
- Use Astro or React
- Fully typed with TypeScript

## 🧪 Testing

```bash
# Run tests
pnpm test

# Type checking
pnpm --filter template astro check

# Lint
pnpm lint

# Build all sites
pnpm build
```

## 📚 Documentation

- [Astro Docs](https://docs.astro.build)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Keystatic](https://keystatic.com/docs)
- [Zoho Bookings API](https://www.zoho.com/bookings/api/)
- [Stripe Docs](https://stripe.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

- **Email**: hello@firecowbookings.com
- **WhatsApp**: +506 1234-5678
- **Documentation**: [Link to docs]

## 🎯 Roadmap

### Completed ✅
- [x] Template foundation
- [x] Landing page sections
- [x] Responsive design
- [x] Keystatic CMS integration  
- [x] Site generator CLI (`pnpm new-site`)
- [x] Unified deployment script (`pnpm deploy-site`)
- [x] Automatic placeholder image selection
- [x] Cloudflare Pages deployment
- [x] Booking Widget (Glassmorphism + Zoho)
- [x] PageSpeed Optimization (90+ Scores)
- [x] **FireCow Manager** - Local dashboard for content & operations

### In Progress 🚧
- [ ] Stripe checkout flow
- [ ] Zoho Bookings API Deep Integration

### Planned 📋
- [ ] Magic link generator
- [ ] Automated emails
- [ ] WhatsApp notifications
- [ ] Multi-language support

---

Built with ❤️ by FireCow Bookings Team
