# Tyst Alarm

Liten webbapp som håller koll på din position och ger ett **tyst alarm** (vibration +
blinkande skärm, inget ljud) när du är framme vid din destination. Bra för att slumra
på bussen eller tåget utan att väcka hela vagnen.

## Använd

Öppna `index.html` via en webbserver (positionering kräver HTTPS eller localhost):

```
python3 -m http.server 8000
# → http://localhost:8000
```

Publicera lika gärna mappen på GitHub Pages, Netlify eller liknande.

1. Tillåt platsåtkomst.
2. Sök upp destinationen (adress eller platsnamn).
3. Välj larmradie och starta bevakningen — larmet går när du är inom radien.

Destinationen sparas i `localStorage`, så den finns kvar efter omladdning.

## Om

- Ingen build, inga beroenden — ren HTML/CSS/JS, ca 250 rader.
- Fungerar som PWA (installerbar, app-skalet cachas av `sw.js`).
- Adressökning via [Nominatim](https://nominatim.openstreetmap.org) (OpenStreetMap);
  övrigt sker helt lokalt i webbläsaren — ingen position lämnar enheten.
- Skärmen hålls vaken med Wake Lock API under bevakning. Håll fliken öppen —
  webbläsare stryper positionsuppdateringar i bakgrunden.
- Vibrationen är avsiktligt påträngande: ~10 sekunder skakning per varv med bara
  korta pauser, i loop tills du trycker "Stäng av". Kräver Android/Chrome;
  på iOS blir alarmet enbart visuellt.

## Filer

| Fil | Innehåll |
| --- | --- |
| `index.html` | Gränssnittet |
| `app.js` | Position, sökning, avståndsberäkning, alarm |
| `style.css` | Stil |
| `sw.js` | Service worker för offlinestart |
| `manifest.json`, `icon.svg` | PWA-metadata |
