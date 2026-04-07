# Data Center Thermodynamics Simulator

An interactive, physics-based simulation of hyperscale data center energy dynamics modelled on the Loudoun County, Virginia corridor — the densest concentration of data center capacity on Earth.

Drag cooling modules onto a virtual data center floor, adjust ambient temperature across the McLean/Ashburn seasonal range, and watch PUE and heat rejection respond in real time.

---

## Features

- **Drag-and-drop rack deployment** — place NVIDIA GB200 NVL72 racks (120 kW each) using three cooling strategies
- **Live thermodynamic metrics** — System PUE, total facility power, and heat rejected update on every change
- **Seasonal temperature simulation** — slider from McLean VA winter trough (−2.2 °C) to summer peak (30.5 °C)
- **D3.js visualisations** — arc gauges for PUE, heat, and temperature; rack-level PUE heatmap
- **Rich hover tooltips** — every metric includes a contextual explanation of the formula and real-world significance
- **°C / °F toggle** — switch temperature display units at any time; all math runs internally in Celsius
- **Per-rack cooling swap** — change any deployed rack's cooling type via dropdown to compare strategies live

---

## Tech Stack

| Layer | Library |
|-------|---------|
| UI framework | React 18 + TypeScript |
| Build tool | Vite |
| Drag and drop | dnd-kit |
| Data visualisation | D3.js v7 |
| Global state | Zustand |
| Unit tests | Vitest |

---

## Getting Started

**Prerequisites:** Node.js ≥ 18

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:5173

# Run unit tests (23 tests)
npm test

# Production build
npm run build
```

---

## Project Structure

```
src/
├── data/
│   └── constants.json        # Climate, hardware, and cooling profile constants
├── logic/
│   ├── thermoCalc.ts         # Thermodynamic engine (PUE curves, heat rejection math)
│   ├── store.ts              # Zustand global state store
│   └── tempUtils.ts          # °C ↔ °F conversion helpers
├── components/
│   ├── HomePage.tsx          # Landing page with application guide
│   ├── CoolingPalette.tsx    # Draggable cooling module palette
│   ├── DataCenterFloor.tsx   # Droppable rack floor grid
│   ├── MetricsDashboard.tsx  # D3 gauges, temperature slider, heatmap
│   └── Tooltip.tsx           # Shared hover tooltip component
├── App.tsx                   # Root layout, DndContext, homepage gate
├── App.css                   # All styles
└── main.tsx                  # React DOM entry point
```

---

## Thermodynamic Model

### PUE Formula

```
PUE(coolingType, temp) = baseline + penaltyK × max(0, temp − idealTemp)
```

| Cooling Type | Baseline PUE | Ideal Temp | Penalty / °C above ideal |
|---|---|---|---|
| CRAC (air) | 1.45 | 15 °C | +0.015 |
| Hot-Aisle Containment | 1.25 | 22 °C | +0.010 |
| Direct-to-Chip Liquid | 1.05 | 30 °C | +0.002 |

### Heat Rejection Identity

Per the Second Law of Thermodynamics, virtually all electrical power drawn by the facility is ultimately rejected as thermal energy:

```
Heat Rejected (MW) ≈ Total Facility Power (MW) = IT Load × System PUE
```

### Facility Metrics

```
totalITLoadMW       = Σ rack.loadMW
totalFacilityPowerMW = Σ (rack.loadMW × PUE(rack.coolingType, outsideTempC))
systemPUE           = totalFacilityPowerMW / totalITLoadMW
heatRejectedMW      = totalFacilityPowerMW
```

---

## Hardware Baseline

**NVIDIA GB200 NVL72**
- 72 × Blackwell B200 GPUs per chassis
- 120 kW continuous power draw
- 120 kW heat output
- Direct-to-chip liquid cooling mandatory at this density
- Source: NVIDIA Blackwell Architecture & GB200 NVL72 Technical Specifications (2024/2025)

---

## Climate Baseline

Location: McLean, VA (NOAA proxy for Ashburn / Loudoun County)

| Season | Temperature |
|--------|-------------|
| Winter trough | −2.2 °C (28 °F) |
| Annual average | 14.0 °C (57 °F) |
| Summer peak | 30.5 °C (87 °F) |

Source: NOAA Historical Climatology Data

---

## Data Sources & Citations

1. **NVIDIA GB200 NVL72** — Blackwell Architecture Technical Specifications (2024/2025)
2. **PUE baselines** — Uptime Institute Annual Global Data Center Survey (2023/2024)
3. **Temperature thresholds** — ASHRAE TC 9.9 Environmental Guidelines for Datacom Equipment
4. **Climate data** — NOAA Historical Climatology, McLean VA station
5. **Facility baseline** — Loudoun County, VA data center campus density modelling

---

## Running Tests

```bash
npm test
```

The test suite (`src/tests/thermoCalc.test.ts`) covers 23 cases including:

- PUE baseline values at ideal temperatures
- CRAC vs. Liquid cooling degradation at McLean summer peak (30.5 °C)
- Seasonal delta comparison (winter vs. summer) across all cooling types
- Facility-level weighted PUE for mixed fleets
- Thermodynamic identity: heat rejected = facility power
- Edge cases: below-ideal temperatures, empty rack arrays
