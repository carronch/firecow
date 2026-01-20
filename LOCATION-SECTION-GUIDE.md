# 📍 Location Section - Implementation Guide

## Overview

A beautiful, interactive Location section has been added to the template, positioned between the Testimonials and Contact sections. This section displays your physical location with an embedded Google Maps view and easy-to-use navigation features.

## Features

### 🗺️ Embedded Google Maps
- **Live iframe** showing your exact location
- **Interactive map** - users can zoom, pan, and explore
- **"Open in Maps" button** overlaid on the map for quick access

### 📍 Location Cards
Three beautifully designed information cards:

1. **Location Card** - Shows your business name and full address
2. **Get Directions Card** - Gradient card with "Start Navigation" CTA
3. **Easy to Find Card** - Reassuring message for customers

### 🎨 Design Features
- Gradient background with decorative blur effects
- Responsive grid layout (3 columns on desktop, stacks on mobile)
- Smooth hover animations on all cards
- Consistent with existing design system

## Configuration

### Via Keystatic CMS (Recommended)

1. Navigate to `/keystatic` on your site
2. Go to **Homepage & Site Settings**
3. Scroll to the **Location** section
4. Fill in the fields:

   - **Location Name**: Your business name (e.g., "Los Sueños Marina")
   - **Full Address**: Complete address with city, state, ZIP
   - **Google Maps Embed URL**: The iframe `src` URL
   - **Google Maps Link**: Short link for "Open in Maps" button

### How to Get Google Maps URLs

#### Method 1: Google Maps Embed (Recommended)

1. Go to [Google Maps](https://www.google.com/maps)
2. Search for your location
3. Click **Share** → **Embed a map**
4. Copy the `iframe` code
5. Extract the `src` URL from the code
6. Paste into **Google Maps Embed URL** field

**Example:**
```
https://maps.google.com/maps?q=Los+Sueños+Marina,+Costa+Rica&t=&z=15&ie=UTF8&iwloc=&output=embed
```

#### Method 2: Short Link for Buttons

1. On Google Maps, click **Share** → **Copy link**
2. Use the short URL (e.g., `https://goo.gl/maps/xxxxx`)
3. Paste into **Google Maps Link** field

### Manual Configuration (settings.yaml)

Edit `src/content/homepage/settings.yaml`:

```yaml
locationName: "Los Sueños Marina"
locationAddress: "Los Sueños Resort, Herradura, Puntarenas, Costa Rica"
googleMapsUrl: "https://maps.google.com/maps?q=Los+Sueños+Marina&output=embed"
googleMapsLink: "https://goo.gl/maps/ABC123"
```

## Customization

### Change Map Zoom Level

In your `googleMapsUrl`, adjust the `z` parameter:
- `z=10` - Wide view (city level)
- `z=15` - Medium view (neighborhood)
- `z=18` - Close view (street level)

**Example:**
```
https://maps.google.com/maps?q=Your+Location&z=15&output=embed
```

### Change Map Type

Add `&t=` parameter to your URL:
- `&t=m` - Standard map (default)
- `&t=k` - Satellite view
- `&t=h` - Hybrid (satellite + labels)

### Styling Customization

Edit `apps/template/src/components/Location.astro`:

**Change gradient colors:**
```astro
<section class="bg-gradient-to-b from-blue-50 to-purple-50">
```

**Change card colors:**
```astro
<div class="bg-gradient-to-br from-green-500 to-teal-600">
```

**Adjust map height:**
```astro
<div style="height: 600px;">
```

## Component Structure

```
Location.astro
├── Section Header ("Find Us")
├── Map Container (2/3 width desktop)
│   ├── Google Maps iframe
│   └── "Open in Maps" button overlay
└── Info Cards (1/3 width desktop)
    ├── Location Card
    ├── Get Directions Card (with CTA)
    └── Easy to Find Card
```

## Responsive Behavior

- **Desktop (lg+)**: 3-column grid (map takes 2 columns)
- **Tablet (md)**: Still 3 columns but smaller
- **Mobile**: Stacks vertically

## SEO Benefits

The Location section improves SEO by:
- ✅ Providing structured address information
- ✅ Embedding Google Maps (rich content)
- ✅ Including location-based keywords
- ✅ Improving user engagement time

## Accessibility

- ✅ Proper heading hierarchy (`<h2>`, `<h3>`)
- ✅ Descriptive link text ("Start Navigation", "Open in Maps")
- ✅ Icon + text for all buttons
- ✅ High contrast text
- ✅ Keyboard accessible (all interactive elements)

## Examples by Tour Type

### Fishing Charter
```yaml
locationName: "Maverick Sport Fishing"
locationAddress: "Los Sueños Marina, Herradura, Costa Rica"
googleMapsUrl: "https://maps.google.com/maps?q=Los+Sueños+Marina&z=16&output=embed"
```

### Catamaran Tour
```yaml
locationName: "Tortuga Island Departures"
locationAddress: "Playa Herradura Beach, Puntarenas, Costa Rica"
googleMapsUrl: "https://maps.google.com/maps?q=Playa+Herradura&z=15&output=embed"
```

### Diving Center
```yaml
locationName: "Pacific Dive Center"
locationAddress: "Main Street, Tamarindo, Guanacaste, Costa Rica"
googleMapsUrl: "https://maps.google.com/maps?q=Tamarindo&z=14&output=embed"
```

## Troubleshooting

### Map Not Showing

**Problem:** Blank white box instead of map

**Solutions:**
1. Check that `googleMapsUrl` ends with `&output=embed`
2. Verify the URL doesn't have extra spaces
3. Try using the full embed URL from Google Maps

### Wrong Location

**Problem:** Map shows incorrect location

**Solutions:**
1. Search exact business name + city on Google Maps
2. Use the "Share" feature, not the browser URL bar
3. Try using coordinates: `?q=9.611253,-84.774363`

### Buttons Not Working

**Problem:** "Open in Maps" doesn't work

**Solutions:**
1. Check `googleMapsLink` is a valid Google Maps URL
2. Make sure it starts with `https://`
3. Test the link in a new browser tab

## Integration with Other Features

### Combine with Contact Section
The Location section works great with the Contact section below it:
- Location shows WHERE
- Contact shows HOW (phone, email, WhatsApp)

### Link from Footer
Add a link in your footer:
```html
<a href="#location">Find Us</a>
```

### Hero CTA
Update hero button to scroll to location:
```html
<a href="#location">See Location</a>
```

## Performance

- **Map loads on scroll** (lazy loading)
- **Lightweight component** (~3KB)
- **No external dependencies** (other than Google Maps iframe)
- **Fast rendering** (static HTML)

## Future Enhancements

Possible additions:
- [ ] Opening hours display
- [ ] Parking information
- [ ] Public transportation directions
- [ ] Multiple locations support
- [ ] Distance calculator from user
- [ ] 360° street view integration

---

**Questions?** The Location section is fully integrated and ready to use!
