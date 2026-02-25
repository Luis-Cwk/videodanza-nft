# VideoDanza NFT - Vercel Deployment Guide

## Prerequisites

- GitHub account with repository
- Vercel account (free tier available)
- Environment variables from `.env.local`

---

## Step 1: Prepare Repository

### Ensure `.env.local` is NOT committed
The `.env.local` file contains sensitive data and should NEVER be in git:

```bash
# Check .gitignore includes .env.local
cat .gitignore | grep "\.env"
# Should show: .env.local
```

### Create `.env.example` (already done)
This shows what env vars are needed without exposing secrets.

### Make sure code is committed
```bash
cd /path/to/videodanza-nft
git add .
git commit -m "FASE 2: Frontend setup with Next.js 14"
git push origin main
```

---

## Step 2: Create Vercel Project

### Option A: Via Vercel Web UI (Recommended)

1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Connect GitHub and select `videodanza-nft` repo
4. Click "Import"
5. Configure:
   - **Project Name**: `videodanza-nft`
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: Leave blank (uses root)
   - **Build Command**: `cd frontend && npm run build` (or auto-detected)
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd videodanza-nft
vercel

# Follow prompts
```

---

## Step 3: Add Environment Variables

After creating project on Vercel:

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add each variable:

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID = YOUR_VALUE
NEXT_PUBLIC_API_URL = https://api.yourdomain.com/api
NEXT_PUBLIC_CONTRACT_ADDRESS = 0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf
NEXT_PUBLIC_CHAIN_ID = 11155111
NEXT_PUBLIC_IPFS_GATEWAY = https://gateway.pinata.cloud/ipfs
```

**Important**: 
- `NEXT_PUBLIC_*` variables are visible in browser (safe for public URLs/addresses)
- DO NOT put private keys or secret keys in Vercel env vars
- Mark each as available for: `Production`, `Preview`, `Development`

---

## Step 4: Configure Build Settings

In Vercel Project Settings:

### Build & Development Settings
- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/.next`
- **Install Command**: `npm install`

### Git
- **Production Branch**: `main`
- **Deploy on Push**: Enabled

### Optional: Node.js Version
- **Node.js Version**: 20.x (or latest LTS)

---

## Step 5: Deploy

### Automatic Deployment (Recommended)
Once environment variables are set:

```bash
git push origin main
```

Vercel automatically:
1. Detects changes
2. Installs dependencies
3. Builds Next.js app
4. Deploys to CDN
5. Provides deployment URL

### Manual Deployment
```bash
vercel --prod
```

---

## Step 6: Verify Deployment

After deployment completes:

1. Click the deployment URL from Vercel dashboard
2. You should see the VideoDanza homepage
3. Test functionality:
   - Home page loads ✓
   - Navigation works ✓
   - Click "Mint NFT" → Mint page loads ✓
   - Click "Gallery" → Gallery page loads ✓
   - "Connect Wallet" button visible ✓

### Test on Sepolia Testnet

1. Click "Connect Wallet" button
2. Select MetaMask (or other wallet)
3. Switch network to Sepolia in wallet
4. Confirm connection
5. Navigate to Mint page
6. Enter seed phrase
7. Select video
8. Click "Mint NFT"
9. Approve transaction in wallet

---

## Environment Variables Reference

| Variable | Value | Public? | Required? |
|----------|-------|---------|-----------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | From https://cloud.walletconnect.com | Yes | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | Yes | Yes |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | `0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf` | Yes | Yes |
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` (Sepolia) | Yes | Yes |
| `NEXT_PUBLIC_IPFS_GATEWAY` | `https://gateway.pinata.cloud/ipfs` | Yes | Yes |

---

## Continuous Deployment Workflow

```
Developer Workflow:
┌─────────────────────┐
│ Make local changes  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ npm run dev         │ (Test locally)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ npm run build       │ (Check build succeeds)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ git push            │ (Push to GitHub)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Vercel detects      │ (Auto build + deploy)
│ and deploys         │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Live at URL         │ (https://videodanza-nft.vercel.app)
└─────────────────────┘
```

---

## Troubleshooting

### Build Fails: "Module not found"

**Problem**: `Can't resolve 'viem'` or similar

**Solution**:
```bash
# In frontend directory
npm install

# Verify package.json has dependency
cat package.json | grep viem
```

### Build Succeeds but Page Won't Load

**Problem**: Blank page or 404

**Possible causes**:
1. Environment variables not set on Vercel
2. Wrong build command
3. Frontend not being served from correct path

**Solution**:
```bash
# Verify settings:
# 1. Vercel Project Settings → Build & Development
#    - Build Command: cd frontend && npm run build
#    - Output Directory: frontend/.next
```

### "No QueryClient set" Error

**Problem**: Pages fail to render with React Query error

**Solution**: Ensure providers are properly configured
```
app/providers.tsx should have QueryClientProvider wrapper
```

### Wallet Connection Issues

**Problem**: ConnectButton doesn't show or throws error

**Possible causes**:
1. NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID not set
2. Wrong chain configured

**Solution**:
```bash
# Get Project ID from https://cloud.walletconnect.com
# Add to Vercel environment variables
```

---

## Monitoring & Debugging

### View Deployment Logs
```bash
# Via Vercel CLI
vercel logs --prod
```

### Monitor Performance
- Vercel Dashboard → Analytics
- Lighthouse scores
- Core Web Vitals
- Bundle size

### Debug Front-end Issues
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for failed requests
4. Check wallet connection status

---

## Rollback & Redeployment

### Rollback to Previous Version
```bash
vercel rollback
```

### Redeploy Current Version
```bash
vercel --prod --force
```

### Deploy from Local Build
```bash
# Create build locally
cd frontend
npm run build

# Deploy
cd ..
vercel --prod
```

---

## Custom Domain (Optional)

1. Go to Vercel Project Settings → Domains
2. Add your custom domain
3. Update DNS records with Vercel's nameservers
4. SSL certificate auto-configured

Example:
```
videodanza.com → videodanza-nft.vercel.app
```

---

## CI/CD Pipeline Status

Current setup provides:
- ✅ Automatic builds on git push
- ✅ Preview deployments for PRs
- ✅ Production deployments on main branch
- ✅ SSL/HTTPS enabled automatically
- ✅ Global CDN distribution
- ✅ Automatic rollback capability

---

## Next Steps After Deployment

1. **Test on Sepolia Testnet**
   - Connect wallet
   - Test mint flow
   - Verify contract interaction

2. **Setup Backend API**
   - Deploy `/backend/api/ipfs.js` endpoints
   - Update `NEXT_PUBLIC_API_URL` in Vercel

3. **Monitor Usage**
   - Track transactions
   - Monitor IPFS gateway usage
   - Set up analytics

4. **FASE 3: Enhancement**
   - User portfolio page
   - Transaction history
   - Advanced metadata

---

## Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Project: https://vercel.com/videodanza-nft
- Next.js Docs: https://nextjs.org/docs
- Wagmi Docs: https://wagmi.sh
- RainbowKit Docs: https://www.rainbowkit.com

---

**Deployment Status**: Ready for Vercel  
**Build Test**: ✅ Successful  
**Last Updated**: 2026-02-25
