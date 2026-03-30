<div align="center">

# ☽ Salaty — صلاتي

### Prayer Times & Daily Reminder App

*A beautiful, location-aware Progressive Web App for the five daily Islamic prayers*

![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)
![PWA](https://img.shields.io/badge/PWA-Ready-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

</div>

---

## ✨ Features

- **🕌 Accurate Prayer Times** — Powered by the [AlAdhan API](https://aladhan.com/prayer-times-api), supporting 8 calculation methods
- **📍 Auto Geolocation** — Detects your GPS coordinates and reverse-geocodes to a city name
- **⏱ Live Countdown** — Real-time countdown to the next prayer, updating every second
- **🔔 Browser Notifications** — Configurable reminders (1–60 min before each prayer)
- **📅 Hijri Calendar** — Islamic date displayed alongside the Gregorian date
- **✅ Prayer Tracker** — Check off each prayer as you complete it
- **🌙 Dark / Light Mode** — Full theme support, persisted to localStorage
- **📱 PWA Installable** — Add to home screen on iOS, Android, and desktop
- **⚙️ 8 Calculation Methods** — ISNA, Umm al-Qura, MWL, Egyptian, Gulf & more

---

## 🖼 Screenshots

| Dark Mode | Light Mode | Settings |
|-----------|-----------|---------|
| *midnight navy with gold accents* | *warm cream with golden highlights* | *calculation methods & reminders* |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
# Clone the repository
git clone https://github.com/youness-oujdid/salaty.git
cd salaty

# Install dependencies
npm install

# Start development server (opens at http://localhost:3000)
npm run dev
```

### Build for Production

```bash
npm run build

# Preview production build locally
npm run preview
```

---

## 📂 Project Structure

```
salaty/
├── public/
│   ├── favicon.svg           # App favicon
│   └── icons/
│       ├── icon-192x192.png  # PWA icon (Android)
│       └── icon-512x512.png  # PWA splash icon
├── src/
│   ├── Salaty.jsx            # Main application component (all-in-one)
│   ├── main.jsx              # React entry point
│   └── index.css             # Global reset & scrollbar styles
├── .github/
│   └── workflows/
│       ├── deploy.yml        # Auto-deploy to GitHub Pages on push to main
│       └── lint.yml          # Lint check on every PR
├── index.html                # HTML shell
├── vite.config.js            # Vite + PWA plugin config
└── package.json
```

---

## 🕌 The Five Daily Prayers

| Prayer | Icon | Time |
|--------|------|------|
| Fajr | 🌙 | Pre-dawn |
| Dhuhr | ☀️ | Midday |
| Asr | 🌤 | Afternoon |
| Maghrib | 🌇 | Sunset |
| Isha | 🌌 | Night |

---

## 🧮 Supported Calculation Methods

| ID | Method | Region |
|----|--------|--------|
| 1 | Muslim World League | Global / Europe |
| 2 | ISNA | North America |
| 3 | Moon Sighting Committee | Moon-sighting based |
| 4 | Umm al-Qura | Saudi Arabia |
| 5 | Egyptian Authority | Egypt & Africa |
| 8 | Gulf Region (Kuwait) | Kuwait |
| 12 | Union of Islamic World | Global |
| 15 | Gulf Region | Gulf Countries |

---

## 🌐 APIs Used

| API | Purpose | Docs |
|-----|---------|------|
| [AlAdhan](https://aladhan.com/prayer-times-api) | Prayer time calculation | [docs](https://aladhan.com/prayer-times-api) |
| [Nominatim](https://nominatim.openstreetmap.org) | Reverse geocoding | [docs](https://nominatim.org/release-docs/develop/api/Reverse/) |
| Web Notifications API | Browser push reminders | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) |
| Navigator.geolocation | GPS coordinates | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) |

---

## 🚢 Deployment

### GitHub Pages (Auto via CI/CD)

Pushes to `main` automatically build and deploy via GitHub Actions.

Enable GitHub Pages in your repo:  
**Settings → Pages → Source → Deploy from a branch → `gh-pages`**

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

### Netlify

```bash
npm run build
# Drag and drop the dist/ folder at netlify.com/drop
```

---

## 📱 PWA Installation

### Android (Chrome)
1. Open the app in Chrome
2. Tap the **⋮** menu → **Add to Home screen**

### iOS (Safari)
1. Open the app in Safari
2. Tap **Share** → **Add to Home Screen**

### Desktop (Chrome/Edge)
1. Look for the install icon in the address bar
2. Click **Install**

---

## 🔧 Configuration

User preferences are saved automatically to `localStorage` under the key `salaty_prefs`:

```json
{
  "calcMethod": 2,
  "reminders": { "Fajr": true, "Dhuhr": false, "Asr": true, "Maghrib": true, "Isha": true },
  "reminderOffset": 5,
  "darkMode": true
}
```

To reset all preferences:
```js
localStorage.removeItem('salaty_prefs'); location.reload();
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

*Built with ❤️ for the Muslim community*

**☽ صلاتي · My Prayer ☽**

</div>
