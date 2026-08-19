const $ = id => document.getElementById(id);
const store = {
  get: () => { try { return JSON.parse(localStorage.tystAlarm); } catch { return null; } },
  set: v => localStorage.tystAlarm = JSON.stringify(v)
};

let here = null;      // {lat, lon}
let dest = null;      // {lat, lon, name}
let watchId = null;
let wakeLock = null;
let buzzer = null;

/* ---------- avstånd ---------- */
function distance(a, b) {
  const R = 6371000, rad = d => d * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const fmt = m => m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;

/* ---------- position ---------- */
function onPosition(p) {
  here = { lat: p.coords.latitude, lon: p.coords.longitude };
  $('pos').textContent =
    `${here.lat.toFixed(5)}, ${here.lon.toFixed(5)} (±${Math.round(p.coords.accuracy)} m)`;
  update();
}
const onError = e => $('pos').textContent = 'Position misslyckades: ' + e.message;

$('locate').onclick = () =>
  navigator.geolocation.getCurrentPosition(onPosition, onError, { enableHighAccuracy: true });

/* ---------- destination ---------- */
$('searchForm').onsubmit = async e => {
  e.preventDefault();
  const q = $('q').value.trim();
  if (!q) return;
  const list = $('results');
  list.innerHTML = '<li class="muted">Söker…</li>';
  try {
    const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=' +
                encodeURIComponent(q);
    const hits = await (await fetch(url, { headers: { Accept: 'application/json' } })).json();
    list.innerHTML = '';
    if (!hits.length) { list.innerHTML = '<li class="muted">Inga träffar.</li>'; return; }
    for (const h of hits) {
      const li = document.createElement('li');
      li.textContent = h.display_name;
      li.tabIndex = 0;
      const pick = () => {
        setDest({ lat: +h.lat, lon: +h.lon, name: h.display_name });
        list.innerHTML = '';
        $('q').value = '';
      };
      li.onclick = pick;
      li.onkeydown = ev => { if (ev.key === 'Enter') pick(); };
      list.append(li);
    }
  } catch {
    list.innerHTML = '<li class="muted">Sökningen misslyckades (ingen nätverkskontakt?).</li>';
  }
};

function setDest(d) {
  dest = d;
  $('dest').textContent = '📍 ' + d.name;
  store.set({ dest, radius: $('radius').value });
  update();
}

$('radius').onchange = () => {
  if (dest) store.set({ dest, radius: $('radius').value });
  update();
};

/* ---------- bevakning ---------- */
function update() {
  $('start').disabled = !dest || watchId !== null;
  if (!dest || !here) { $('dist').textContent = '–'; return; }
  const d = distance(here, dest);
  $('dist').textContent = fmt(d);
  if (watchId !== null && d <= +$('radius').value) fire();
}

async function start() {
  if (!dest) return;
  watchId = navigator.geolocation.watchPosition(onPosition, onError, {
    enableHighAccuracy: true, maximumAge: 5000, timeout: 30000
  });
  $('start').hidden = true;
  $('stop').hidden = false;
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {}
  update();
}

function stop() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  wakeLock?.release().catch(() => {});
  wakeLock = null;
  $('start').hidden = false;
  $('stop').hidden = true;
  $('start').disabled = !dest;
}

/* ---------- tyst alarm ---------- */
function fire() {
  if (!$('alarm').hidden) return;
  stop();
  $('alarm').hidden = false;
  const buzz = () => navigator.vibrate?.([400, 200, 400, 200, 400, 800]);
  buzz();
  buzzer = setInterval(buzz, 2400);
}

$('dismiss').onclick = () => {
  clearInterval(buzzer);
  navigator.vibrate?.(0);
  $('alarm').hidden = true;
};

$('start').onclick = start;
$('stop').onclick = stop;

/* skärmlåset släpps när fliken döljs – ta tillbaka det */
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && watchId !== null && !wakeLock) {
    try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {}
  }
});

/* ---------- start ---------- */
const saved = store.get();
if (saved?.dest) {
  $('radius').value = saved.radius ?? '500';
  setDest(saved.dest);
}
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(onPosition, onError, { enableHighAccuracy: true });
} else {
  $('pos').textContent = 'Positionering stöds inte i denna webbläsare.';
}
navigator.serviceWorker?.register('sw.js').catch(() => {});
