@echo off
REM Manufacturing Operations Suite - Windows Deployment Script

echo 🏭 Manufacturing Operations Suite - Deployment Starting...
echo ==================================================

REM Check if wrangler is installed
where wrangler >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Wrangler CLI...
    npm install -g wrangler
)

REM Login to Cloudflare
echo 🔐 Logging into Cloudflare...
wrangler login

REM Create D1 Database  
echo 🗄️ Creating D1 Database...
wrangler d1 create manufacturing-production

echo.
echo 📝 IMPORTANT: Copy the database_id from above and update wrangler.toml
echo    Replace 'manufacturing-db-id-placeholder' with the actual database_id
echo.
pause

REM Apply database schema
echo 📊 Applying database schema...
wrangler d1 execute manufacturing-production --file=migrations/schema.sql

if %errorlevel% equ 0 (
    echo ✅ Database schema applied successfully!
) else (
    echo ❌ Failed to apply database schema. Check your database ID in wrangler.toml
    pause
    exit /b 1
)

REM Load seed data
echo 🌱 Loading test data...
wrangler d1 execute manufacturing-production --file=migrations/seed.sql

if %errorlevel% equ 0 (
    echo ✅ Test data loaded successfully!
) else (
    echo ❌ Failed to load test data
    pause
    exit /b 1
)

REM Deploy to Cloudflare Pages
echo 🚀 Deploying to Cloudflare Pages...
wrangler pages deploy

if %errorlevel% equ 0 (
    echo.
    echo 🎉 DEPLOYMENT SUCCESSFUL!
    echo ==================================================
    echo Your Manufacturing Operations Suite is now live!
    echo.
    echo Demo Credentials:
    echo Admin: admin@luxebeauty.com / password123
    echo Production: production@luxebeauty.com / password123  
    echo Quality: quality@luxebeauty.com / password123
    echo.
    echo Features Available:
    echo ✅ Electronic Batch Records (EBR)
    echo ✅ FEFO Inventory Management
    echo ✅ Production Planning (4-Line System)  
    echo ✅ Supplier Integration Dashboard
    echo.
) else (
    echo ❌ Deployment failed. Check the error messages above.
    pause
    exit /b 1
)

pause