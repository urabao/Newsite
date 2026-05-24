# India Pulse — Deployment Guide

## Prerequisites
- A free account on vercel.com
- A free account on github.com
- Node.js installed on your computer (download from nodejs.org)

## Step 1: Set Up the Project Locally
1. Create a folder called `india-pulse` on your computer.
2. Copy all project files into this folder maintaining the exact structure shown.
3. Open Terminal (Mac/Linux) or Command Prompt (Windows).
4. Navigate to the folder: `cd path/to/india-pulse`
5. Install dependencies: `npm install`

## Step 2: Test Locally
1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel dev`
3. Open http://localhost:3000 in your browser.
4. You should see the India Pulse dashboard loading with news data.

## Step 3: Deploy to Vercel
1. Run: `vercel`
2. When asked "Set up and deploy?": press Enter (Yes)
3. When asked about project settings: press Enter for all defaults
4. Vercel will give you a live URL like `https://india-pulse-xyz.vercel.app`
5. Open that URL — your dashboard is live!

## Step 4: Custom Domain (Optional)
1. Go to vercel.com → your project → Settings → Domains
2. Add your custom domain and follow DNS instructions.

## Updating Your Dashboard
- Edit any file locally, then run `vercel --prod` to redeploy.

## Changing Default City
- Open `public/app.js`
- Change `const DEFAULT_CITY = 'India'` to your city name
- Redeploy

## Free Tier Limits (Vercel Hobby)
- 100 GB bandwidth/month
- 100,000 serverless function invocations/month
- This dashboard uses ~2 invocations per page load, so you have ~50,000 free loads/month.
