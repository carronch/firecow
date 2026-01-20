#!/bin/bash
# Update all existing sites with PageSpeed optimizations

echo "🚀 Propagating PageSpeed optimizations to all sites..."
echo ""

# List of sites to update (same list as before)
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

for site in "${sites[@]}"; do
  echo "📦 Optimizing: $site"
  site_dir="apps/$site"
  
  if [ ! -d "$site_dir" ]; then
    echo "   ⚠️  Site directory not found, skipping..."
    continue
  fi
  
  # 1. Copy optimized components
  echo "   📄 Copying optimized components..."
  mkdir -p "$site_dir/src/components/common"
  cp "$template_dir/src/components/common/OptimizedImage.astro" "$site_dir/src/components/common/OptimizedImage.astro"
  cp "$template_dir/src/components/HeroSection.astro" "$site_dir/src/components/HeroSection.astro"
  
  # 2. Copy accessibility utils
  echo "   🛠️  Copying accessibility utilities..."
  mkdir -p "$site_dir/src/utils"
  cp "$template_dir/src/utils/accessibility.ts" "$site_dir/src/utils/accessibility.ts"
  
  # 3. Update BaseLayout (fonts & meta)
  echo "   ⚡ Updating BaseLayout..."
  cp "$template_dir/src/layouts/BaseLayout.astro" "$site_dir/src/layouts/BaseLayout.astro"
  
  # 4. Check for unoptimized images usage in index.astro (optional/advanced)
  # For now, we trust the component updates will handle the bulk of it
  
  echo "   ✅ Site optimized!"
  echo ""
  ((updated_count++))
done

echo "======================================"
echo "✅ All Sites Optimized!"
echo "======================================"
echo "Updated: $updated_count sites"
echo ""
echo "🚀 Next step: Rebuild and deploy your sites to see the score improvement!"
