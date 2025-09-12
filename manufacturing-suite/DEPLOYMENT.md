# 🚀 Manufacturing Suite - Deployment Guide

This guide provides step-by-step instructions to deploy the Manufacturing Operations Suite to Cloudflare Pages.

## 📋 Prerequisites

Before starting deployment, ensure you have:

- ✅ **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com) 
- ✅ **Node.js 18+**: Download from [nodejs.org](https://nodejs.org)
- ✅ **Git**: For version control
- ✅ **Wrangler CLI**: Install with `npm install -g wrangler`

## 🔧 Step 1: Environment Setup

### Install Wrangler CLI
```bash
npm install -g wrangler
```

### Login to Cloudflare
```bash
wrangler login
```
This opens a browser window for authentication.

## 🗄️ Step 2: Database Creation

### Create D1 Database
```bash
# Create the production database
wrangler d1 create manufacturing-production

# Note the database_id from the output - you'll need this next
```

### Update Configuration
Edit `wrangler.toml` and replace the database_id:
```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "manufacturing-production"
database_id = "YOUR_ACTUAL_DATABASE_ID_HERE"
```

## 📊 Step 3: Database Schema & Data

### Apply Database Schema
```bash
# Create all tables
wrangler d1 execute manufacturing-production --file=migrations/schema.sql
```

### Load Seed Data
```bash
# Load test data
wrangler d1 execute manufacturing-production --file=migrations/seed.sql
```

### Verify Database Setup
```bash
# Test database connection
wrangler d1 execute manufacturing-production --command="SELECT COUNT(*) as user_count FROM users"
```

## 🏗️ Step 4: Project Dependencies

### Install Node Modules
```bash
npm install
```

### Verify TypeScript Compilation
```bash
npm run build
```

## 🚀 Step 5: Deployment

### Deploy to Cloudflare Pages
```bash
# Deploy the application
wrangler pages deploy

# Note: Follow prompts to create new project if this is first deployment
```

### Alternative: Deploy with Project Name
```bash
wrangler pages deploy --project-name=manufacturing-suite
```

## ✅ Step 6: Verification

### Test Deployment
1. **Visit the deployed URL** (provided in deployment output)
2. **Test login page loads**
3. **Login with demo credentials**:
   - Email: `admin@luxebeauty.com`
   - Password: `password123`
4. **Navigate through all modules**:
   - Electronic Batch Records
   - FEFO Inventory Management  
   - Production Planning
   - Supplier Integration

### Verify API Health
Visit: `https://your-deployment-url.pages.dev/api/health`

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2024-03-16T..."
  }
}
```

## 🔧 Step 7: Domain Configuration (Optional)

### Add Custom Domain
```bash
# Add custom domain to your Pages project
wrangler pages domain add manufacturing.yourcompany.com --project-name=manufacturing-suite
```

### Configure DNS
In your domain provider, add a CNAME record:
- **Name**: `manufacturing`  
- **Target**: `your-deployment-url.pages.dev`

## 🛡️ Step 8: Security Configuration

### Environment Variables (Production)
```bash
# Set production environment variables
wrangler pages secret put JWT_SECRET --project-name=manufacturing-suite
# Enter a strong random secret when prompted
```

### Update Authentication
For production, update the JWT secret in `functions/index.ts`:
```typescript
const JWT_SECRET = c.env.JWT_SECRET || 'fallback-secret-for-dev';
```

## 📈 Step 9: Monitoring Setup

### Enable Analytics
1. Go to Cloudflare Dashboard
2. Navigate to your Pages project
3. Enable **Web Analytics**
4. Configure **Real User Monitoring**

### Set Up Alerts
Configure alerts for:
- High error rates
- Database connection failures  
- Memory usage spikes
- Request latency issues

## 🔄 Step 10: Continuous Deployment

### GitHub Integration
1. **Push code to GitHub repository**
2. **Connect repository to Cloudflare Pages**
3. **Configure build settings**:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variables: `NODE_VERSION=18`

### Automatic Deployments
Every push to `main` branch will trigger automatic deployment.

## 🧪 Testing Checklist

### ✅ Functional Tests
- [ ] Login/logout works
- [ ] All 4 modules load without errors
- [ ] API endpoints return data
- [ ] Charts and visualizations render
- [ ] Mobile responsiveness works
- [ ] Authentication persists across sessions

### ✅ Performance Tests  
- [ ] Page load time < 3 seconds
- [ ] API response time < 1 second
- [ ] No console errors
- [ ] Lighthouse score > 90

### ✅ Security Tests
- [ ] HTTPS enforced
- [ ] Secure cookies set
- [ ] No sensitive data in client
- [ ] Authentication required for protected routes

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check database exists
wrangler d1 list

# Verify database ID in wrangler.toml
# Re-apply schema if needed
wrangler d1 execute manufacturing-production --file=migrations/schema.sql
```

#### 404 Errors on Routes
- Check `_routes.json` configuration
- Ensure functions are in correct directories
- Verify route handlers export default

#### Build Failures
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
npx tsc --noEmit
```

#### Authentication Issues
- Clear browser cookies
- Check JWT secret configuration
- Verify user exists in database

### Performance Issues

#### Slow API Responses
```bash
# Check database query performance
wrangler d1 execute manufacturing-production --command="EXPLAIN QUERY PLAN SELECT * FROM batch_records"

# Add indexes if needed
wrangler d1 execute manufacturing-production --command="CREATE INDEX idx_batch_status ON batch_records(status)"
```

#### Memory Limits
- Reduce chart data points
- Implement pagination
- Optimize large queries

## 📊 Production Checklist

### Pre-Launch
- [ ] Database backup strategy implemented
- [ ] Environment variables configured
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Monitoring and alerts set up
- [ ] Performance testing completed
- [ ] Security scan passed
- [ ] User acceptance testing completed

### Post-Launch
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify user authentication flows
- [ ] Test backup and recovery procedures
- [ ] Update documentation
- [ ] Plan maintenance windows

## 🔒 Security Hardening

### Production Security
1. **Change default passwords** in seed data
2. **Implement password complexity rules**
3. **Enable audit logging**
4. **Set up intrusion detection**
5. **Configure CORS properly**
6. **Implement rate limiting**

### Compliance Considerations
- **Data Privacy**: Ensure GDPR/CCPA compliance
- **Industry Standards**: Meet cosmetics manufacturing regulations
- **Audit Trail**: Maintain complete transaction logs
- **Data Retention**: Implement retention policies

## 📞 Support Resources

### Cloudflare Documentation
- [Pages Documentation](https://developers.cloudflare.com/pages/)
- [D1 Database Guide](https://developers.cloudflare.com/d1/)
- [Workers Runtime API](https://developers.cloudflare.com/workers/)

### Debugging Tools
- **Cloudflare Dashboard**: Real-time metrics
- **Wrangler CLI**: Local development and debugging
- **Browser DevTools**: Client-side debugging
- **D1 Console**: Database query interface

---

## 🎉 Deployment Complete!

Your Manufacturing Operations Suite is now live and ready for production use. The system includes:

- ✅ **Electronic Batch Records** for digital manufacturing tracking
- ✅ **FEFO Inventory Management** for optimal material rotation  
- ✅ **Production Planning** with 4-line capacity management
- ✅ **Supplier Integration** with performance monitoring

**Next Steps**: Begin user training and start processing real manufacturing data!

**Deployment Time**: Approximately 30-45 minutes for first-time setup
**Maintenance**: Monthly updates recommended for optimal performance