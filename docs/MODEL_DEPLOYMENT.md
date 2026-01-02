# Model Deployment Guide

This guide explains how to deploy the Gemma 2B model for your @web-agent React application in production.

## Overview

The Gemma 2B model (~2GB) runs **entirely in the user's browser**. Your server only needs to **serve the model file** - no GPU servers required!

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                               │
│                                                                 │
│  1. Download model file (one-time, ~2GB)                       │
│  2. Cache in IndexedDB (subsequent loads are instant)          │
│  3. Run inference on user's GPU via WebGPU                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP GET (model file)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR SERVER / CDN                            │
│                                                                 │
│  Just serves static files:                                      │
│  - Your React app (JS, CSS, HTML)                              │
│  - Model file (gemma-2b-it-gpu-int4.bin)                       │
│                                                                 │
│  NO GPU required! No AI processing on server!                  │
└─────────────────────────────────────────────────────────────────┘
```

## Model File

### Download the Model

1. Go to [Kaggle Gemma Models](https://www.kaggle.com/models/google/gemma/tfLite)
2. Download `gemma-2b-it-gpu-int4` variant
3. Extract to get `gemma-2b-it-gpu-int4.bin` (~2GB)

### Model Variants

| Variant | Size | Quality | Speed |
|---------|------|---------|-------|
| `gemma-2b-it-gpu-int4` | ~2GB | Good | Fast |
| `gemma-2b-it-gpu-int8` | ~4GB | Better | Slower |
| `gemma-7b-it-gpu-int4` | ~7GB | Best | Slowest |

**Recommended:** `gemma-2b-it-gpu-int4` for best balance of quality and load time.

---

## Deployment Options

### Option 1: Vercel (Recommended for React/Next.js)

```bash
# Project structure
my-app/
├── public/
│   └── models/
│       └── gemma-2b-it-gpu-int4.bin  # Place model here
├── src/
└── vercel.json
```

**vercel.json** - Configure for large files:
```json
{
  "functions": {
    "api/**": {
      "maxDuration": 60
    }
  },
  "headers": [
    {
      "source": "/models/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" },
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

**Usage:**
```tsx
import { SmartAgentProvider } from '@web-agent/react';

function App() {
  return (
    <SmartAgentProvider modelPath="/models/gemma-2b-it-gpu-int4.bin">
      {/* Your app */}
    </SmartAgentProvider>
  );
}
```

> ⚠️ **Vercel Limit:** Free tier has 100MB file limit. Use external storage for the model.

---

### Option 2: AWS S3 + CloudFront (Best for Scale)

**1. Upload to S3:**
```bash
aws s3 cp gemma-2b-it-gpu-int4.bin s3://your-bucket/models/
```

**2. Configure CORS (S3 bucket settings):**
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": ["https://yourdomain.com"],
      "ExposeHeaders": ["Content-Length", "Content-Type"]
    }
  ]
}
```

**3. Create CloudFront Distribution:**
- Origin: Your S3 bucket
- Enable caching
- Add CORS headers

**4. Usage:**
```tsx
<SmartAgentProvider 
  modelPath="https://d123abc.cloudfront.net/models/gemma-2b-it-gpu-int4.bin"
>
```

---

### Option 3: Google Cloud Storage

**1. Upload:**
```bash
gsutil cp gemma-2b-it-gpu-int4.bin gs://your-bucket/models/
```

**2. Make public:**
```bash
gsutil iam ch allUsers:objectViewer gs://your-bucket
```

**3. Configure CORS:**
```bash
# cors.json
[
  {
    "origin": ["https://yourdomain.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Content-Length"],
    "maxAgeSeconds": 3600
  }
]

gsutil cors set cors.json gs://your-bucket
```

**4. Usage:**
```tsx
<SmartAgentProvider 
  modelPath="https://storage.googleapis.com/your-bucket/models/gemma-2b-it-gpu-int4.bin"
>
```

---

### Option 4: Cloudflare R2 (Most Cost-Effective)

**Why R2?**
- Zero egress fees (huge savings for 2GB model!)
- Global CDN included
- S3-compatible API

**1. Create R2 bucket in Cloudflare dashboard**

**2. Upload model:**
```bash
# Using AWS CLI with R2 credentials
aws s3 cp gemma-2b-it-gpu-int4.bin \
  s3://your-bucket/models/ \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com
```

**3. Enable public access in R2 settings**

**4. Usage:**
```tsx
<SmartAgentProvider 
  modelPath="https://your-bucket.<account-id>.r2.dev/models/gemma-2b-it-gpu-int4.bin"
>
```

---

### Option 5: Self-Hosted (Nginx/Apache)

**nginx.conf:**
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    location /models/ {
        alias /var/www/models/;
        
        # Enable range requests (important for large files)
        add_header Accept-Ranges bytes;
        
        # CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS";
        
        # Caching
        add_header Cache-Control "public, max-age=31536000, immutable";
        
        # Gzip for faster transfer (optional, model may not compress well)
        gzip off;
    }
}
```

---

## Environment Variables

### Vite (React)
```bash
# .env
VITE_MODEL_URL=https://your-cdn.com/models/gemma-2b-it-gpu-int4.bin
```

```tsx
<SmartAgentProvider modelPath={import.meta.env.VITE_MODEL_URL}>
```

### Next.js
```bash
# .env.local
NEXT_PUBLIC_MODEL_URL=https://your-cdn.com/models/gemma-2b-it-gpu-int4.bin
```

```tsx
<SmartAgentProvider modelPath={process.env.NEXT_PUBLIC_MODEL_URL}>
```

---

## Caching Strategy

The framework automatically caches the model in IndexedDB:

```tsx
import { isModelCached, getModelInfo, clearModelCache } from '@web-agent/react';

// Check if cached
const cached = await isModelCached();
console.log('Model cached:', cached);

// Get cache info
const info = await getModelInfo();
console.log('Cache info:', info);
// { size: 2000000000, isCached: true, cachedAt: 1704067200000 }

// Clear cache (if needed)
await clearModelCache();
```

### User Experience Flow

```
First Visit:
┌────────────────────────────────────────────────────────────────┐
│ 1. Check WebGPU support                              [instant] │
│ 2. Check IndexedDB cache                             [instant] │
│ 3. Download model from CDN                           [~2 min]  │
│ 4. Cache in IndexedDB                                [~5 sec]  │
│ 5. Initialize LLM                                    [~3 sec]  │
│ 6. Ready to use!                                               │
└────────────────────────────────────────────────────────────────┘

Subsequent Visits:
┌────────────────────────────────────────────────────────────────┐
│ 1. Check WebGPU support                              [instant] │
│ 2. Load from IndexedDB cache                         [~5 sec]  │
│ 3. Initialize LLM                                    [~3 sec]  │
│ 4. Ready to use!                                               │
└────────────────────────────────────────────────────────────────┘
```

---

## Loading UI Example

```tsx
import { SmartAgentProvider, useSmartAgent } from '@web-agent/react';

function App() {
  return (
    <SmartAgentProvider
      modelPath="/models/gemma-2b-it-gpu-int4.bin"
      onModelLoadProgress={(progress) => console.log(`Loading: ${progress}%`)}
    >
      <LoadingWrapper>
        <YourApp />
      </LoadingWrapper>
    </SmartAgentProvider>
  );
}

function LoadingWrapper({ children }) {
  const { isReady, isLoading, modelLoadProgress, error } = useSmartAgent();

  if (error) {
    return (
      <div className="error-screen">
        <h2>AI Not Available</h2>
        <p>{error.message}</p>
        <p>The app will work without AI features.</p>
      </div>
    );
  }

  if (isLoading && modelLoadProgress < 100) {
    return (
      <div className="loading-screen">
        <h2>Loading AI Model...</h2>
        <div className="progress-bar">
          <div style={{ width: `${modelLoadProgress}%` }} />
        </div>
        <p>{modelLoadProgress}% - First load takes ~2 minutes</p>
        <p className="note">Model is cached for instant loads next time!</p>
      </div>
    );
  }

  return children;
}
```

---

## Cost Comparison

| Provider | Storage Cost | Egress Cost (per 2GB download) | Monthly (1000 users) |
|----------|-------------|-------------------------------|----------------------|
| **Cloudflare R2** | $0.015/GB | **$0** | ~$0.03 |
| **AWS S3 + CloudFront** | $0.023/GB | $0.085/GB | ~$170 |
| **Google Cloud Storage** | $0.020/GB | $0.12/GB | ~$240 |
| **Vercel** | Included | Included (limited) | $20+ |

**Recommendation:** Use **Cloudflare R2** for cost-effective model hosting at scale.

---

## Browser Support

| Browser | WebGPU | Notes |
|---------|--------|-------|
| Chrome 113+ | ✅ | Full support |
| Edge 113+ | ✅ | Full support |
| Firefox Nightly | ⚠️ | Behind flag |
| Safari 18+ | ⚠️ | Limited support |

**Fallback for unsupported browsers:**
```tsx
function App() {
  const webGPU = checkWebGPUSupport();
  
  if (!webGPU.supported) {
    return <NonAIVersion reason={webGPU.reason} />;
  }
  
  return (
    <SmartAgentProvider>
      <AIVersion />
    </SmartAgentProvider>
  );
}
```

---

## Performance Tips

1. **Use a CDN** - Reduces latency for model download
2. **Enable HTTP/2** - Better for large file downloads
3. **Set proper cache headers** - `Cache-Control: public, max-age=31536000, immutable`
4. **Enable Range requests** - Allows resumable downloads
5. **Compress if possible** - Though models don't compress much
6. **Lazy load** - Don't block initial page render

```tsx
// Lazy load - AI loads in background
<SmartAgentProvider autoLoad={true}>
  <YourApp />  {/* App is usable immediately */}
</SmartAgentProvider>
```

---

## Troubleshooting

### "Model download failed"
- Check CORS headers on your CDN
- Verify the model URL is correct
- Check network tab for errors

### "WebGPU not supported"
- User needs Chrome 113+ or Edge 113+
- Check `chrome://gpu` for WebGPU status

### "Out of memory"
- Model requires ~4GB RAM
- Close other browser tabs
- Try smaller model variant

### "Slow initial load"
- Normal for first download (~2GB)
- Model is cached after first load
- Show progress to user

---

## Summary

1. **Download** the Gemma model from Kaggle
2. **Upload** to your CDN (R2, S3, GCS, etc.)
3. **Configure** CORS and caching headers
4. **Use** `modelPath` prop to point to your CDN URL
5. **Enjoy** free, private AI in every user's browser!

