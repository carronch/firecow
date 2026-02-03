# 📊 CSV Content Management System

## Overview

This system allows you to manage ALL your tour sites from a single CSV file (`sites-content.csv`). Edit the CSV in Excel, Google Sheets, or any text editor, then have AI sync the changes to your sites.

## 🗂️ CSV Structure

### Fields Explanation

| Field | Description | Format | Example |
|-------|-------------|--------|---------|
| **site_id** | Folder name in `apps/` | kebab-case | `isla-tortuga-costa-rica` |
| **site_name** | Display name of the tour | Text | `Isla Tortuga Costa Rica` |
| **site_emoji** | Icon for the site | Single emoji | `🏝️` |
| **hero_image_url** | Main hero/banner image | Full URL | `https://images.unsplash.com/photo-...` |
| **daily_activities** | What guests do during tour | Pipe-separated text: `Activity 1 \| Activity 2 \| Activity 3` | `Snorkeling \| Beach lunch \| Kayaking` |
| **tour_schedule** | Timeline of the day | Pipe-separated text: `Time - Activity \| Time - Activity` | `7:00 AM - Pickup \| 9:00 AM - Depart` |
| **gallery_img_01** to **gallery_img_06** | Gallery images (at least 4) | Full URLs | `https://images.unsplash.com/...` |
| **review_1_image** | Reviewer profile photo | Full URL (use pravatar.cc for demos) | `https://i.pravatar.cc/150?img=1` |
| **review_1_text** | Review content | Text (keep under 200 chars) | `Amazing experience! Best tour ever...` |
| **review_1_author** | Reviewer name | Text | `Sarah Johnson` |
| **review_2_image** | Second reviewer photo | Full URL | `https://i.pravatar.cc/150?img=3` |
| **review_2_text** | Second review | Text | `Highly recommend!...` |
| **review_2_author** | Second reviewer name | Text | `Michael Chen` |
| **review_3_image** | Third reviewer photo | Full URL | `https://i.pravatar.cc/150?img=5` |
| **review_3_text** | Third review | Text | `Perfect day!...` |
| **review_3_author** | Third reviewer name | Text | `Emily Rodriguez` |
| **google_business_url** | Google My Business link | Full URL | `https://g.page/your-business` |
| **phone_number** | Contact phone | International format | `+506-2661-1084` |

## 📝 How to Use

### Step 1: Edit the CSV

Open `sites-content.csv` in:
- **Excel**: Best for visual editing
- **Google Sheets**: Import the CSV, edit, then download as CSV
- **VS Code**: Direct text editing (be careful with commas!)

### Step 2: Update Sites via AI

Simply tell Antigravity/Claude/Gemini:

```
"I updated sites-content.csv, please sync all sites"
```

The AI will:
1. Read the CSV
2. Update each site's configuration files
3. Validate all URLs and data
4. Show you a summary of changes

### Step 3: Review & Deploy

```bash
# Preview locally
pnpm dev --filter @firecow/isla-tortuga-costa-rica

# Deploy when happy
git add .
git commit -m "Updated site content from CSV"
git push
```

## 💡 Tips & Tricks

### Multi-line Text in CSV

For activities and schedules, use the pipe `|` character to separate items:

```csv
"Snorkeling in crystal waters | Beach BBQ lunch | Kayaking adventure"
```

### Image URLs

**Free Image Sources:**
- **Unsplash**: `https://images.unsplash.com/photo-[ID]`
- **Pexels**: `https://images.pexels.com/photos/[ID]`
- **PravatarCC** (for reviewer avatars): `https://i.pravatar.cc/150?img=[1-70]`

**Your Own Images:**
Upload to Cloudflare Images or use existing CDN URLs

### Emojis

Add visual flair to your sites! Great emoji options:
- 🏝️ Islands
- ⛵ Sailing
- 🎣 Fishing
- 🌅 Sunsets
- 🛥️ Luxury boats
- 🤿 Diving/snorkeling
- 🌴 Tropical
- 🐠 Marine life

### Adding New Sites

1. Add a new row to the CSV
2. Set `site_id` to a unique kebab-case name
3. Fill in all required fields
4. Tell AI: "Create a new site from the latest CSV row"

## 🔄 Workflow Examples

### Bulk Update All Sites

```
You: "All tours now start 30 minutes earlier, update the CSV and sync"
AI: Updates schedules, syncs all sites
```

### Change Single Site

```
You: "Update isla-tortuga hero image to [URL]"
AI: Updates CSV and syncs just that site
```

### Add New Gallery Images

```
You: "Replace gallery images for fishing-jaco with these 6 URLs: [URLs]"
AI: Updates CSV, syncs changes
```

## 🚀 Advanced: Auto-Sync Script

Want automatic syncing? Future enhancement could include:

```bash
# Watch for CSV changes and auto-update sites
npm run csv-sync-watch
```

## 📦 Files Generated from CSV

The AI will update these files for each site:

```
apps/[site-id]/
  src/
    config.ts           # Main site configuration
    content/
      activities.json   # Daily activities
      schedule.json     # Tour timeline
      reviews.json      # Customer testimonials
      gallery.json      # Image gallery
```

## ❓ Common Issues

### Commas in Text

If your text has commas, wrap the entire cell in quotes:

```csv
"Enjoy drinks, snacks, and appetizers"
```

### Special Characters

Avoid these in CSV text (or escape properly):
- Quotation marks `"` → Use `""` (double quotes)
- Newlines → Use `|` separator instead
- Commas in values → Wrap in quotes

### File Not Syncing

Make sure:
1. CSV is saved properly
2. No blank required fields
3. URLs are valid
4. `site_id` matches folder in `apps/`

---

## 🎯 Next Steps

1. ✅ CSV created with 5 sample sites
2. ⏳ Edit CSV with your real content
3. ⏳ Tell AI to sync changes
4. ⏳ Review updated sites locally
5. ⏳ Deploy to production

**Ready to update?** Just say: *"Let's sync the CSV to all sites"*
