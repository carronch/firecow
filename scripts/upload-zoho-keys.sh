#!/bin/bash
# Bulk upload Zoho credentials to all Cloudflare Pages sites
# Run this when you're ready to enable Zoho on all live sites

echo "🔑 Uploading Zoho credentials to all sites..."

SITES=(
  "catamaran-sunset"
  "catamaran-tour-isla-tortuga"
  "costa-cat-test"
  "fishing-jaco-costa-rica"
  "isla-tortuga-2-costa-rica"
  "isla-tortuga-3-costa-rica"
  "isla-tortuga-4-costa-rica"
  "isla-tortuga-costa-rica"
  "los-suenos-test"
  "private-charter-isla-tortuga"
  "test-catamaran-site"
  "test-sport-fishing"
)

CLIENT_ID="1000.UYJEDCW00IM1JIV12GDA44KMVXTCYP"
CLIENT_SECRET="161179db33053409212b1fec219de25a3eb5315e57"
REFRESH_TOKEN="1000.011d85afbdf572f06ae7d83b409b9485.014fd0d01b5d1cd3223b3b4a24d2df35"
PORTAL_NAME="firecowbookings"

for SITE in "${SITES[@]}"; do
    echo "📤 Uploading to $SITE..."
    
    echo "$CLIENT_ID" | npx wrangler pages secret put ZOHO_CLIENT_ID --project-name "$SITE" 2>&1 | grep -q "Success" && echo "  ✅ CLIENT_ID" || echo "  ⚠️  CLIENT_ID failed"
    echo "$CLIENT_SECRET" | npx wrangler pages secret put ZOHO_CLIENT_SECRET --project-name "$SITE" 2>&1 | grep -q "Success" && echo "  ✅ CLIENT_SECRET" || echo "  ⚠️  CLIENT_SECRET failed"
    echo "$REFRESH_TOKEN" | npx wrangler pages secret put ZOHO_REFRESH_TOKEN --project-name "$SITE" 2>&1 | grep -q "Success" && echo "  ✅ REFRESH_TOKEN" || echo "  ⚠️  REFRESH_TOKEN failed"
    echo "$PORTAL_NAME" | npx wrangler pages secret put ZOHO_PORTAL_NAME --project-name "$SITE" 2>&1 | grep -q "Success" && echo "  ✅ PORTAL_NAME" || echo "  ⚠️  PORTAL_NAME failed"
    
    echo ""
done

echo "🎉 Complete! All sites should now have Zoho credentials."
echo "💡 Tip: Redeploy your sites for the changes to take effect."
