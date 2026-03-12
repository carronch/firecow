#!/bin/bash
# Update all existing sites with the latest template changes

echo "🔄 Updating all sites with latest template..."
echo ""

# List of sites to update
sites=(
  "catamaran-sunset"
  "catamaran-tour-isla-tortuga"
  "costa-cat-test"
  "fishing-jaco-costa-rica"
  "isla-tortuga-costa-rica"
  "los-suenos-test"
  "maverick-sport-fishing"
  "test-catamaran-site"
)

template_dir="apps/template"
updated_count=0
failed_count=0

for site in "${sites[@]}"; do
  echo "📦 Updating: $site"
  site_dir="apps/$site"
  
  if [ ! -d "$site_dir" ]; then
    echo "   ⚠️  Site directory not found, skipping..."
    ((failed_count++))
    continue
  fi
  
  # 1. Copy Location component
  echo "   📄 Copying Location.astro..."
  cp "$template_dir/src/components/Location.astro" "$site_dir/src/components/Location.astro"
  
  # 2. Update index.astro to include Location component
  echo "   📝 Updating index.astro..."
  
  # Add import if not exists
  if ! grep -q "import Location from" "$site_dir/src/pages/index.astro"; then
    # Add import after Testimonials import
    sed -i '' '/import Testimonials/a\
import Location from '\''../components/Location.astro'\'';
' "$site_dir/src/pages/index.astro"
  fi
  
  # Add component in main section if not exists
  if ! grep -q "<Location />" "$site_dir/src/pages/index.astro"; then
    # Add Location after Testimonials
    sed -i '' '/<Testimonials \/>/a\
    <Location />
' "$site_dir/src/pages/index.astro"
  fi
  
  # 3. Update keystatic.config.ts with location fields
  echo "   ⚙️  Updating keystatic.config.ts..."
  
  if ! grep -q "locationName:" "$site_dir/keystatic.config.ts"; then
    # Add location fields before the closing brace of homepage schema
    sed -i '' '/galleryImages: fields.array/,/)$/s/)$/),\
                locationName: fields.text({ label: '\''Location Name (e.g. "Los Sueños Marina")'\'' }),\
                locationAddress: fields.text({ label: '\''Full Address'\'', multiline: true }),\
                googleMapsUrl: fields.url({ label: '\''Google Maps Embed URL (iframe src)'\'' }),\
                googleMapsLink: fields.url({ label: '\''Google Maps Link (for "Open in Maps")'\'' })/' "$site_dir/keystatic.config.ts"
  fi
  
  # 4. Update content/config.ts with location schema
  echo "   🔧 Updating content/config.ts..."
  
  if [ -f "$site_dir/src/content/config.ts" ]; then
    if ! grep -q "locationName:" "$site_dir/src/content/config.ts"; then
      # Add location fields to homepage schema
      sed -i '' '/galleryImages: z.array/a\
        locationName: z.string().optional(),\
        locationAddress: z.string().optional(),\
        googleMapsUrl: z.string().optional(),\
        googleMapsLink: z.string().optional(),
' "$site_dir/src/content/config.ts"
    fi
  fi
  
  # 5. Update settings.yaml with default location
  echo "   📍 Updating settings.yaml..."
  
  if [ -f "$site_dir/src/content/homepage/settings.yaml" ]; then
    if ! grep -q "locationName:" "$site_dir/src/content/homepage/settings.yaml"; then
      # Append location fields
      cat >> "$site_dir/src/content/homepage/settings.yaml" << EOF
locationName: "Costa Rica"
locationAddress: "Beautiful Costa Rica - Paradise Awaits"
googleMapsUrl: "https://maps.google.com/maps?q=Costa+Rica&t=&z=10&ie=UTF8&iwloc=&output=embed"
googleMapsLink: "https://goo.gl/maps/CostaRica"
EOF
    fi
  fi
  
  echo "   ✅ Updated successfully!"
  echo ""
  ((updated_count++))
done

echo "======================================"
echo "✅ Update Complete!"
echo "======================================"
echo "Updated: $updated_count sites"
echo "Failed: $failed_count sites"
echo ""
echo "🚀 Next steps:"
echo "1. Test a site locally: pnpm --filter @firecow/<site-name> dev"
echo "2. Build and deploy: pnpm --filter @firecow/<site-name> build"
echo "3. Or use deploy-site script to redeploy"
