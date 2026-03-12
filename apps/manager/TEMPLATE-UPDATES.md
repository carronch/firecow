# Template Updates - Keystatic Removal & Navigation Changes

**Date:** 2026-02-03

## Changes Made

### 1. ✅ Removed Keystatic CMS

#### Files Deleted:
- `/src/pages/keystatic/[...params].astro` - Keystatic admin route
- `/src/components/KeystaticApp.tsx` - Keystatic React component
- `keystatic.config.ts` - Keystatic configuration

#### Dependencies Removed from `package.json`:
- `@keystatic/astro`
- `@keystatic/core`
- `@astrojs/react` (only needed for Keystatic)
- `lucide-react` (only needed for Keystatic)
- `react`
- `react-dom`
- `@types/react`
- `@types/react-dom`

#### Configuration Updated in `astro.config.mjs`:
- Removed `keystatic` integration
- Removed `react` integration
- Removed corresponding imports

**Result:** The template is now fully static with Astro's native content collections. No CMS overhead.

---

### 2. ✅ Navigation Menu Updates

#### Changes to `Header.astro`:
1. **Removed "Home" button** from navigation menu
   - Users can click the site logo/name to return home (already clickable at line 22)

2. **Changed "Reviews" to "FAQ"**
   - Menu item now says "FAQ"
   - Links to `/why-us#faq` instead of `/#reviews`

#### Updated Navigation Links:
```javascript
const links = [
  { text: 'Tours', href: '/#experiences' },
  { text: 'Why Us', href: '/why-us' },
  { text: 'FAQ', href: '/why-us#faq' },      // ← Changed from "Reviews"
  { text: 'Contact', href: '/#contact' }
];
```

---

### 3. ✅ FAQ Section Updated

#### Changes to `FAQSection.astro`:
- Added `id="faq"` to the section element
- Allows direct linking from navigation menu
- Smooth scroll behavior when clicking "FAQ" in menu

---

## Impact on Existing Sites

These changes affect the **template** only. To propagate these changes to existing sites:

1. Copy updated files from template to each site:
   - `src/components/Header.astro`
   - `src/components/FAQSection.astro`
   - `package.json`
   - `astro.config.mjs`

2. Delete Keystatic files from each site:
   - `src/pages/keystatic/`
   - `src/components/KeystaticApp.tsx` (if exists)
   - `keystatic.config.ts`

3. Run `pnpm install` to update dependencies

---

## Next Steps

- Content is now managed through Astro's native content collections in `/src/content/`
- Edit content by directly modifying files in:
  - `/src/content/homepage/settings.json` - Homepage settings
  - `/src/content/tours/` - Tour pages (if using tours collection)
- No admin UI needed - all content is version-controlled with Git

---

## Benefits

✅ Faster build times (no React/Keystatic overhead)  
✅ Simpler deployment (no CMS auth requirements)  
✅ Cleaner navigation (no redundant "Home" button)  
✅ Better UX (FAQ linked directly to section)  
✅ Full version control of content with Git
