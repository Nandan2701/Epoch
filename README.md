# Saarum (時代) — The Cognitive Friction Journal

> **A distraction-free, local-first hourly ledger and raw voice stream built to solve the "AI Retention Debt" through intentional cognitive friction.**

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)
[![Storage: Local-First](https://img.shields.io/badge/Storage-Chrome%20Local-10B981.svg)]()
[![Design: Editorial Monograph](https://img.shields.io/badge/Design-Editorial%20Monograph-C2410C.svg)]()

---

## ⚡ The Core Problem: The AI Retention Debt

In the era of AI (ChatGPT, Claude, Cursor), we absorb massive quantities of high-density knowledge in 45 minutes—**only to forget it 1 to 2 hours later**. 

### Why this happens:
1. **The Illusion of Competence:** Reading AI summaries feels fluent and effortless. But *recognition is not retrieval*. Without cognitive struggle, your brain prunes the information within 90 minutes.
2. **Traditional Notes Fail:** Exhaustive hourly journaling in Notion or Obsidian leads to burnout within 3 days.
3. **The Solution:** **The 3-Step Friction Loop**. Just 90 seconds of intentional cognitive friction at high-leverage moments.

---

## 🏛️ The Dual-Surface Architecture

Saarum enforces a **strict separation of concerns**:

```
┌──────────────────────────────────────────────────┐   ┌──────────────────────────────────────────────┐
│        THE MAIN LEDGER (00:00 – 24:00)           │   │      THE RAW STREAM DRAWER (SLIDE-OVER)      │
│                                                  │   │                                              │
│  Strictly 1–2 distilled bullet points per hour.  │ + │  Infinite, uncensored canvas for continuous  │
│  "What is the single non-obvious insight here?" │   │  voice dictation, raw AI chat dumps, & code. │
└──────────────────────────────────────────────────┘   └──────────────────────────────────────────────┘
```

---

## ✨ Features

* **Architectural Monograph Aesthetic:** Warm linen paper tone (`#F8F7F4`), stone hairlines, and warm charcoal typography (`#1C1917`). Features **Newsreader** editorial serif paired with **Plus Jakarta Sans** and **JetBrains Mono**. Zero generic AI dark navy/neon blue.
* **Hourly Ledger (00:00 – 24:00):** All 24 hours of the day (0 – 1 through 11 – 12) with real-time active hour auto-highlight, intelligent bullet formatting, and daily momentum tracking.
* **Universal Voice Dictation:** Built-in Web Speech API microphone toggle with real-time transcription, fully compatible with OS shortcuts (**Wispr Flow**, Windows **`Win + H`**, Mac Dictation).
* **3-Minute Bedtime Replay:** Pre-sleep memory consolidation modal. Includes an active recall **"Stealth Blur Mode"** that hides bullet text until clicked, triggering neural replay in the hippocampus before sleep.
* **100% Local-First & Private:** Saves directly to Chrome's `localStorage` (`cadence_journal_{YYYY-MM-DD}`). Zero tracking, zero remote servers, complete privacy.
* **Export Anywhere:** 1-click export to clean Markdown (`.md`) formatted for Obsidian, Notion, or text archives.

---

## 🚀 Live Demo & Deployment

🌐 **Live Application:** [https://saarum.vercel.app/](https://saarum.vercel.app/)

Saarum is a pure client-side web application with zero build steps or server dependencies.

### Option 1: Live Web App (Vercel)
Launch directly in your browser: **[saarum.vercel.app](https://saarum.vercel.app/)**

### Option 2: Run Locally
1. Clone this repository:
   ```bash
   git clone https://github.com/Nandan2701/Epoch.git
   ```
2. Open `index.html` in Chrome, Edge, or Brave.

### Option 3: Deploy to GitHub Pages (1-Click)
1. Go to your repository settings on GitHub: **Settings $\rightarrow$ Pages**.
2. Under **Build and deployment $\rightarrow$ Branch**, select `main` (or `master`) and `/ (root)`.
3. Click **Save**. Your site will be live instantly at `https://nandan2701.github.io/Saarum/`!

---

## 🗂️ Project Structure

```
Saarum/
├── index.html              # Core editorial layout, timeline, drawer & modal DOM
├── documentation.md        # Deep cognitive science brief, origin story & architecture
├── README.md               # Repository documentation and deployment guide
├── css/
│   ├── style.css           # Design tokens, typography, monograph grid, animations
│   └── drawer.css          # Raw Stream slide-over drawer & bedtime recall modal
└── js/
    ├── app.js              # Application controller, timeline rendering, event handlers
    ├── storage.js          # LocalStorage CRUD, auto-save debounce, Markdown export
    ├── speech.js           # Web Speech API continuous dictation engine
    └── replay.js           # 3-Minute bedtime active recall consolidation view
```

---

## 📖 Deep Dive Documentation

For the complete breakdown of our Reddit investigation, cognitive science research, and architectural rationale, read the full [`documentation.md`](documentation.md) file.

---

## 📄 License

MIT © [Nandan2701](https://github.com/Nandan2701)
