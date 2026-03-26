import { useState, useEffect, useRef, useCallback } from "react";

const CALC_METHODS = [
  { id: 2, name: "ISNA (North America)" },
  { id: 1, name: "Muslim World League" },
  { id: 4, name: "Umm al-Qura (Mecca)" },
  { id: 5, name: "Egyptian Authority" },
  { id: 3, name: "Moon Sighting Committee" },
  { id: 15, name: "Gulf Region" },
  { id: 8, name: "Gulf Region (Kuwait)" },
  { id: 12, name: "Union of Islamic World" },
];

const PRAYERS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const TRACKABLE = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const PRAYER_ICONS = {
  Fajr: "🌙",
  Sunrise: "🌅",
  Dhuhr: "☀️",
  Asr: "🌤",
  Maghrib: "🌇",
  Isha: "🌌",
};

function parseTime(timeStr) {
  if (!timeStr) return null;
  const [time, period] = timeStr.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
}

function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function toHijri(date) {
  // Simple Hijri approximation
  const jd =
    Math.floor((14 + 12 * (date.getMonth() + 1) - Math.floor((date.getMonth() + 1 + 9) / 12)) / 12) +
    date.getDate() +
    Math.floor((153 * (date.getMonth() + 1 > 2 ? date.getMonth() + 1 - 3 : date.getMonth() + 10) + 2) / 5) +
    365 * (date.getFullYear() + 4800 - Math.floor((date.getMonth() + 1 <= 2 ? 1 : 0))) +
    Math.floor((date.getFullYear() + 4800 - Math.floor((date.getMonth() + 1 <= 2 ? 1 : 0))) / 4) -
    Math.floor((date.getFullYear() + 4800 - Math.floor((date.getMonth() + 1 <= 2 ? 1 : 0))) / 100) +
    Math.floor((date.getFullYear() + 4800 - Math.floor((date.getMonth() + 1 <= 2 ? 1 : 0))) / 400) -
    32045;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  const hijriMonths = [
    "Muharram","Safar","Rabi al-Awwal","Rabi al-Thani",
    "Jumada al-Awwal","Jumada al-Thani","Rajab","Sha'ban",
    "Ramadan","Shawwal","Dhu al-Qi'dah","Dhu al-Hijjah",
  ];
  return `${day} ${hijriMonths[month - 1]} ${year} AH`;
}

// Geometric SVG pattern for background decoration
function GeometricPattern({ opacity = 0.06 }) {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="islamic-geo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <g stroke="#C9A84C" strokeWidth="0.5" fill="none" opacity={opacity}>
            <polygon points="40,5 75,22.5 75,57.5 40,75 5,57.5 5,22.5" />
            <polygon points="40,15 65,27.5 65,52.5 40,65 15,52.5 15,27.5" />
            <line x1="40" y1="5" x2="40" y2="75" />
            <line x1="5" y1="22.5" x2="75" y2="57.5" />
            <line x1="75" y1="22.5" x2="5" y2="57.5" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamic-geo)" />
    </svg>
  );
}

function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 1.5 + 0.5,
    delay: Math.random() * 4,
    dur: Math.random() * 3 + 2,
  }));
  return (
    <svg
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {stars.map((s) => (
        <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.size} fill="#C9A84C">
          <animate
            attributeName="opacity"
            values="0.1;0.7;0.1"
            dur={`${s.dur}s`}
            begin={`${s.delay}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}

export default function Salaty() {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [hijriDate, setHijriDate] = useState("");
  const [location, setLocation] = useState(null);
  const [cityName, setCityName] = useState("Detecting location…");
  const [calcMethod, setCalcMethod] = useState(2);
  const [reminders, setReminders] = useState({});
  const [reminderOffset, setReminderOffset] = useState(5);
  const [notifPerm, setNotifPerm] = useState("default");
  const [countdown, setCountdown] = useState({ name: "", time: "" });
  const [nextPrayer, setNextPrayer] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tab, setTab] = useState("today");
  const [completedPrayers, setCompletedPrayers] = useState({});
  const notifTimers = useRef({});

  // Load prefs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("salaty_prefs");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.calcMethod) setCalcMethod(p.calcMethod);
        if (p.reminders) setReminders(p.reminders);
        if (p.reminderOffset) setReminderOffset(p.reminderOffset);
        if (p.darkMode !== undefined) setDarkMode(p.darkMode);
      }
    } catch {}
  }, []);

  // Save prefs
  useEffect(() => {
    try {
      localStorage.setItem(
        "salaty_prefs",
        JSON.stringify({ calcMethod, reminders, reminderOffset, darkMode })
      );
    } catch {}
  }, [calcMethod, reminders, reminderOffset, darkMode]);

  // Notification permission
  useEffect(() => {
    if ("Notification" in window) setNotifPerm(Notification.permission);
  }, []);

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          // Reverse geocode via open API
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          )
            .then((r) => r.json())
            .then((d) => {
              const city =
                d.address?.city ||
                d.address?.town ||
                d.address?.village ||
                d.address?.county ||
                "Your Location";
              const country = d.address?.country || "";
              setCityName(`${city}, ${country}`);
            })
            .catch(() => setCityName("Your Location"));
        },
        () => {
          setError("Location access denied. Using default (Mecca).");
          setLocation({ lat: 21.3891, lng: 39.8579 });
          setCityName("Mecca, Saudi Arabia");
        }
      );
    } else {
      setLocation({ lat: 21.3891, lng: 39.8579 });
      setCityName("Mecca, Saudi Arabia");
    }
  }, []);

  // Fetch prayer times
  useEffect(() => {
    if (!location) return;
    setLoading(true);
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    fetch(
      `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${location.lat}&longitude=${location.lng}&method=${calcMethod}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 200) {
          setPrayerTimes(data.data.timings);
          setHijriDate(
            `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year} AH`
          );
        } else {
          setError("Failed to fetch prayer times.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error. Please check your connection.");
        setLoading(false);
      });
  }, [location, calcMethod]);

  // Countdown timer
  useEffect(() => {
    if (!prayerTimes) return;
    const tick = () => {
      const now = new Date();
      let next = null;
      let nextName = "";
      for (const p of TRACKABLE) {
        const t = parseTime(prayerTimes[p]);
        if (t && t > now) {
          if (!next || t < next) {
            next = t;
            nextName = p;
          }
        }
      }
      if (next) {
        setNextPrayer(nextName);
        setCountdown({ name: nextName, time: formatCountdown(next - now) });
      } else {
        setCountdown({ name: "Fajr (tomorrow)", time: "—" });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prayerTimes]);

  // Schedule notifications
  useEffect(() => {
    Object.values(notifTimers.current).forEach(clearTimeout);
    notifTimers.current = {};
    if (!prayerTimes || notifPerm !== "granted") return;
    TRACKABLE.forEach((p) => {
      if (!reminders[p]) return;
      const t = parseTime(prayerTimes[p]);
      if (!t) return;
      const triggerAt = new Date(t.getTime() - reminderOffset * 60 * 1000);
      const delay = triggerAt - new Date();
      if (delay > 0) {
        notifTimers.current[p] = setTimeout(() => {
          new Notification(`🕌 ${p} in ${reminderOffset} minutes`, {
            body: `Prayer time: ${prayerTimes[p]}`,
            icon: "https://cdn.jsdelivr.net/npm/twemoji@latest/assets/72x72/1f54c.png",
          });
        }, delay);
      }
    });
  }, [prayerTimes, reminders, reminderOffset, notifPerm]);

  const requestNotifPerm = async () => {
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
  };

  const toggleReminder = (prayer) => {
    setReminders((prev) => ({ ...prev, [prayer]: !prev[prayer] }));
  };

  const toggleCompleted = (prayer) => {
    setCompletedPrayers((prev) => ({ ...prev, [prayer]: !prev[prayer] }));
  };

  const isCurrentPrayer = (name) => nextPrayer === name;

  const getProgressForPrayer = (name) => {
    if (!prayerTimes) return 0;
    const now = new Date();
    const t = parseTime(prayerTimes[name]);
    if (!t) return 0;
    const idx = TRACKABLE.indexOf(name);
    const prevName = idx > 0 ? TRACKABLE[idx - 1] : null;
    const prevT = prevName ? parseTime(prayerTimes[prevName]) : null;
    if (!prevT) return now > t ? 100 : 0;
    const total = t - prevT;
    const elapsed = now - prevT;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  // Colors
  const bg = darkMode
    ? "linear-gradient(135deg, #0a0f1e 0%, #0d1527 40%, #111830 100%)"
    : "linear-gradient(135deg, #f0e6cc 0%, #e8d5a3 40%, #f5edd6 100%)";
  const cardBg = darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.65)";
  const cardBorder = darkMode ? "rgba(201,168,76,0.18)" : "rgba(201,168,76,0.4)";
  const textPrimary = darkMode ? "#f0e6cc" : "#1a1005";
  const textSecondary = darkMode ? "rgba(240,230,204,0.55)" : "rgba(26,16,5,0.55)";
  const gold = "#C9A84C";
  const goldLight = "#E8C96A";

  const styles = {
    app: {
      minHeight: "100vh",
      background: bg,
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      color: textPrimary,
      position: "relative",
      overflow: "hidden",
    },
    container: {
      maxWidth: 820,
      margin: "0 auto",
      padding: "24px 16px 80px",
      position: "relative",
      zIndex: 2,
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 32,
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: 10,
    },
    logoText: {
      fontSize: 28,
      fontWeight: 700,
      letterSpacing: "0.15em",
      color: gold,
      fontFamily: "'Cinzel Decorative', serif",
      textShadow: `0 0 20px rgba(201,168,76,0.4)`,
    },
    logoSub: {
      fontSize: 11,
      letterSpacing: "0.3em",
      color: textSecondary,
      textTransform: "uppercase",
      marginTop: -4,
    },
    iconBtn: {
      background: "none",
      border: `1px solid ${cardBorder}`,
      borderRadius: 10,
      padding: "8px 12px",
      cursor: "pointer",
      color: textPrimary,
      fontSize: 16,
      backdropFilter: "blur(10px)",
      backgroundColor: cardBg,
      transition: "all 0.2s",
    },
    card: {
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: 20,
      backdropFilter: "blur(20px)",
      padding: 24,
      marginBottom: 16,
      position: "relative",
      overflow: "hidden",
      boxShadow: darkMode
        ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,168,76,0.1)"
        : "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(201,168,76,0.2)",
    },
    nextCard: {
      background: darkMode
        ? "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)"
        : "linear-gradient(135deg, rgba(201,168,76,0.25) 0%, rgba(201,168,76,0.1) 100%)",
      border: `1px solid ${gold}44`,
    },
    countdownNum: {
      fontSize: "clamp(40px, 10vw, 72px)",
      fontWeight: 700,
      letterSpacing: "0.05em",
      color: gold,
      fontFamily: "'Cinzel', serif",
      textShadow: `0 0 30px rgba(201,168,76,0.5)`,
      lineHeight: 1,
    },
    prayerRow: {
      display: "flex",
      alignItems: "center",
      padding: "14px 0",
      borderBottom: `1px solid ${cardBorder}`,
      gap: 12,
      transition: "all 0.2s",
    },
    prayerIcon: { fontSize: 22, width: 32, textAlign: "center" },
    prayerName: { flex: 1, fontSize: 18, fontWeight: 600, letterSpacing: "0.03em" },
    prayerTime: {
      fontSize: 15,
      color: gold,
      fontFamily: "'Cinzel', monospace",
      letterSpacing: "0.05em",
      minWidth: 70,
      textAlign: "right",
    },
    activePrayerRow: {
      backgroundColor: darkMode ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.15)",
      borderRadius: 12,
      padding: "14px 12px",
      margin: "0 -12px",
      border: `1px solid ${gold}44`,
    },
    badge: {
      fontSize: 9,
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      padding: "2px 8px",
      borderRadius: 20,
      border: `1px solid ${gold}`,
      color: gold,
    },
    progressBar: {
      height: 2,
      borderRadius: 2,
      background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
      marginTop: 6,
      overflow: "hidden",
    },
    tabs: {
      display: "flex",
      gap: 4,
      marginBottom: 16,
      background: cardBg,
      borderRadius: 12,
      padding: 4,
      border: `1px solid ${cardBorder}`,
    },
    tab: (active) => ({
      flex: 1,
      padding: "8px 0",
      borderRadius: 9,
      border: "none",
      cursor: "pointer",
      fontSize: 13,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      fontFamily: "'Cormorant Garamond', serif",
      fontWeight: active ? 700 : 400,
      background: active ? gold : "transparent",
      color: active ? "#0a0f1e" : textSecondary,
      transition: "all 0.2s",
    }),
    toggle: {
      width: 44,
      height: 24,
      borderRadius: 12,
      border: "none",
      cursor: "pointer",
      position: "relative",
      transition: "all 0.3s",
    },
    settingsOverlay: {
      position: "fixed",
      inset: 0,
      zIndex: 50,
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
    },
    settingsPanel: {
      width: "100%",
      maxWidth: 820,
      background: darkMode ? "#0d1527" : "#f5edd6",
      borderRadius: "24px 24px 0 0",
      padding: "28px 24px 48px",
      border: `1px solid ${cardBorder}`,
      borderBottom: "none",
      boxShadow: "0 -20px 60px rgba(0,0,0,0.4)",
    },
    label: {
      fontSize: 12,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: textSecondary,
      marginBottom: 8,
      display: "block",
    },
    select: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: 12,
      border: `1px solid ${cardBorder}`,
      background: cardBg,
      color: textPrimary,
      fontSize: 15,
      fontFamily: "'Cormorant Garamond', serif",
      backdropFilter: "blur(10px)",
      cursor: "pointer",
      marginBottom: 20,
    },
    input: {
      width: "60px",
      padding: "10px 12px",
      borderRadius: 10,
      border: `1px solid ${cardBorder}`,
      background: cardBg,
      color: textPrimary,
      fontSize: 15,
      textAlign: "center",
    },
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap"
        rel="stylesheet"
      />
      <div style={styles.app}>
        {darkMode && <StarField />}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, overflow: "hidden" }}>
          <GeometricPattern opacity={darkMode ? 0.06 : 0.12} />
          {/* Glowing orb */}
          <div
            style={{
              position: "absolute",
              top: -120,
              right: -80,
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${gold}18 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -200,
              left: -100,
              width: 500,
              height: 500,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(30,80,160,0.15) 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
        </div>

        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logo}>
              <span style={{ fontSize: 28 }}>☽</span>
              <div>
                <div style={styles.logoText}>SALATY</div>
                <div style={styles.logoSub}>صلاتي · Prayer Times</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={styles.iconBtn} onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? "☀️" : "🌙"}
              </button>
              <button style={styles.iconBtn} onClick={() => setShowSettings(true)}>
                ⚙️
              </button>
            </div>
          </div>

          {/* Date & Location */}
          <div style={{ ...styles.card, padding: "16px 24px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 13, color: textSecondary, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  📍 {cityName}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>
                  {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Hijri</div>
                <div style={{ fontSize: 14, color: gold, fontStyle: "italic", marginTop: 2 }}>{hijriDate || toHijri(new Date())}</div>
              </div>
            </div>
          </div>

          {/* Next Prayer Countdown */}
          {!loading && countdown.name && (
            <div style={{ ...styles.card, ...styles.nextCard, textAlign: "center", padding: "28px 24px" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: textSecondary, marginBottom: 8 }}>
                Next Prayer
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>
                {PRAYER_ICONS[countdown.name] || "🕌"} {countdown.name}
              </div>
              <div style={styles.countdownNum}>{countdown.time}</div>
              <div style={{ fontSize: 12, color: textSecondary, marginTop: 8, letterSpacing: "0.1em" }}>
                {prayerTimes && prayerTimes[countdown.name] ? `at ${prayerTimes[countdown.name]}` : ""}
              </div>
              {/* Crescent decoration */}
              <div style={{ position: "absolute", bottom: -20, right: -20, fontSize: 80, opacity: 0.06, pointerEvents: "none" }}>☽</div>
            </div>
          )}

          {/* Notification banner */}
          {notifPerm === "default" && (
            <div
              style={{
                ...styles.card,
                padding: "14px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 14 }}>🔔 Enable notifications for prayer reminders</div>
              <button
                onClick={requestNotifPerm}
                style={{
                  background: gold,
                  color: "#0a0f1e",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 18px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.05em",
                }}
              >
                Enable
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ ...styles.card, borderColor: "rgba(255,100,100,0.3)", padding: "12px 20px", fontSize: 14, color: "#ff8888" }}>
              ⚠️ {error}
            </div>
          )}

          {/* Tabs */}
          <div style={styles.tabs}>
            {["today", "tracker"].map((t) => (
              <button key={t} style={styles.tab(tab === t)} onClick={() => setTab(t)}>
                {t === "today" ? "🕐 Prayers" : "✅ Tracker"}
              </button>
            ))}
          </div>

          {/* Prayer Times */}
          {tab === "today" && (
            <div style={styles.card}>
              {loading ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>☽</div>
                  <div style={{ color: textSecondary, letterSpacing: "0.1em" }}>Calculating prayer times…</div>
                </div>
              ) : prayerTimes ? (
                <div>
                  {PRAYERS.map((p, i) => {
                    const active = isCurrentPrayer(p);
                    const trackable = TRACKABLE.includes(p);
                    const progress = trackable ? getProgressForPrayer(p) : 0;
                    return (
                      <div
                        key={p}
                        style={{
                          ...styles.prayerRow,
                          ...(active ? styles.activePrayerRow : {}),
                          borderBottom: i === PRAYERS.length - 1 ? "none" : `1px solid ${cardBorder}`,
                        }}
                      >
                        <span style={styles.prayerIcon}>{PRAYER_ICONS[p] || "🕌"}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={styles.prayerName}>{p}</span>
                            {active && <span style={styles.badge}>Now</span>}
                          </div>
                          {trackable && (
                            <div style={styles.progressBar}>
                              <div
                                style={{
                                  height: "100%",
                                  width: `${progress}%`,
                                  background: `linear-gradient(90deg, ${gold}, ${goldLight})`,
                                  borderRadius: 2,
                                  transition: "width 1s linear",
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <span style={{ ...styles.prayerTime, color: active ? goldLight : gold }}>
                          {prayerTimes[p] || "—"}
                        </span>
                        {trackable && (
                          <button
                            onClick={() => toggleReminder(p)}
                            title={reminders[p] ? "Reminder on" : "Reminder off"}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 18,
                              opacity: reminders[p] ? 1 : 0.3,
                              transition: "opacity 0.2s",
                              color: gold,
                              padding: 4,
                            }}
                          >
                            🔔
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: textSecondary, textAlign: "center", padding: 40 }}>No data available</div>
              )}
            </div>
          )}

          {/* Prayer Tracker */}
          {tab === "tracker" && (
            <div style={styles.card}>
              <div style={{ fontSize: 13, color: textSecondary, letterSpacing: "0.1em", marginBottom: 16, textTransform: "uppercase" }}>
                Track Today's Prayers
              </div>
              {TRACKABLE.map((p, i) => (
                <div
                  key={p}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 0",
                    borderBottom: i < TRACKABLE.length - 1 ? `1px solid ${cardBorder}` : "none",
                  }}
                >
                  <button
                    onClick={() => toggleCompleted(p)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: `2px solid ${completedPrayers[p] ? gold : cardBorder}`,
                      background: completedPrayers[p] ? gold : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                  >
                    {completedPrayers[p] ? "✓" : ""}
                  </button>
                  <span style={{ fontSize: 18 }}>{PRAYER_ICONS[p]}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 600,
                        textDecoration: completedPrayers[p] ? "line-through" : "none",
                        color: completedPrayers[p] ? textSecondary : textPrimary,
                        transition: "all 0.2s",
                      }}
                    >
                      {p}
                    </div>
                    <div style={{ fontSize: 13, color: textSecondary }}>
                      {prayerTimes ? prayerTimes[p] : "Loading…"}
                    </div>
                  </div>
                  {completedPrayers[p] && (
                    <span style={{ fontSize: 12, color: gold, letterSpacing: "0.1em" }}>Completed ✨</span>
                  )}
                </div>
              ))}
              <div
                style={{
                  marginTop: 20,
                  padding: "14px 0 0",
                  borderTop: `1px solid ${cardBorder}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 14, color: textSecondary }}>
                  {Object.values(completedPrayers).filter(Boolean).length} / {TRACKABLE.length} completed
                </span>
                <div
                  style={{
                    height: 8,
                    flex: "0 0 160px",
                    borderRadius: 4,
                    background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(Object.values(completedPrayers).filter(Boolean).length / TRACKABLE.length) * 100}%`,
                      background: `linear-gradient(90deg, ${gold}, ${goldLight})`,
                      borderRadius: 4,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div style={{ textAlign: "center", fontSize: 12, color: textSecondary, marginTop: 24, letterSpacing: "0.05em" }}>
            Prayer times powered by AlAdhan API · {CALC_METHODS.find((m) => m.id === calcMethod)?.name}
          </div>
          <div
          style={{
            textAlign: "center",
            fontSize: 12,
            color: textSecondary,
            marginTop: 24,
            letterSpacing: "0.05em"
          }}
        >
          © 2026 YOUNESS OUJDID. All rights reserved.{" "}
          <span>
            Portfolio:{" "}
            <a
              href="https://youness-oujdid.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: gold }}
            >
              youness-oujdid.github.io
            </a>
          </span>
        </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div style={styles.settingsOverlay} onClick={() => setShowSettings(false)}>
            <div style={styles.settingsPanel} onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: gold,
                  fontFamily: "'Cinzel', serif",
                  marginBottom: 24,
                  textAlign: "center",
                }}
              >
                ⚙️ Settings
              </div>

              <label style={styles.label}>Calculation Method</label>
              <select
                style={styles.select}
                value={calcMethod}
                onChange={(e) => setCalcMethod(Number(e.target.value))}
              >
                {CALC_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              <label style={styles.label}>Reminder Offset (minutes before prayer)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={reminderOffset}
                  onChange={(e) => setReminderOffset(Number(e.target.value))}
                  style={{ ...styles.input, background: cardBg, backdropFilter: "blur(10px)" }}
                />
                <span style={{ color: textSecondary, fontSize: 14 }}>minutes before each prayer</span>
              </div>

              <label style={styles.label}>Prayer Reminders</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {TRACKABLE.map((p) => (
                  <button
                    key={p}
                    onClick={() => toggleReminder(p)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 20,
                      border: `1px solid ${reminders[p] ? gold : cardBorder}`,
                      background: reminders[p] ? `${gold}22` : "transparent",
                      color: reminders[p] ? gold : textSecondary,
                      cursor: "pointer",
                      fontSize: 14,
                      fontFamily: "'Cormorant Garamond', serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {PRAYER_ICONS[p]} {p}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <label style={{ ...styles.label, margin: 0 }}>Dark Mode</label>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  style={{
                    ...styles.toggle,
                    background: darkMode ? gold : "#ccc",
                    color: "#0a0f1e",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      left: darkMode ? 22 : 3,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.3s",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }}
                  />
                </button>
              </div>

              {notifPerm !== "granted" && (
                <button
                  onClick={requestNotifPerm}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: gold,
                    color: "#0a0f1e",
                    border: "none",
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: "0.08em",
                    fontFamily: "'Cormorant Garamond', serif",
                    marginBottom: 12,
                  }}
                >
                  🔔 Enable Browser Notifications
                </button>
              )}

              <button
                onClick={() => setShowSettings(false)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "transparent",
                  color: textSecondary,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 14,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
