# Scriptlyst Frontend

React frontend for Scriptlyst - AI YouTube Script + Video Generator.

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- Connected to: scriptlyst-backend (Render)

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create .env.local file
```
VITE_API_URL=https://scriptlyst-backend.onrender.com
VITE_SUPABASE_URL=https://svrxklyfpofcjoojdtzk.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run locally
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

## Deploy to Vercel

1. Push to GitHub repo: `scriptlyst-frontend`
2. Connect to Vercel
3. Add environment variables:
   - VITE_API_URL=https://scriptlyst-backend.onrender.com
   - VITE_SUPABASE_URL=your-supabase-url
   - VITE_SUPABASE_ANON_KEY=your-anon-key
4. Deploy!
5. Set custom domain: scriptlyst.emyj888.com

## Backend
Backend repo: scriptlyst-backend
Backend URL: https://scriptlyst-backend.onrender.com
