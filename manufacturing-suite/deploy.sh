#!/bin/bash

# Manufacturing Operations Suite - One-Click Deployment Script

echo "🏭 Manufacturing Operations Suite - Deployment Starting..."
echo "=================================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Installing Wrangler CLI..."
    npm install -g wrangler
fi

# Login to Cloudflare (will open browser)
echo "🔐 Logging into Cloudflare..."
wrangler login

# Create D1 Database
echo "🗄️ Creating D1 Database..."
DB_OUTPUT=$(wrangler d1 create manufacturing-production)
echo "$DB_OUTPUT"

# Extract database ID (you'll need to do this manually or parse the output)
echo ""
echo "📝 IMPORTANT: Copy the database_id from above and update wrangler.toml"
echo "   Replace 'manufacturing-db-id-placeholder' with the actual database_id"
echo ""
read -p "Press Enter after updating wrangler.toml with the database ID..."

# Apply database schema
echo "📊 Applying database schema..."
wrangler d1 execute manufacturing-production --file=migrations/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema applied successfully!"
else
    echo "❌ Failed to apply database schema. Check your database ID in wrangler.toml"
    exit 1
fi

# Load seed data
echo "🌱 Loading test data..."
wrangler d1 execute manufacturing-production --file=migrations/seed.sql

if [ $? -eq 0 ]; then
    echo "✅ Test data loaded successfully!"
else
    echo "❌ Failed to load test data"
    exit 1
fi

# Deploy to Cloudflare Pages
echo "🚀 Deploying to Cloudflare Pages..."
wrangler pages deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "=================================================="
    echo "Your Manufacturing Operations Suite is now live!"
    echo ""
    echo "Demo Credentials:"
    echo "Admin: admin@luxebeauty.com / password123"
    echo "Production: production@luxebeauty.com / password123"
    echo "Quality: quality@luxebeauty.com / password123"
    echo ""
    echo "Features Available:"
    echo "✅ Electronic Batch Records (EBR)"
    echo "✅ FEFO Inventory Management" 
    echo "✅ Production Planning (4-Line System)"
    echo "✅ Supplier Integration Dashboard"
    echo ""
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi