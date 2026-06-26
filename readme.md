# MediTrack — Medication Reminder & Health Tracker

**UN Sustainable Development Goal 3: Good Health and Well-Being**

MediTrack is a free, browser-based web application that helps patients managing chronic conditions (diabetes, hypertension, etc.) track their daily medications, log vitals, monitor water intake, and visualise health trends over time.

---

## Live Demo

> Deploy to GitHub Pages and add your link here:  
> `https://YOUR_USERNAME.github.io/meditrack-sdg3`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 (custom properties, responsive grid) |
| Logic | Vanilla JavaScript ES6+ |
| Charts | Chart.js 4.4.1 (CDN) |
| Icons | Tabler Icons 3.x (CDN) |
| Storage | localStorage (browser) |
| Hosting | GitHub Pages |

No frameworks, no build tools, no dependencies to install.

---

## Project Structure

```
meditrack/
├── index.html   ← Page structure and all HTML
├── style.css    ← All styling and design tokens
├── app.js       ← All application logic
└── README.md    ← This file
```

---

## Features

- **Dashboard** — daily medication checklist, water tracker, weekly adherence heatmap, health tips
- **Medications** — add, view, and delete medications with dose, frequency, time, and food instructions
- **Health Log** — log BP, blood glucose, weight, mood, and symptoms with date-stamped history
- **Reports** — Chart.js visualisations for monthly adherence and blood pressure trends
- **Profile** — personal details, medical conditions, allergies, emergency contact, reminder settings
- **localStorage persistence** — all data is saved locally and survives page refreshes

---

## How to Run
1. Download or clone this repository
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
3. No server or internet required (charts need CDN)


---

## SDG Alignment

This project addresses **SDG 3.4** — reducing premature mortality from non-communicable diseases through prevention and treatment. Medication non-adherence is a leading cause of preventable hospitalisation worldwide. MediTrack directly tackles this gap with a free, accessible reminder and tracking tool.

---

## License

MIT — free to use, modify, and distribute.