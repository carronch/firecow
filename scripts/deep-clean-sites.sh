#!/bin/bash
# Deep Clean: Propagate ALL optimized components

echo "🧼 Starting Deep Clean PageSpeed Optimization..."

# List of sites
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

for site in "${sites[@]}"; do
  echo "📦 Updating: $site"
  site_dir="apps/$site"
  
  if [ ! -d "$site_dir" ]; then continue; fi
  
  # Copy layout
  cp "$template_dir/src/layouts/BaseLayout.astro" "$site_dir/src/layouts/BaseLayout.astro"
  
  # Copy utils
  mkdir -p "$site_dir/src/utils"
  cp "$template_dir/src/utils/accessibility.ts" "$site_dir/src/utils/accessibility.ts"
  
  # Copy common components
  mkdir -p "$site_dir/src/components/common"
  cp "$template_dir/src/components/common/OptimizedImage.astro" "$site_dir/src/components/common/OptimizedImage.astro"
  
  # Copy updated functional components (The Deep Clean)
  cp "$template_dir/src/components/HeroSection.astro" "$site_dir/src/components/HeroSection.astro"
  cp "$template_dir/src/components/ExperiencesGrid.astro" "$site_dir/src/components/ExperiencesGrid.astro"
  cp "$template_dir/src/components/TrustBanner.astro" "$site_dir/src/components/TrustBanner.astro"
  cp "$template_dir/src/components/Testimonials.astro" "$site_dir/src/components/Testimonials.astro"
  cp "$template_dir/src/components/Gallery.astro" "$site_dir/src/components/Gallery.astro"
  
  echo "   ✨ Components synced"
done

echo "✅ Deep Clean Complete!"
