# 🚀 PageSpeed Optimization Guide

## Current Scores vs Target

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Performance | 76 | 90-100 | ⚠️ Needs Work |
| Accessibility | 78 | 90-100 | ⚠️ Needs Work |
| Best Practices | 100 | 90-100 | ✅ Perfect |
| SEO | 100 | 90-100 | ✅ Perfect |

## Performance Optimizations

### 1. Image Optimization (Biggest Impact)

**Current Issues:**
- First Contentful Paint: 3.3s
- Largest Contentful Paint: 4.7s
- Images likely not optimized or lazy-loaded properly

**Solutions:**

#### A. Use Astro's Image Component
Replace all `<img>` tags with Astro's optimized `<Image>` component.

```astro
---
import { Image } from 'astro:assets';
---

<!-- Before -->
<img src={heroImage} alt="Hero" />

<!-- After -->
<Image 
  src={heroImage} 
  alt="Hero image description"
  width={1920}
  height={1080}
  loading="eager"
  format="webp"
  quality={80}
/>
```

#### B. Lazy Load Below-the-Fold Images
```astro
<!-- Hero image: eager -->
<Image src={heroImage} loading="eager" />

<!-- Gallery images: lazy -->
<Image src={galleryImage} loading="lazy" />
```

#### C. Add Image Dimensions
Always specify width and height to prevent layout shifts.

### 2. Font Optimization

**Use font-display: swap**

```css
/* global.css */
@font-face {
  font-family: 'Inter';
  font-display: swap; /* Show fallback font immediately */
  src: url('...') format('woff2');
}
```

**Preload critical fonts:**
```html
<!-- BaseLayout.astro -->
<link 
  rel="preload" 
  href="/fonts/inter-var.woff2" 
  as="font" 
  type="font/woff2" 
  crossorigin
/>
```

### 3. Reduce Render-Blocking Resources

**A. Inline Critical CSS**
Move above-the-fold CSS inline to prevent blocking.

**B. Defer Non-Critical JavaScript**
```html
<script defer src="/scripts/analytics.js"></script>
```

### 4. Optimize Third-Party Scripts

**Google Maps - Use Facade Pattern:**
```astro
<!-- Show static map image initially -->
<div id="map-placeholder" onclick="loadMap()">
  <img src="/images/map-static.jpg" alt="Map" />
  <button>Load Interactive Map</button>
</div>

<script>
function loadMap() {
  // Load Google Maps iframe only when clicked
  const placeholder = document.getElementById('map-placeholder');
  placeholder.innerHTML = '<iframe src="..."></iframe>';
}
</script>
```

### 5. Enable Compression

**In CloudFlare Pages:**
- Auto Minify: HTML, CSS, JS
- Brotli compression (enabled by default)

## Accessibility Optimizations

### 1. Image Alt Text

**Add descriptive alt text to ALL images:**

```astro
<!-- Bad -->
<img src="fish.jpg" />
<img src="boat.jpg" alt="image" />

<!-- Good -->
<img src="fish.jpg" alt="Fisherman holding large Mahi-Mahi catch" />
<img src="boat.jpg" alt="Maverick Sport Fishing charter boat at Los Sueños Marina" />
```

### 2. Color Contrast

**Ensure 4.5:1 contrast ratio for text:**

```css
/* Bad: Low contrast */
.text {
  color: #888;  /* Gray on white background */
}

/* Good: High contrast */
.text {
  color: #333;  /* Dark gray on white: 12.6:1 */
}

/* For large text (18px+): 3:1 minimum */
.heading {
  color: #555;  /* Medium gray: 7:1 */
}
```

**Check contrast:**
- Use browser DevTools Contrast Checker
- Or https://webaim.org/resources/contrastchecker/

### 3. ARIA Labels

**Add labels to interactive elements:**

```astro
<!-- Navigation -->
<nav aria-label="Main navigation">
  <ul>...</ul>
</nav>

<!-- Buttons without text -->
<button aria-label="Open menu">
  <i class="fa-bars"></i>
</button>

<!-- Links -->
<a href="/tour" aria-label="Book fishing tour">
  Learn More
</a>
```

### 4. Form Labels

**Every input needs a label:**

```html
<!-- Bad -->
<input type="email" placeholder="Email" />

<!-- Good -->
<label for="email">Email Address</label>
<input type="email" id="email" name="email" />

<!-- Or using aria-label -->
<input 
  type="email" 
  aria-label="Email address"
  placeholder="your@email.com"
/>
```

### 5. Heading Hierarchy

**Use proper heading order (h1 > h2 > h3):**

```html
<!-- Bad: Skips levels -->
<h1>Main Title</h1>
<h3>Subsection</h3>

<!-- Good: Proper hierarchy -->
<h1>Main Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
```

### 6. Keyboard Navigation

**Ensure all interactive elements are keyboard accessible:**

```astro
<!-- Add tabindex if needed -->
<div 
  role="button" 
  tabindex="0"
  onkeypress="handleEnter(event)"
>
  Click me
</div>
```

## Quick Wins Checklist

### Performance Quick Wins
- [ ] Convert images to WebP format
- [ ] Add `loading="lazy"` to below-fold images
- [ ] Add `width` and `height` to all images
- [ ] Preload hero image
- [ ] Use `font-display: swap`
- [ ] Defer Google Maps loading
- [ ] Enable CloudFlare auto-minification

### Accessibility Quick Wins
- [ ] Add alt text to all images
- [ ] Fix color contrast (text should be #333 or darker on white)
- [ ] Add aria-labels to icon buttons
- [ ] Add aria-label to navigation
- [ ] Ensure proper heading hierarchy (h1 → h2 → h3)
- [ ] Add labels to form inputs
- [ ] Test keyboard navigation (Tab through site)

## Implementation Priority

### High Priority (Do First)
1. ✅ **Image optimization** - Biggest performance impact
2. ✅ **Alt text** - Easy accessibility win
3. ✅ **Color contrast** - Quick fix
4. ✅ **ARIA labels** - 30 minutes work

### Medium Priority
5. Font optimization
6. Lazy load Google Maps
7. Form labels
8. Heading hierarchy

### Low Priority (Nice to Have)
9. Preconnect to third-party domains
10. Service worker for caching
11. Critical CSS inlining

## Testing

### Local Testing
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run PageSpeed test locally
lighthouse http://localhost:4328 --view
```

### Online Testing
1. **PageSpeed Insights**: https://pagespeed.web.dev/
2. **WebPageTest**: https://www.webpagetest.org/
3. **GTmetrix**: https://gtmetrix.com/

### Check Specific Issues
- **Images**: https://squoosh.app/ (optimize images)
- **Contrast**: https://webaim.org/resources/contrastchecker/
- **Accessibility**: https://wave.webaim.org/

## Expected Results

After implementing all optimizations:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Performance | 76 | 95+ | +19 points |
| Accessibility | 78 | 100 | +22 points |
| Best Practices | 100 | 100 | ✅ |
| SEO | 100 | 100 | ✅ |

**FCP**: 3.3s → < 1.5s
**LCP**: 4.7s → < 2.0s

## Monitoring

Set up continuous monitoring:
1. **Lighthouse CI** in GitHub Actions
2. **CloudFlare Web Analytics**
3. **PageSpeed Insights API** (weekly checks)

---

**Next Steps**: Let me create the actual code changes to implement these optimizations!
