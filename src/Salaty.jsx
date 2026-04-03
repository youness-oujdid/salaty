import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const PRAYERS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const TRACKABLE = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const PRAYER_META = {
  Fajr:    { icon: "🌙", ar: "الفجر" },
  Sunrise: { icon: "🌅", ar: "الشروق" },
  Dhuhr:   { icon: "☀️",  ar: "الظهر" },
  Asr:     { icon: "🌤",  ar: "العصر" },
  Maghrib: { icon: "🌇", ar: "المغرب" },
  Isha:    { icon: "🌌", ar: "العشاء" },
};

const CALC_METHODS = [
  { id: 21, en: "Morocco — Ministry of Habous", ar: "المغرب — وزارة الأوقاف" },
  { id: 4,  en: "Umm al-Qura (Mecca)",          ar: "أم القرى (مكة المكرمة)" },
  { id: 1,  en: "Muslim World League",           ar: "رابطة العالم الإسلامي" },
  { id: 2,  en: "ISNA (North America)",          ar: "ISNA (أمريكا الشمالية)" },
  { id: 5,  en: "Egyptian Authority",            ar: "الهيئة المصرية" },
  { id: 3,  en: "Moon Sighting Committee",       ar: "لجنة رؤية الهلال" },
  { id: 8,  en: "Gulf Region (Kuwait)",          ar: "منطقة الخليج (الكويت)" },
  { id: 12, en: "Union of Islamic World",        ar: "اتحاد العالم الإسلامي" },
];

const HIJRI_MONTHS_AR = ["محرم","صفر","ربيع الأول","ربيع الثاني","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"];
const HIJRI_MONTHS_EN = ["Muharram","Safar","Rabi' I","Rabi' II","Jumada I","Jumada II","Rajab","Sha'ban","Ramadan","Shawwal","Dhu al-Qi'dah","Dhu al-Hijjah"];

const MOROCCO = { lat: 33.5731, lng: -7.5898 };

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function loadPref(key, fallback) {
  try { const p = JSON.parse(localStorage.getItem("salaty_prefs") || "{}"); return p[key] !== undefined ? p[key] : fallback; } catch { return fallback; }
}

function parseTime(str) {
  if (!str) return null;
  const [time, period] = str.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function toHijri(date) {
  const jd =
    Math.floor((14 + 12*(date.getMonth()+1) - Math.floor((date.getMonth()+1+9)/12)) / 12) +
    date.getDate() +
    Math.floor((153*(date.getMonth()+1 > 2 ? date.getMonth()+1-3 : date.getMonth()+10)+2)/5) +
    365*(date.getFullYear()+4800-Math.floor((date.getMonth()+1<=2?1:0))) +
    Math.floor((date.getFullYear()+4800-Math.floor((date.getMonth()+1<=2?1:0)))/4) -
    Math.floor((date.getFullYear()+4800-Math.floor((date.getMonth()+1<=2?1:0)))/100) +
    Math.floor((date.getFullYear()+4800-Math.floor((date.getMonth()+1<=2?1:0)))/400) - 32045;
  const l = jd-1948440+10632, n = Math.floor((l-1)/10631), l2 = l-10631*n+354;
  const j = Math.floor((10985-l2)/5316)*Math.floor((50*l2)/17719)+Math.floor(l2/5670)*Math.floor((43*l2)/15238);
  const l3 = l2-Math.floor((30-j)/15)*Math.floor((17719*j)/50)-Math.floor(j/16)*Math.floor((15238*j)/43)+29;
  return { day: l3-Math.floor((709*Math.floor((24*l3)/709))/24), month: Math.floor((24*l3)/709), year: 30*n+j-30 };
}

/* ═══════════════════════════════════════════════════════
   DECORATIONS
═══════════════════════════════════════════════════════ */
function StarField() {
  const stars = Array.from({ length: 55 }, (_, i) => ({
    id: i, x: (i*17+7)%100, y: (i*23+11)%100,
    size: (i%3)*0.5+0.4, delay: (i*0.37)%4, dur: (i%3)*1.5+2.5,
  }));
  return (
    <svg style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:0 }} xmlns="http://www.w3.org/2000/svg">
      {stars.map(s => (
        <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.size} fill="#C9A84C">
          <animate attributeName="opacity" values="0.07;0.6;0.07" dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

function GeoPattern({ dark }) {
  return (
    <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="geo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <g stroke="#C9A84C" strokeWidth="0.6" fill="none" opacity={dark ? 0.07 : 0.13}>
            <polygon points="40,5 75,22.5 75,57.5 40,75 5,57.5 5,22.5" />
            <polygon points="40,16 64,28 64,52 40,64 16,52 16,28" />
            <line x1="40" y1="5" x2="40" y2="75" /><line x1="5" y1="22.5" x2="75" y2="57.5" /><line x1="75" y1="22.5" x2="5" y2="57.5" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#geo)" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════ */
export default function Salaty() {
  const [lang, setLang]           = useState(() => loadPref("lang", "ar"));
  const [darkMode, setDarkMode]   = useState(() => loadPref("darkMode", true));
  const [calcMethod, setCalcMethod] = useState(() => loadPref("calcMethod", 21));
  const [adhanEnabled, setAdhanEnabled] = useState(() => loadPref("adhanEnabled", true));
  const [adhanPrayers, setAdhanPrayers] = useState(() => loadPref("adhanPrayers", { Fajr:true, Dhuhr:true, Asr:true, Maghrib:true, Isha:true }));
  const [reminders, setReminders] = useState(() => loadPref("reminders", {}));
  const [reminderOffset, setReminderOffset] = useState(() => loadPref("reminderOffset", 5));

  const [location, setLocation]   = useState(null);
  const [cityName, setCityName]   = useState("");
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [hijriDate, setHijriDate] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [now, setNow]             = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tab, setTab]             = useState("today");
  const [completed, setCompleted] = useState({});
  const [notifPerm, setNotifPerm] = useState("default");
  const [adhanPlaying, setAdhanPlaying] = useState(false);

  const audioRef     = useRef(null);
  const firedRef     = useRef({});
  const notifTimers  = useRef({});
  const ar = lang === "ar";

  /* persist */
  useEffect(() => {
    try { localStorage.setItem("salaty_prefs", JSON.stringify({ lang, darkMode, calcMethod, adhanEnabled, adhanPrayers, reminders, reminderOffset })); } catch {}
  }, [lang, darkMode, calcMethod, adhanEnabled, adhanPrayers, reminders, reminderOffset]);

  /* clock */
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);

  /* daily tracker reset */
  useEffect(() => {
    const key = now.toDateString();
    if (localStorage.getItem("salaty_tracked_date") !== key) {
      localStorage.setItem("salaty_tracked_date", key);
      setCompleted({}); firedRef.current = {};
    }
  }, [now.toDateString()]);

  /* notif perm */
  useEffect(() => { if ("Notification" in window) setNotifPerm(Notification.permission); }, []);

  /* geolocation */
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(MOROCCO); setCityName(ar ? "الدار البيضاء، المغرب" : "Casablanca, Morocco"); return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng });
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${lang}`);
          const d = await r.json();
          const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || "";
          setCityName(`${city}${city && d.address?.country ? "، " + d.address.country : d.address?.country || ""}`);
        } catch { setCityName(""); }
      },
      () => { setLocation(MOROCCO); setCityName(ar ? "الدار البيضاء، المغرب" : "Casablanca, Morocco"); },
      { timeout: 8000 }
    );
  }, []);

  /* prayer times */
  useEffect(() => {
    if (!location) return;
    setLoading(true); setError(null);
    const d = now, ds = `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`;
    fetch(`https://api.aladhan.com/v1/timings/${ds}?latitude=${location.lat}&longitude=${location.lng}&method=${calcMethod}`)
      .then(r => r.json())
      .then(data => {
        if (data.code === 200) {
          setPrayerTimes(data.data.timings);
          const h = data.data.date.hijri;
          setHijriDate({ day: h.day, monthEn: h.month.en, monthAr: h.month.ar, year: h.year });
        } else setError(ar ? "تعذّر تحميل المواقيت" : "Failed to load prayer times.");
        setLoading(false);
      })
      .catch(() => { setError(ar ? "خطأ في الاتصال" : "Network error."); setLoading(false); });
  }, [location, calcMethod]);

  /* countdown */
  useEffect(() => {
    if (!prayerTimes) return;
    let next = null, nextName = "";
    for (const p of TRACKABLE) {
      const t = parseTime(prayerTimes[p]);
      if (t && t > now) { if (!next || t < next) { next = t; nextName = p; } }
    }
    if (next) {
      setNextPrayer(nextName);
      const diff = next - now;
      setCountdown({ h: Math.floor(diff/3600000), m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000) });
    } else { setNextPrayer("Fajr"); setCountdown(null); }
  }, [now, prayerTimes]);

  /* adhan */
  useEffect(() => {
    if (!prayerTimes || !adhanEnabled) return;
    TRACKABLE.forEach(prayer => {
      if (!adhanPrayers[prayer]) return;
      const t = parseTime(prayerTimes[prayer]);
      if (!t) return;
      const key = `${prayer}_${now.toDateString()}`;
      if (Math.abs(t - now) < 1000 && !firedRef.current[key]) {
        firedRef.current[key] = true;
        const audio = audioRef.current;
        if (audio) { audio.currentTime = 0; audio.play().then(() => setAdhanPlaying(true)).catch(() => {}); }
      }
    });
  }, [now, prayerTimes, adhanEnabled, adhanPrayers]);

  /* notifications */
  useEffect(() => {
    Object.values(notifTimers.current).forEach(clearTimeout); notifTimers.current = {};
    if (!prayerTimes || notifPerm !== "granted") return;
    TRACKABLE.forEach(p => {
      if (!reminders[p]) return;
      const t = parseTime(prayerTimes[p]);
      if (!t) return;
      const delay = t - now - reminderOffset * 60000;
      if (delay > 0) notifTimers.current[p] = setTimeout(() => {
        new Notification(`🕌 ${ar ? PRAYER_META[p].ar : p} ${ar ? "بعد" : "in"} ${reminderOffset} ${ar ? "دقيقة" : "min"}`, {
          body: `${ar ? "موعد الصلاة:" : "Prayer time:"} ${prayerTimes[p]}`, icon: "/icons/icon-192x192.png",
        });
      }, delay);
    });
  }, [prayerTimes, reminders, reminderOffset, notifPerm]);

  const stopAdhan = () => { const a = audioRef.current; if (a) { a.pause(); a.currentTime = 0; setAdhanPlaying(false); } };

  const getProgress = name => {
    if (!prayerTimes) return 0;
    const t = parseTime(prayerTimes[name]); if (!t) return 0;
    const idx = TRACKABLE.indexOf(name), prevT = idx > 0 ? parseTime(prayerTimes[TRACKABLE[idx-1]]) : null;
    if (!prevT) return now > t ? 100 : 0;
    return Math.min(100, Math.max(0, ((now-prevT)/(t-prevT))*100));
  };

  const hijriLabel = (() => {
    if (hijriDate) return ar ? `${hijriDate.day} ${hijriDate.monthAr} ${hijriDate.year} هـ` : `${hijriDate.day} ${hijriDate.monthEn} ${hijriDate.year} AH`;
    const h = toHijri(now);
    return ar ? `${h.day} ${HIJRI_MONTHS_AR[h.month-1]} ${h.year} هـ` : `${h.day} ${HIJRI_MONTHS_EN[h.month-1]} ${h.year} AH`;
  })();

  const gregorianLabel = now.toLocaleDateString(ar ? "ar-MA" : "en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  /* ── theme ── */
  const gold = "#C9A84C", goldLight = "#E8C96A";
  const bg = darkMode ? "linear-gradient(145deg,#080e1c 0%,#0d1527 50%,#0a1220 100%)" : "linear-gradient(145deg,#f0e6cc 0%,#e8d5a3 50%,#f5edd6 100%)";
  const cardBg    = darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)";
  const cardBdr   = darkMode ? "rgba(201,168,76,0.18)"  : "rgba(201,168,76,0.4)";
  const txt       = darkMode ? "#f0e6cc" : "#1a1005";
  const txtSub    = darkMode ? "rgba(240,230,204,0.5)"  : "rgba(26,16,5,0.5)";
  const settingsBg = darkMode ? "#0d1527" : "#f5edd6";
  const arFont    = "'Amiri','Tajawal',serif";
  const enFont    = "'Cinzel','Cormorant Garamond',serif";
  const bodyFont  = ar ? arFont : enFont;

  const card = (extra = {}) => ({
    background: cardBg, border: `1px solid ${cardBdr}`, borderRadius: 20,
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    boxShadow: darkMode ? "0 8px 32px rgba(0,0,0,0.45),inset 0 1px 0 rgba(201,168,76,0.08)" : "0 4px 24px rgba(0,0,0,0.1),inset 0 1px 0 rgba(201,168,76,0.2)",
    ...extra,
  });

  const iconBtnStyle = {
    background: cardBg, border: `1px solid ${cardBdr}`, borderRadius: 10,
    padding: "7px 11px", cursor: "pointer", color: txt, fontSize: 16,
    backdropFilter: "blur(10px)", transition: "all 0.2s",
  };

  const Toggle = ({ on, onToggle }) => (
    <button onClick={onToggle} style={{ width:44, height:24, borderRadius:12, border:"none", cursor:"pointer", position:"relative", background: on ? gold : "#888", transition:"all 0.3s" }}>
      <span style={{ position:"absolute", top:3, left: on ? 23 : 3, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left 0.3s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }} />
    </button>
  );

  const SmallToggle = ({ on, onToggle }) => (
    <button onClick={onToggle} style={{ width:38, height:21, borderRadius:12, border:"none", cursor:"pointer", position:"relative", background: on ? gold : "#888", transition:"all 0.3s" }}>
      <span style={{ position:"absolute", top:2.5, left: on ? 18 : 2.5, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.3s" }} />
    </button>
  );

  const sLabel = { fontSize:11, letterSpacing: ar?"0.04em":"0.18em", textTransform: ar?"none":"uppercase", color:txtSub, marginBottom:8, display:"block", fontFamily: ar?"'Tajawal',sans-serif":enFont };

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@300;400;500;700&family=Cinzel+Decorative:wght@700&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      <audio ref={audioRef} src="/adhan.mp3" onEnded={() => setAdhanPlaying(false)} />

      <div style={{ minHeight:"100vh", background:bg, fontFamily:bodyFont, color:txt, position:"relative", overflow:"hidden", direction: ar?"rtl":"ltr" }}>

        {/* BG */}
        {darkMode && <StarField />}
        <div style={{ position:"absolute", inset:0, zIndex:1, overflow:"hidden" }}>
          <GeoPattern dark={darkMode} />
          <div style={{ position:"absolute", top:-100, right:-100, width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle,${gold}15 0%,transparent 70%)`, pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:-200, left:-120, width:520, height:520, borderRadius:"50%", background:"radial-gradient(circle,rgba(30,80,160,0.12) 0%,transparent 70%)", pointerEvents:"none" }} />
        </div>

        <div style={{ maxWidth:820, margin:"0 auto", padding:"20px 16px 100px", position:"relative", zIndex:2 }}>

          {/* ── HEADER ── */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:30 }}>☽</span>
              <div>
                <div style={{ fontSize: ar?30:22, fontWeight:700, letterSpacing: ar?"0.02em":"0.15em", color:gold, fontFamily: ar?"'Amiri',serif":"'Cinzel Decorative',serif", textShadow:`0 0 20px ${gold}44`, lineHeight:1.1 }}>
                  {ar ? "صلاتي" : "SALATY"}
                </div>
                <div style={{ fontSize:11, letterSpacing: ar?"0.04em":"0.25em", color:txtSub, textTransform: ar?"none":"uppercase", marginTop:2 }}>
                  {ar ? "مواقيت الصلاة" : "صلاتي · Prayer Times"}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setLang(ar?"en":"ar")} style={{ ...iconBtnStyle, padding:"7px 13px", color:gold, fontSize:13, fontWeight:700, fontFamily:"sans-serif" }}>
                {ar ? "EN" : "ع"}
              </button>
              <button onClick={() => setDarkMode(!darkMode)} style={iconBtnStyle}>{darkMode?"☀️":"🌙"}</button>
              <button onClick={() => setShowSettings(true)} style={iconBtnStyle}>⚙️</button>
            </div>
          </div>

          {/* ── DATE CARD ── */}
          <div style={{ ...card({ padding:"16px 20px", marginBottom:14 }) }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
              <div>
                {cityName && (
                  <div style={{ fontSize:12, color:txtSub, letterSpacing:"0.06em", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background:gold, boxShadow:`0 0 6px ${gold}`, display:"inline-block" }} />
                    {cityName}
                  </div>
                )}
                <div style={{ fontSize:15, fontWeight:600, fontFamily: ar?"'Tajawal',sans-serif":enFont }}>{gregorianLabel}</div>
              </div>
              <div style={{ textAlign: ar?"left":"right" }}>
                <div style={{ fontSize:10, color:txtSub, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>{ar?"التاريخ الهجري":"Hijri"}</div>
                <div style={{ fontSize:14, color:gold, fontFamily: ar?"'Amiri',serif":"'Cinzel',serif", fontStyle: ar?"normal":"italic" }}>{hijriLabel}</div>
              </div>
            </div>
          </div>

          {/* ── NEXT PRAYER ── */}
          {!loading && nextPrayer && (
            <div style={{ ...card({ background: darkMode?"linear-gradient(135deg,rgba(201,168,76,0.13) 0%,rgba(201,168,76,0.04) 100%)":"linear-gradient(135deg,rgba(201,168,76,0.22) 0%,rgba(201,168,76,0.08) 100%)", border:`1px solid ${gold}55`, textAlign:"center", padding:"28px 20px", marginBottom:14, position:"relative", overflow:"hidden" }) }}>
              <div style={{ position:"absolute", bottom:-15, right:-15, fontSize:90, opacity:0.05, pointerEvents:"none", lineHeight:1 }}>☽</div>
              <div style={{ fontSize:11, letterSpacing:"0.22em", textTransform:"uppercase", color:txtSub, marginBottom:8 }}>
                {ar?"الصلاة القادمة":"Next Prayer"}
              </div>
              <div style={{ fontSize: ar?46:34, fontWeight:700, color:gold, fontFamily: ar?"'Amiri',serif":"'Cinzel',serif", textShadow:`0 0 24px ${gold}55`, lineHeight:1, marginBottom:4 }}>
                {PRAYER_META[nextPrayer].icon} {ar?PRAYER_META[nextPrayer].ar:nextPrayer}
              </div>
              {prayerTimes && <div style={{ fontSize:14, color:txtSub, marginBottom:14 }}>{prayerTimes[nextPrayer]}</div>}
              {countdown && (
                <div style={{ display:"flex", justifyContent:"center", gap:10 }}>
                  {[countdown.h > 0 && [countdown.h, ar?"سا":"H"], [countdown.m, ar?"دق":"M"], [countdown.s, ar?"ثا":"S"]].filter(Boolean).map(([val, lbl], i) => (
                    <div key={i} style={{ background: darkMode?"rgba(201,168,76,0.1)":"rgba(201,168,76,0.15)", border:`1px solid ${gold}44`, borderRadius:14, padding:"10px 16px", minWidth:60 }}>
                      <div style={{ fontSize:32, fontWeight:700, color:gold, fontFamily:"'Cinzel',monospace", lineHeight:1, textShadow:`0 0 20px ${gold}55` }}>
                        {String(val).padStart(2,"0")}
                      </div>
                      <div style={{ fontSize:10, color:txtSub, letterSpacing:"0.12em", marginTop:4 }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ADHAN BANNER ── */}
          <div onClick={adhanPlaying?stopAdhan:undefined} style={{ ...card({ padding:"12px 18px", marginBottom:14, display:"flex", alignItems:"center", gap:12, cursor: adhanPlaying?"pointer":"default" }) }}>
            <span style={{ fontSize:22 }}>{adhanPlaying?"🔊":adhanEnabled?"🔔":"🔕"}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, fontFamily: ar?"'Tajawal',sans-serif":enFont }}>
                {adhanPlaying?(ar?"جارٍ الأذان…":"Adhan playing…"):adhanEnabled?(ar?"الأذان مفعّل":"Adhan enabled"):(ar?"الأذان متوقف":"Adhan disabled")}
              </div>
              <div style={{ fontSize:11, color:txtSub, marginTop:2 }}>
                {adhanPlaying?(ar?"اضغط لإيقاف الأذان":"Tap to stop"):(ar?"يُشغَّل تلقائياً عند دخول وقت الصلاة":"Auto-plays at prayer time")}
              </div>
            </div>
            {adhanPlaying && <span style={{ fontSize:18, color:txtSub }}>⏹</span>}
          </div>

          {/* ── NOTIF BANNER ── */}
          {notifPerm === "default" && (
            <div style={{ ...card({ padding:"12px 18px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }) }}>
              <div style={{ fontSize:14, fontFamily: ar?"'Tajawal',sans-serif":enFont }}>🔔 {ar?"فعّل الإشعارات لتذكيرات الصلاة":"Enable notifications for reminders"}</div>
              <button onClick={async()=>setNotifPerm(await Notification.requestPermission())} style={{ background:gold, color:"#0a0f1e", border:"none", borderRadius:10, padding:"8px 16px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily: ar?"'Tajawal',sans-serif":enFont }}>{ar?"تفعيل":"Enable"}</button>
            </div>
          )}

          {/* ── ERROR ── */}
          {error && <div style={{ ...card({ borderColor:"rgba(255,80,80,0.3)", padding:"12px 18px", marginBottom:14, fontSize:14, color:"#ff8888", fontFamily: ar?"'Tajawal',sans-serif":enFont }) }}>⚠️ {error}</div>}

          {/* ── TABS ── */}
          <div style={{ display:"flex", gap:4, marginBottom:14, background:cardBg, borderRadius:14, padding:4, border:`1px solid ${cardBdr}` }}>
            {[["today", ar?"🕐 الصلوات":"🕐 Prayers"], ["tracker", ar?"✅ المتابعة":"✅ Tracker"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setTab(id)} style={{ flex:1, padding:"9px 0", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, letterSpacing: ar?"0.02em":"0.1em", fontFamily: ar?"'Tajawal',sans-serif":"'Cinzel',serif", fontWeight:tab===id?700:400, background:tab===id?gold:"transparent", color:tab===id?"#0a0f1e":txtSub, transition:"all 0.2s" }}>{lbl}</button>
            ))}
          </div>

          {/* ── TODAY ── */}
          {tab === "today" && (
            <div style={{ ...card({ padding:"8px 20px" }) }}>
              {loading ? (
                <div style={{ textAlign:"center", padding:"40px 0" }}>
                  <div style={{ fontSize:36, marginBottom:12, display:"inline-block", animation:"spin 2s linear infinite" }}>☽</div>
                  <div style={{ color:txtSub, letterSpacing:"0.1em", fontFamily: ar?"'Tajawal',sans-serif":enFont }}>{ar?"جارٍ تحميل المواقيت…":"Loading prayer times…"}</div>
                </div>
              ) : prayerTimes ? (
                PRAYERS.map((p, i) => {
                  const isNext = p === nextPrayer, isSun = p === "Sunrise";
                  return (
                    <div key={p} style={{ display:"flex", alignItems:"center", padding: isNext?"14px 12px":"13px 0", borderBottom: i===PRAYERS.length-1?"none":`1px solid ${cardBdr}`, gap:12, background: isNext?(darkMode?"rgba(201,168,76,0.09)":"rgba(201,168,76,0.14)"):"transparent", borderRadius: isNext?12:0, margin: isNext?"4px -8px":"0", border: isNext?`1px solid ${gold}44`:undefined, opacity: isSun?0.6:1, transition:"all 0.2s" }}>
                      <span style={{ fontSize:22, width:30, textAlign:"center", flexShrink:0 }}>{PRAYER_META[p].icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize: ar?19:17, fontWeight:600, fontFamily: ar?"'Amiri',serif":enFont }}>{ar?PRAYER_META[p].ar:p}</span>
                          {isNext && <span style={{ fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", padding:"2px 8px", borderRadius:20, border:`1px solid ${gold}`, color:gold, fontFamily:"'Cinzel',serif" }}>{ar?"التالية":"Next"}</span>}
                        </div>
                        {!isSun && (
                          <div style={{ height:2, borderRadius:2, background: darkMode?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)", marginTop:5, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${getProgress(p)}%`, background:`linear-gradient(90deg,${gold},${goldLight})`, borderRadius:2, transition:"width 1s linear" }} />
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize:15, color: isNext?goldLight:gold, fontFamily:"'Cinzel',monospace", letterSpacing:"0.05em", minWidth:68, textAlign: ar?"left":"right" }}>{prayerTimes[p]||"—"}</span>
                      {!isSun && (
                        <button onClick={()=>setReminders(prev=>({...prev,[p]:!prev[p]}))} style={{ background:"none", border:"none", cursor:"pointer", fontSize:17, opacity: reminders[p]?1:0.25, transition:"opacity 0.2s", color:gold, padding:4, flexShrink:0 }}>🔔</button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ color:txtSub, textAlign:"center", padding:40 }}>{ar?"لا توجد بيانات":"No data available"}</div>
              )}
            </div>
          )}

          {/* ── TRACKER ── */}
          {tab === "tracker" && (
            <div style={{ ...card({ padding:"20px" }) }}>
              <div style={{ fontSize:12, color:txtSub, letterSpacing: ar?"0.04em":"0.15em", marginBottom:16, textTransform: ar?"none":"uppercase", fontFamily: ar?"'Tajawal',sans-serif":enFont }}>
                {ar?"متابعة صلوات اليوم":"Track Today's Prayers"}
              </div>
              {TRACKABLE.map((p,i) => (
                <div key={p} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0", borderBottom: i<TRACKABLE.length-1?`1px solid ${cardBdr}`:"none" }}>
                  <button onClick={()=>setCompleted(prev=>({...prev,[p]:!prev[p]}))} style={{ width:30, height:30, borderRadius:"50%", border:`2px solid ${completed[p]?gold:cardBdr}`, background: completed[p]?gold:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0, transition:"all 0.2s", boxShadow: completed[p]?`0 0 12px ${gold}55`:"none" }}>
                    {completed[p]?"✓":""}
                  </button>
                  <span style={{ fontSize:20 }}>{PRAYER_META[p].icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize: ar?18:16, fontWeight:600, textDecoration: completed[p]?"line-through":"none", color: completed[p]?txtSub:txt, transition:"all 0.2s", fontFamily: ar?"'Amiri',serif":enFont }}>{ar?PRAYER_META[p].ar:p}</div>
                    <div style={{ fontSize:12, color:txtSub, marginTop:1 }}>{prayerTimes?prayerTimes[p]:""}</div>
                  </div>
                  {completed[p] && <span style={{ fontSize:11, color:gold, letterSpacing:"0.06em" }}>{ar?"✨ صلّيت":"✨ Done"}</span>}
                </div>
              ))}
              <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid ${cardBdr}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color:txtSub, fontFamily: ar?"'Tajawal',sans-serif":enFont }}>
                  {Object.values(completed).filter(Boolean).length} / {TRACKABLE.length} {ar?"مكتملة":"completed"}
                </span>
                <div style={{ height:8, flex:"0 0 140px", borderRadius:4, background: darkMode?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(Object.values(completed).filter(Boolean).length/TRACKABLE.length)*100}%`, background:`linear-gradient(90deg,${gold},${goldLight})`, borderRadius:4, transition:"width 0.4s" }} />
                </div>
              </div>
              {Object.values(completed).filter(Boolean).length === TRACKABLE.length && (
                <div style={{ marginTop:14, textAlign:"center", fontSize:15, color:gold, fontFamily: ar?"'Amiri',serif":"'Cinzel',serif" }}>
                  {ar?"أتممت جميع صلوات اليوم 🌙":"All prayers completed today 🌙"}
                </div>
              )}
            </div>
          )}

          {/* ── FOOTER ── */}
          <div style={{ textAlign:"center", marginTop:28 }}>
            <div style={{ fontSize:12, color:txtSub, letterSpacing:"0.04em", marginBottom:6, fontFamily: ar?"'Tajawal',sans-serif":enFont }}>
              {ar?"مواقيت الصلاة مقدَّمة من AlAdhan API · ":"Prayer times powered by AlAdhan API · "}
              {CALC_METHODS.find(m=>m.id===calcMethod)?.[ar?"ar":"en"]}
            </div>
            <div style={{ fontSize:12, color:txtSub, fontFamily: ar?"'Tajawal',sans-serif":enFont }}>
              © 2026 YOUNESS OUJDID ·{" "}
              <a href="https://youness-oujdid.github.io/" target="_blank" rel="noopener noreferrer" style={{ color:gold }}>youness-oujdid.github.io</a>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SETTINGS
        ═══════════════════════════════════════════════════════ */}
        {showSettings && (
          <div onClick={()=>setShowSettings(false)} style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
            <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:820, background:settingsBg, borderRadius:"24px 24px 0 0", padding:"28px 24px 52px", border:`1px solid ${cardBdr}`, borderBottom:"none", boxShadow:"0 -20px 60px rgba(0,0,0,0.5)", maxHeight:"88vh", overflowY:"auto", direction: ar?"rtl":"ltr" }}>

              <div style={{ fontSize: ar?22:18, fontWeight:700, color:gold, fontFamily: ar?"'Amiri',serif":"'Cinzel',serif", marginBottom:24, textAlign:"center", letterSpacing: ar?"0.02em":"0.1em" }}>
                ⚙️ {ar?"الإعدادات":"Settings"}
              </div>

              {/* Language */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:16, borderBottom:`1px solid ${cardBdr}`, marginBottom:16 }}>
                <label style={sLabel}>{ar?"اللغة":"Language"}</label>
                <div style={{ display:"flex", gap:6 }}>
                  {[["ar","العربية"],["en","English"]].map(([code,lbl])=>(
                    <button key={code} onClick={()=>setLang(code)} style={{ padding:"7px 14px", borderRadius:10, border:`1px solid ${lang===code?gold:cardBdr}`, background: lang===code?`${gold}22`:"transparent", color: lang===code?gold:txtSub, cursor:"pointer", fontSize:13, fontFamily:"sans-serif", transition:"all 0.2s" }}>{lbl}</button>
                  ))}
                </div>
              </div>

              {/* Dark mode */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:16, borderBottom:`1px solid ${cardBdr}`, marginBottom:16 }}>
                <label style={sLabel}>{ar?"الوضع المظلم":"Dark Mode"}</label>
                <Toggle on={darkMode} onToggle={()=>setDarkMode(!darkMode)} />
              </div>

              {/* Calc method */}
              <div style={{ marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${cardBdr}` }}>
                <label style={sLabel}>{ar?"طريقة الحساب":"Calculation Method"}</label>
                <select value={calcMethod} onChange={e=>setCalcMethod(Number(e.target.value))} style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1px solid ${cardBdr}`, background: darkMode?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.8)", color:txt, fontSize:14, fontFamily: ar?"'Tajawal',sans-serif":enFont, cursor:"pointer", direction: ar?"rtl":"ltr" }}>
                  {CALC_METHODS.map(m=><option key={m.id} value={m.id}>{ar?m.ar:m.en}</option>)}
                </select>
              </div>

              {/* Adhan */}
              <div style={{ marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${cardBdr}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <label style={sLabel}>{ar?"الأذان التلقائي":"Auto Adhan"}</label>
                  <Toggle on={adhanEnabled} onToggle={()=>setAdhanEnabled(!adhanEnabled)} />
                </div>
                {adhanEnabled && TRACKABLE.map(p=>(
                  <div key={p} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${cardBdr}` }}>
                    <span style={{ fontSize:14, fontFamily: ar?"'Tajawal',sans-serif":enFont }}>{PRAYER_META[p].icon} {ar?PRAYER_META[p].ar:p}</span>
                    <SmallToggle on={adhanPrayers[p]} onToggle={()=>setAdhanPrayers(prev=>({...prev,[p]:!prev[p]}))} />
                  </div>
                ))}
              </div>

              {/* Reminder offset */}
              <div style={{ marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${cardBdr}` }}>
                <label style={sLabel}>{ar?`التذكير قبل الصلاة: ${reminderOffset} دقيقة`:`Reminder: ${reminderOffset} min before`}</label>
                <input type="range" min={1} max={60} value={reminderOffset} onChange={e=>setReminderOffset(Number(e.target.value))} style={{ width:"100%", accentColor:gold }} />
              </div>

              {/* Notification toggles */}
              <div style={{ marginBottom:20 }}>
                <label style={sLabel}>{ar?"تذكيرات الصلاة (إشعارات)":"Prayer Reminders (Push Notifications)"}</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {TRACKABLE.map(p=>(
                    <button key={p} onClick={()=>setReminders(prev=>({...prev,[p]:!prev[p]}))} style={{ padding:"8px 14px", borderRadius:20, border:`1px solid ${reminders[p]?gold:cardBdr}`, background: reminders[p]?`${gold}22`:"transparent", color: reminders[p]?gold:txtSub, cursor:"pointer", fontSize:13, fontFamily: ar?"'Tajawal',sans-serif":enFont, transition:"all 0.2s" }}>
                      {PRAYER_META[p].icon} {ar?PRAYER_META[p].ar:p}
                    </button>
                  ))}
                </div>
              </div>

              {notifPerm !== "granted" && (
                <button onClick={async()=>setNotifPerm(await Notification.requestPermission())} style={{ width:"100%", padding:14, background:gold, color:"#0a0f1e", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily: ar?"'Tajawal',sans-serif":enFont, marginBottom:12 }}>
                  🔔 {ar?"تفعيل إشعارات المتصفح":"Enable Browser Notifications"}
                </button>
              )}

              <button onClick={()=>setShowSettings(false)} style={{ width:"100%", padding:12, background:"transparent", color:txtSub, border:`1px solid ${cardBdr}`, borderRadius:14, fontSize:14, cursor:"pointer", fontFamily: ar?"'Tajawal',sans-serif":enFont }}>
                {ar?"إغلاق":"Close"}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        body { overflow-x:hidden; -webkit-tap-highlight-color:transparent; overscroll-behavior:none; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.3); border-radius:2px; }
        select option { background:#0d1527; color:#f0e6cc; }
      `}</style>
    </>
  );
}
