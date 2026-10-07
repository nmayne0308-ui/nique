# Hurricane Ready

Offline-capable hurricane preparedness app: Before/During/After checklist, arrival countdown,
supply inventory, live National Weather Service alerts, and a printable household plan.
Checklist content is paraphrased from the American Red Cross Hurricane Preparedness Checklist
(<https://www.redcross.org/prepare>). It is a memory aid, not a substitute for instructions
from local officials.

## Run locally

    python3 -m http.server 8000   # then open http://localhost:8000

No build step or dependencies. Service workers need `localhost` or HTTPS.

## Deploy

Pushes to `main`/`master` deploy via `.github/workflows/pages.yml`. One-time setup:
repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Notes
- Data (checklist ticks, supplies, plan) is stored only in your browser's localStorage.
- Reminders fire only while the app is open; alerts need internet and a saved location.
