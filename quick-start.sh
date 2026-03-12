#!/bin/bash

# FireCow Bookings Quick Start

echo "🔥 FireCow Bookings Setup"
echo "-------------------------"

# 1. Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# 2. Build packages
echo "🏗️ Building packages..."
pnpm build

# 3. Setup environment variables
if [ ! -f apps/template/.env ]; then
    echo "📝 Creating .env file for template..."
    cp apps/template/.env.example apps/template/.env 2>/dev/null || echo "Warning: .env.example not found, skipping"
fi

echo "✅ Setup complete!"
echo ""
echo "To start the template:"
echo "  pnpm --filter template dev"
echo ""
echo "To start the catamaran site:"
echo "  pnpm --filter catamaran-sunset dev"
