# PageSpeed Optimization Checklist

## Performance (Target: 90+)

### Images
- [ ] All images have width and height attributes
- [ ] Hero image uses `loading="eager"` and `fetchpriority="high"`
- [ ] Below-fold images use `loading="lazy"`
- [ ] Images are in WebP format where possible
- [ ] Images are properly compressed (< 200KB for photos)

### Fonts
- [ ] Google Fonts use `&display=swap`
- [ ] FontAwesome loads asynchronously
- [ ] Critical fonts are preloaded

### Scripts
- [ ] Third-party scripts load asynchronously
- [ ] Google Maps uses facade pattern (load on click)
- [ ] No render-blocking JavaScript

### CSS
- [ ] Critical CSS is inlined (if needed)
- [ ] Non critical CSS loads asynchronously
- [ ] TailwindCSS purged for production

## Accessibility (Target: 90+)

### Images
- [ ] All images have descriptive alt text
- [ ] Decorative images have alt=""
- [ ] No generic alt text like "image" or "photo"

### Color Contrast
- [ ] Text on light backgrounds: #333 or darker (12.6:1 ratio)
- [ ] Text on dark backgrounds: #fff or light (21:1 ratio)
- [ ] Large text (18px+): 3:1 minimum
- [ ] Normal text: 4.5:1 minimum

### ARIA Labels
- [ ] Main navigation has aria-label
- [ ] Icon buttons have aria-label
- [ ] All interactive elements are labeled
- [ ] Forms have proper labels

### Headings
- [ ] One h1 per page
- [ ] Heading hierarchy is correct (h1 > h2 > h3)
- [ ] No skipped levels

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Tabindex is used correctly
- [ ] Skip to main content link exists

### Forms
- [ ] All inputs have labels
- [ ] Error messages are descriptive
- [ ] Required fields are indicated

## Best Practices (Target: 100)

- [x] HTTPS enabled
- [x] No console errors
- [x] Images use correct aspect ratios
- [x] No deprecated APIs
- [x] Proper meta tags

## SEO (Target: 100)

- [x] Meta description present
- [x] Title tag present and descriptive
- [x] Proper heading structure
- [x] Alt text on images
- [x] Valid HTML
- [x] Mobile-friendly

## Next Steps

1. Run PageSpeed Insights: https://pagespeed.web.dev/
2. Check specific issues in the report
3. Fix remaining issues
4. Re-test until scores are 90+

