# Docsmith - Senin 27 April 2026

A browser-first PDF utility. Merge, split, rotate, extract pages, and compress PDFs.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** (scrapbook design system)
- **pdf-lib** — client-side PDF manipulation
- **pdfjs-dist** — PDF preview rendering
- **file-saver** — download trigger
- **Ghostscript** — server-side compression (via API route)

## Features

| Tool | Engine | Description |
|---|---|---|
| Merge PDF | pdf-lib (browser) | Combine PDFs with drag-reorder |
| Split PDF | pdf-lib (browser) | Split by all pages or custom ranges |
| Rotate Pages | pdf-lib (browser) | Rotate all or specific pages |
| Extract Pages | pdf-lib (browser) | Pull specific pages into a new PDF |
| Compress PDF | Ghostscript (server) | Presets or exact target file size |

## Project Structure

```
src/
  app/
    page.tsx               # Homepage tool grid
    merge/page.tsx
    split/page.tsx
    rotate/page.tsx
    extract/page.tsx
    compress/page.tsx
    api/compress/route.ts  # Ghostscript API route
  components/
    Navbar.tsx
    ToolCard.tsx
    FileUploader.tsx
    PDFPreview.tsx
    CompressionOptions.tsx
    DownloadButton.tsx
  lib/
    mergePDF.ts
    splitPDF.ts
    rotatePDF.ts
    extractPDF.ts
  utils/
    fileReader.ts
    downloadFile.ts
```

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Compression API

`POST /api/compress` — requires Ghostscript installed on the server.

```
FormData fields:
  file     File     PDF file (max 50 MB)
  mode     string   "preset" | "target"
  preset   string   "low" | "medium" | "high"  (when mode=preset)
  targetMB string   target size in MB           (when mode=target)
```

Response headers include `X-Original-Size` and `X-Compressed-Size`.

## Deployment

Deploy to Vercel. For compression, the server must have Ghostscript available. On Vercel's standard runtime, compression requires a custom Docker layer or a self-hosted Node.js server.

All other tools (Merge, Split, Rotate, Extract) run fully client-side and work on any static/edge deployment.
