# Soccer Scoreboard APP

A mobile-first scoreboard app for youth soccer referees and coaches. Tracks scores, time, and cards across all youth formats — from U5 up to U21.

**Web app:** https://bylemans.github.io/SoccerScoreboardAPPv2/

---

## Features

- **Live countdown timer** — counts down per period with a beep and vibration alarm when time is up
- **Score tracking** — tap + or − to adjust the home and away score; team names are editable
- **Per-period breakdown** — scores are tracked per half, quarter, or period separately, with a running total
- **Multiple game formats** — supports U5, U7, U9, U10–13, U14–17, U19–21 with the correct period count and duration for each
- **Yellow and red card tracking** — log cards by player number per team (U10 and older)
- **Screen stay-on** — prevents the screen from dimming during an active game
- **Push notifications** — get notified when a period ends even if the app is in the background
- **Installable** — works as a PWA (Add to Home Screen) and is also distributed as a native Android APK and iOS IPA

---

## Game Formats

| Format | Period type | Periods | Duration |
|--------|------------|---------|----------|
| U5 / U6 | Quarter | 4 | 10 min |
| U7 / U8 | Quarter | 4 | 12 min |
| U9 | Half | 2 | 20 min |
| U10 – U13 | Half | 2 | 25 min |
| U14 – U17 | Half | 2 | 35 min |
| U19 – U21 | Half | 2 | 45 min |

---

## Install

### Web (PWA)
Open the web app in your browser and tap **Add to Home Screen** (Safari on iPhone, Chrome on Android).

### Android APK
Download the latest APK from [Releases](https://github.com/bylemans/SoccerScoreboardAPPv2/releases) and sideload it — enable *Install from unknown sources* in your Android settings first.

### iPhone IPA
Download the latest IPA from [Releases](https://github.com/bylemans/SoccerScoreboardAPPv2/releases) and install it via [Sideloadly](https://sideloadly.io/) (free). Re-install every 7 days with a free Apple ID.

---

## Tech Stack

- **React 18** + TypeScript
- **Vite** — build tool
- **Tailwind CSS** + shadcn/ui — styling and components
- **Capacitor** — native Android and iOS wrapper
- **Firebase** — push notifications (FCM)
- **Supabase** — scheduled notification delivery
- **GitHub Actions** — automated APK, IPA, and web builds
- **GitHub Pages** — web app hosting

---

## Development

```sh
# Install dependencies
npm install

# Start local dev server (http://localhost:8080)
npm run dev

# Build for web (GitHub Pages)
npm run build

# Sync web build into native projects
npm run cap:sync

# Open in Android Studio
npm run cap:android

# Open in Xcode (macOS only)
npm run cap:ios
```

### GitHub Actions

Pushing to `main` automatically triggers three workflows:

| Workflow | Runner | Output |
|----------|--------|--------|
| Deploy to GitHub Pages | ubuntu | Web app at `bylemans.github.io` |
| Build Android APK | ubuntu | `soccer-scoreboard.apk` artifact |
| Build iOS IPA | macos | `SoccerScoreboard.ipa` artifact |

Required repository secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `GOOGLE_SERVICES_JSON`.
