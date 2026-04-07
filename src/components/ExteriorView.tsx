import React from 'react';
import { useSimulationStore } from '../logic/store';
import { toF } from '../logic/tempUtils';

// Isometric building geometry constants
const CX = 450; // center x
const CY = 260; // building base center y

// Isometric projection helpers
function iso(gx: number, gy: number, gz: number): [number, number] {
  return [CX + (gx - gy) * 40, CY + (gx + gy) * 20 - gz * 30];
}

function isoStr(...pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x},${y}`).join(' ');
}

// Single animated plume path
function Plume({ x, y, height, opacity, delay }: {
  x: number; y: number; height: number; opacity: number; delay: string;
}) {
  const w = 18;
  const d = `M${x},${y} C${x - w},${y - height * 0.3} ${x + w},${y - height * 0.6} ${x},${y - height}`;
  return (
    <path
      className="plume"
      d={d}
      fill="none"
      stroke="url(#plume-grad)"
      strokeWidth={w * 1.6}
      strokeLinecap="round"
      style={{ '--plume-opacity': opacity, animationDelay: delay } as React.CSSProperties}
      opacity={opacity}
    />
  );
}

export function ExteriorView() {
  const { metrics, outsideTempC, useFahrenheit } = useSimulationStore();
  const { heatRejectedMW, totalFacilityPowerMW, totalWaterLitersPerDay } = metrics;

  // Reactive intensities
  const plumeIntensity = Math.min(1, heatRejectedMW / 20);
  const waterIntensity = Math.min(1, totalWaterLitersPerDay / 50000);
  const powerIntensity = Math.min(1, totalFacilityPowerMW / 20);
  const estimatedTempRiseC = Math.min(9.1, (heatRejectedMW / 100) * 2.07);
  // Temperature rise stays as a delta — convert by scaling °C delta to °F delta (×9/5), no +32 offset
  const displayTempRise = useFahrenheit ? estimatedTempRiseC * 9 / 5 : estimatedTempRiseC;
  const tempUnit = useFahrenheit ? '°F' : '°C';

  // Plume parameters
  const plumeH = 60 + plumeIntensity * 120;
  const plumeOpacity = 0.3 + plumeIntensity * 0.55;

  // Pipe widths
  const waterW = 8 + waterIntensity * 12;
  const powerW = 8 + powerIntensity * 12;

  // Ring opacity
  const ringOpacity = plumeIntensity;

  // Isometric building vertices
  const bW = 4, bD = 3, bH = 3; // grid units: width, depth, height

  // Top face (y=bH)
  const topFace = [
    iso(0, 0, bH), iso(bW, 0, bH), iso(bW, bD, bH), iso(0, bD, bH)
  ];
  // Left front face (x=0)
  const leftFace = [
    iso(0, bD, 0), iso(bW, bD, 0), iso(bW, bD, bH), iso(0, bD, bH)
  ];
  // Right front face (y=0)
  const rightFace = [
    iso(bW, 0, 0), iso(bW, bD, 0), iso(bW, bD, bH), iso(bW, 0, bH)
  ];

  // Roof HVAC units
  const hvac1 = [iso(0.5, 0.5, bH), iso(1.2, 0.5, bH), iso(1.2, 1.2, bH), iso(0.5, 1.2, bH)];
  const hvac2 = [iso(2, 0.5, bH), iso(2.7, 0.5, bH), iso(2.7, 1.2, bH), iso(2, 1.2, bH)];

  // Exhaust stack positions (roof right)
  const stacks = [
    iso(3.2, 0.4, bH),
    iso(3.5, 1.0, bH),
    iso(3.2, 1.6, bH),
  ];

  // Input pipe attachment point (left face, mid-height)
  const pipeAttach = iso(0, bD, bH / 2);
  const pipeStart = [pipeAttach[0] - 160, pipeAttach[1]];

  // Heat island ring center (screen coords of building footprint center)
  const ringCenter = iso(bW / 2, bD / 2, 0);

  return (
    <div className="exterior-view">
      <svg
        className="exterior-svg"
        viewBox="0 0 900 520"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Sky gradient */}
          <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a3a5c" />
            <stop offset="100%" stopColor="#2a5a7a" />
          </linearGradient>

          {/* Plume gradient */}
          <linearGradient id="plume-grad" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#dc2626" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
          </linearGradient>

          {/* Water pipe gradient */}
          <linearGradient id="water-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          {/* Electric stripe pattern */}
          <pattern id="stripe-pat" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="#ca8a04" />
            <rect x="0" y="0" width="10" height="20" fill="#1c1c30" />
          </pattern>

          {/* Arrow marker for water pipe */}
          <marker id="arrow-water" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#60a5fa" />
          </marker>

          {/* Grass gradient */}
          <linearGradient id="grass-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3d6b2e" />
            <stop offset="100%" stopColor="#2d5022" />
          </linearGradient>
        </defs>

        {/* ── Sky ── */}
        <rect x="0" y="0" width="900" height="520" fill="url(#sky-grad)" />

        {/* ── Ground ── */}
        <ellipse cx="450" cy="420" rx="480" ry="80" fill="url(#grass-grad)" />

        {/* ── Heat Island Rings ── */}
        {ringOpacity > 0.02 && (
          <>
            {/* Outer ring — 10 km zone */}
            <ellipse
              cx={ringCenter[0]}
              cy={ringCenter[1] + 30}
              rx={220}
              ry={60}
              fill="rgba(239,68,68,0.07)"
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="8 6"
              opacity={ringOpacity * 0.7}
            />
            <text
              x={ringCenter[0] + 165}
              y={ringCenter[1] + 25}
              className="ring-label"
              opacity={ringOpacity * 0.9}
            >
              up to 10 km
            </text>

            {/* Inner ring — 4.5 km zone */}
            <ellipse
              cx={ringCenter[0]}
              cy={ringCenter[1] + 20}
              rx={130}
              ry={36}
              fill="rgba(245,158,11,0.1)"
              stroke="#f59e0b"
              strokeWidth={1}
              strokeDasharray="6 5"
              opacity={ringOpacity}
            />
            <text
              x={ringCenter[0] + 88}
              y={ringCenter[1] + 15}
              className="ring-label"
              opacity={ringOpacity}
            >
              +1°C / 4.5 km
            </text>
          </>
        )}

        {/* ── Decorative pond ── */}
        <ellipse cx={200} cy={400} rx={55} ry={18} fill="#1e4a6e" opacity={0.85} />
        <ellipse cx={200} cy={397} rx={48} ry={12} fill="#2563a8" opacity={0.5} />

        {/* ── Truck silhouette ── */}
        <g transform="translate(700,390)">
          <rect x="0" y="-18" width="60" height="18" rx="2" fill="#374151" />
          <rect x="60" y="-14" width="28" height="14" rx="2" fill="#4b5563" />
          <circle cx="12" cy="2" r="6" fill="#1f2937" />
          <circle cx="48" cy="2" r="6" fill="#1f2937" />
          <circle cx="72" cy="2" r="5" fill="#1f2937" />
        </g>

        {/* ── Water input pipe ── */}
        <rect
          x={pipeStart[0]}
          y={pipeAttach[1] - waterW / 2 - 16}
          width={pipeAttach[0] - pipeStart[0]}
          height={waterW}
          fill="url(#water-grad)"
          rx={waterW / 2}
          opacity={0.3 + waterIntensity * 0.7}
        />
        {/* Animated flow arrows */}
        <line
          className="pipe-arrows"
          x1={pipeStart[0] + 20}
          y1={pipeAttach[1] - 16}
          x2={pipeAttach[0] - 10}
          y2={pipeAttach[1] - 16}
          stroke="#60a5fa"
          strokeWidth={2}
          strokeDasharray="12 8"
          markerEnd="url(#arrow-water)"
          opacity={0.3 + waterIntensity * 0.7}
        />
        {/* Water label */}
        <text x={pipeStart[0] - 5} y={pipeAttach[1] - 22} fill="#60a5fa" fontSize="11" textAnchor="end" opacity={0.3 + waterIntensity * 0.7}>
          💧 Water In
        </text>
        <text x={pipeStart[0] - 5} y={pipeAttach[1] - 9} fill="#60a5fa" fontSize="10" textAnchor="end" opacity={0.3 + waterIntensity * 0.7}>
          {totalWaterLitersPerDay > 0 ? `${(totalWaterLitersPerDay).toLocaleString(undefined, { maximumFractionDigits: 0 })} L/day` : '0 L/day'}
        </text>

        {/* ── Electricity conduit ── */}
        <rect
          x={pipeStart[0]}
          y={pipeAttach[1] + 4}
          width={pipeAttach[0] - pipeStart[0]}
          height={powerW}
          fill="url(#stripe-pat)"
          rx={2}
          opacity={0.3 + powerIntensity * 0.7}
        />
        {/* Power label */}
        <text x={pipeStart[0] - 5} y={pipeAttach[1] + 12} fill="#fbbf24" fontSize="11" textAnchor="end" opacity={0.3 + powerIntensity * 0.7}>
          ⚡ Power In
        </text>
        <text x={pipeStart[0] - 5} y={pipeAttach[1] + 25} fill="#fbbf24" fontSize="10" textAnchor="end" opacity={0.3 + powerIntensity * 0.7}>
          {totalFacilityPowerMW.toFixed(1)} MW
        </text>

        {/* ── Building — right face ── */}
        <polygon points={isoStr(...rightFace)} fill="#6b6560" />

        {/* ── Building — left/front face ── */}
        <polygon points={isoStr(...leftFace)} fill="#857f78" />

        {/* ── Building — top face ── */}
        <polygon points={isoStr(...topFace)} fill="#a8a09a" />

        {/* ── HVAC units on roof ── */}
        <polygon points={isoStr(...hvac1)} fill="#7a7470" stroke="#555" strokeWidth={0.5} />
        <polygon points={isoStr(...hvac2)} fill="#7a7470" stroke="#555" strokeWidth={0.5} />

        {/* ── Exhaust stacks ── */}
        {stacks.map(([sx, sy], i) => (
          <g key={i}>
            <circle cx={sx} cy={sy} r={8} fill="#4a4540" stroke="#333" strokeWidth={1} />
            {plumeIntensity > 0.02 && (
              <>
                <Plume x={sx} y={sy - 6} height={plumeH} opacity={plumeOpacity} delay={`${i * 0.8}s`} />
                <Plume x={sx} y={sy - 6} height={plumeH * 0.7} opacity={plumeOpacity * 0.6} delay={`${i * 0.8 + 1.2}s`} />
              </>
            )}
          </g>
        ))}

        {/* ── Heat output label ── */}
        {heatRejectedMW > 0 && (
          <g>
            <rect x={stacks[1][0] + 18} y={stacks[1][1] - plumeH * 0.6 - 30} width={168} height={42} rx={5}
              fill="#1a1a2a" stroke="#f97316" strokeWidth={1} opacity={0.88} />
            <text x={stacks[1][0] + 24} y={stacks[1][1] - plumeH * 0.6 - 13} fill="#fb923c" fontSize="12" fontWeight="bold">
              🌡️ Heat Out: {heatRejectedMW.toFixed(1)} MW
            </text>
            <text x={stacks[1][0] + 24} y={stacks[1][1] - plumeH * 0.6 + 4} fill="#fca5a5" fontSize="10">
              +{displayTempRise.toFixed(2)}{tempUnit} local LST increase
            </text>
          </g>
        )}

        {/* ── Empty state ── */}
        {heatRejectedMW === 0 && (
          <text x="450" y="430" textAnchor="middle" fill="#555" fontSize="13">
            Deploy racks in Interior View to see heat output.
          </text>
        )}
      </svg>

      <div className="exterior-citation">
        <strong>Data Heat Island Effect modeled from:</strong>{' '}
        Marinoni et al. (2026) — "The data heat island effect: quantifying the impact of AI data centers in a warming world" — arXiv:2603.20897v1 &nbsp;|&nbsp;
        Avg. LST increase: <strong>+{useFahrenheit ? (2.07 * 9 / 5).toFixed(2) : '2.07'}{tempUnit}</strong> &nbsp;|&nbsp; Spatial extent: <strong>up to 10 km</strong> &nbsp;|&nbsp;
        <strong>343M people</strong> potentially affected
      </div>
    </div>
  );
}
