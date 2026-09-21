# NDRF / MHA — Hazard Red-Zone & Relocation Decision Support System

**Smart India Hackathon 2026 — Problem Statement ID: 26191**
Category: Software · Theme: Disaster Management · Organization: Ministry of Home Affairs (NDRF)

An explainable, real-time decision support prototype that classifies habitations into
hazard-based Red/Amber/Green zones, audits shelter carrying capacity against Sphere
humanitarian standards, generates a vulnerability-ranked evacuation list, and simulates
multi-channel emergency alerts — all on a live GIS tactical dashboard.

Pilot region: the Meppadi–Chooralmala–Mundakkai corridor in Wayanad District, Kerala,
with 10 seeded habitations and 5 candidate relocation shelters.

## Quick start

**Requirements:** Python 3.10+

```bash
# Windows
run.bat

# macOS / Linux
chmod +x run.sh
./run.sh
```

This installs dependencies and starts the server at **http://127.0.0.1:8000**, which
serves both the API and the dashboard.

Or run it manually:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## What to demo

1. **Baseline view** — the map loads all 10 habitations colour-coded by risk zone, with
   the 5 shelters shown as blue dots. The right panel shows the priority-ranked
   evacuation list.
2. **Rainfall simulation** — drag the rainfall slider (try 150–180mm) and hit
   *Apply Rainfall Across Region*. Watch habitations flip to Red in real time over the
   WebSocket connection, and check the **Alerts** tab for the auto-generated
   SMS/WhatsApp/NDMA Sachet-style dispatch.
3. **Explainability** — click any habitation marker or list row to open its detail
   modal: the exact weighted formula and a bar chart of the five risk factors
   (rainfall, slope, geology, drainage, flood) are shown — nothing is a black box.
4. **Shelter capacity** — the **Shelters** tab shows each site's Sphere-standard-based
   max safe capacity, live occupancy bar, and days of water remaining.
5. **Evacuation flow** — from a habitation's detail modal, click *Order Evacuation* to
   move its population into its nearest viable shelter and watch that shelter's
   occupancy/status update immediately.
6. **Reset** — *Reset to Baseline* restores the initial seeded state for a repeat demo.

## Architecture

```
backend/
  main.py              FastAPI app: REST endpoints + WebSocket broadcast
  models.py             Pydantic schemas (Habitation, ShelterSite, Alert, ...)
  engines/
    hazard_engine.py      Weighted 0-100 hazard risk score -> Red/Amber/Green
    capacity_engine.py    Sphere-standard shelter carrying capacity
    priority_engine.py    Vulnerability-weighted evacuation priority ranking
    relocation_engine.py  Haversine-nearest shelter assignment
    alert_engine.py       Simulated SMS / WhatsApp / NDMA Sachet alert generation
    weather_service.py    Open-Meteo live rainfall, with offline fallback
  data/seed_data.json    Pilot region seed data (10 habitations, 5 shelters)
  test_engines.py         Unit tests for the five engines
  test_integration.py     End-to-end test against a running server

frontend/
  index.html             Dashboard shell (Tailwind + Leaflet + Chart.js)
  app.js                 Map rendering, WebSocket sync, tabs, modal, actions
  style.css               Tactical dark-theme styling
```

## Explainable scoring formulas

**Hazard Risk** (0–100, per habitation):
`Risk = 0.30·Rainfall + 0.25·Slope + 0.20·Geological + 0.15·Drainage + 0.10·Flood`
`> 70 → RED`, `40–70 → AMBER`, `< 40 → GREEN`

**Evacuation Priority Index** (0–100, per habitation):
`Priority = 0.40·Hazard + 0.25·Demographic vulnerability + 0.20·Road/bridge isolation + 0.15·Housing fragility`

**Shelter carrying capacity** (Sphere Humanitarian Standard):
`Max safe occupancy = (usable area × safety multiplier) / 3.5 m² per person`

## Running the tests

```bash
cd backend
python -m unittest test_engines.py -v

# with the server already running in another terminal:
python test_integration.py
```

## Roadmap beyond the hackathon

- Swap Open-Meteo for live IMD / CWC / NDMA Sachet CAP feeds
- Calibrate the risk-scoring weights against historical disaster records
- Native mobile app for field responders
- Multi-district / state-wide rollout
