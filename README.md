# Open Sports TV

A free static sports-only live TV player for public/open sports channels and official sports links.

## What it does

- Loads public IPTV-org sports channels
- Plays HLS / M3U8 streams in the browser using hls.js
- Includes official sports links for sources that are more reliable on their own websites
- Includes:
  - Sports · IPTV-org
  - Football/Soccer
  - Motorsport
  - Combat/Fight
  - Outdoor/Extreme
  - Official Sports Links
- Includes search
- Includes filters
- Saves favourites locally in the browser
- Saves recently watched channels locally in the browser
- Includes Stadium Mode
- Includes PWA support
- Runs on GitHub Pages
- No backend
- No login
- No paid services

## Sources

- IPTV-org sports category playlist
- Official sports links including Red Bull TV, Olympics, FIFA+, UEFA.tv, FIBA, World Athletics, SLS and World Surf League
- hls.js

## Project structure

```text
open-sports-tv/
  index.html
  style-v1.css
  app-v1.js
  README.md
  icon.svg
  manifest.json
  service-worker.js
```

Fallback copies are also included:

```text
style.css
app.js
```

## Deploy on GitHub Pages

1. Create a public GitHub repository called `open-sports-tv`.
2. Upload all files to the root of the repository.
3. Go to **Settings**.
4. Go to **Pages**.
5. Select:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. Save.

Your app will be available at:

```text
https://yourusername.github.io/open-sports-tv/
```

## Notes

This app is for public/free streams and official sports pages only. It does not include pay-TV, pirated sports streams, protected streams, or unauthorized premium event broadcasts.

Sports channels are often more fragile than general TV channels because live rights are tightly controlled. If a channel does not play in-browser, use the official link source where possible.
