# 🌊 CalmFlow

A study dashboard I built to help me (and other students) stay organized and focused.

I was tired of switching between Google Calendar, a todo app, and a phone timer every time I sat down to study — so I combined everything into one tool.

**Live site:** [https://ryokakobayashi.github.io/calmflow/](https://ryokakobayashi.github.io/calmflow/)

![HTML](https://img.shields.io/badge/HTML-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-4285F4?style=flat&logo=googlechrome&logoColor=white)

---

## What it does

- **Calendar** — Monthly view with event chips. Click a date number to see the full daily planner. Multi-day events show as connected bars across days.
- **Todo List** — Add tasks with deadlines and priority levels. Drag and drop to reorder. Filter by active, done, or expired.
- **Study Timer** — Pomodoro timer (25/50 min presets + custom) and a stopwatch. Tracks time per subject automatically.
- **Site Blocker** — A Chrome extension that actually blocks distracting sites during study sessions. (See below for install instructions.)

## Chrome Extension: CalmFlow Blocker

The site blocker isn't just a reminder — it's a real Chrome extension that uses `chrome.declarativeNetRequest` to block sites at the browser level.

When you try to open a blocked site during Focus Mode, you get redirected to a message page instead.

### How to install

1. Download or clone this repo
2. Open `chrome://extensions/` in Chrome
3. Turn on **Developer mode** (top right toggle)
4. Click **"Load unpacked"**
5. Select the `extension/` folder from this repo
6. The 🌊 icon appears in your toolbar — click it to manage blocked sites and toggle Focus Mode

### How it works

- Add sites to block (e.g. `twitter.com`, `youtube.com`)
- Turn on Focus Mode → those sites are actually blocked
- Turn off Focus Mode → access is restored immediately
- Blocked sites show a CalmFlow page with a message

---

## Using the dashboard

Just open the live link above in any browser. No account needed, no install needed.

All your data is saved in your browser's localStorage, so it stays even after you close the tab. But if you clear your browser data, it's gone.

## Running locally

```bash
git clone https://github.com/ryokakobayashi/calmflow.git
cd calmflow
open index.html
```

No npm, no build step, no dependencies.

## Project structure

```
calmflow/
├── index.html              # Dashboard - page structure
├── style.css               # Dashboard - styling
├── script.js               # Dashboard - application logic
├── extension/              # Chrome extension
│   ├── manifest.json       # Extension config
│   ├── background.js       # Blocking logic (declarativeNetRequest)
│   ├── popup.html          # Extension popup UI
│   ├── popup.js            # Popup logic
│   ├── blocked.html        # Page shown when a site is blocked
│   └── icons/              # Extension icons
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── README.md
└── LICENSE
```

## Tech

- Vanilla HTML / CSS / JavaScript (no frameworks)
- localStorage for data persistence
- Chrome Extension Manifest V3
- `chrome.declarativeNetRequest` API for site blocking

I chose not to use React or any framework because I wanted to understand how everything works at a fundamental level first.

## Known limitations

- Dashboard data doesn't sync between devices (localStorage only)
- The Chrome extension needs to be installed separately (it's not on the Chrome Web Store)
- No dark/light theme toggle yet

## What I learned

This was my first real web project beyond class assignments. Some things I figured out along the way:

- How to structure a single-page app without a framework
- Working with dates in JavaScript (harder than it sounds)
- Drag and drop API for todo reordering
- CSS Grid for the calendar layout
- Managing state with localStorage
- Building a Chrome extension with Manifest V3
- Using `declarativeNetRequest` to intercept and redirect network requests

## Future ideas

- [ ] Data export/import
- [ ] Dark/light theme toggle
- [ ] Publish the extension to Chrome Web Store
- [ ] Maybe rewrite in React someday
- [ ] Mobile PWA support

