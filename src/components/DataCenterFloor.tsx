import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSimulationStore } from '../logic/store';
import { CoolingType, calculateRackPUE } from '../logic/thermoCalc';
import { Tooltip } from './Tooltip';
import { ExteriorView } from './ExteriorView';
import constants from '../data/constants.json';

const COOLING_COLOR: Record<CoolingType, string> = {
  CRAC: '#e74c3c',
  HOT_AISLE: '#f39c12',
  LIQUID: '#2980b9',
};

const COOLING_ICON: Record<CoolingType, string> = {
  CRAC: '❄️',
  HOT_AISLE: '🔥',
  LIQUID: '💧',
};

// ── Cartoon SVG Illustrations ──────────────────────────────────────────────────

function CRACCartoon({ uid }: { uid: string }) {
  const p = `crac-${uid}`;
  return (
    <svg viewBox="0 0 110 118" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <marker id={`${p}-ci`} viewBox="0 0 6 6" markerWidth="4" markerHeight="4" refX="5" refY="3" orient="auto">
          <path d="M0,1 L5,3 L0,5 Z" fill="#2980b9" />
        </marker>
        <marker id={`${p}-ho`} viewBox="0 0 6 6" markerWidth="4" markerHeight="4" refX="5" refY="3" orient="auto">
          <path d="M0,1 L5,3 L0,5 Z" fill="#e74c3c" />
        </marker>
      </defs>

      {/* Floor */}
      <rect x="0" y="110" width="110" height="8" rx="2" fill="#1a1a2e" />

      {/* Left CRAC unit */}
      <rect x="3" y="38" width="24" height="72" rx="3" fill="#0f1e2d" stroke="#2980b9" strokeWidth="1.5" />
      <rect x="5" y="41" width="20" height="6" rx="1" fill="#0a1520" stroke="#1a3a4a" strokeWidth="0.5" />
      <text x="15" y="46" textAnchor="middle" fontSize="4.5" fill="#7ec8e3" fontFamily="monospace">CRAC</text>
      <circle cx="15" cy="70" r="9" fill="#0a1520" stroke="#2980b9" strokeWidth="1.5" />
      {/* fan blades */}
      <path d="M15 61 L15 79 M6 70 L24 70 M8.4 63.4 L21.6 76.6 M21.6 63.4 L8.4 76.6" stroke="#2980b9" strokeWidth="0.8" />
      <rect x="6" y="100" width="18" height="6" rx="1" fill="#0a1520" />
      <text x="15" y="105" textAnchor="middle" fontSize="3.8" fill="#555" fontFamily="monospace">UNIT A</text>

      {/* Right CRAC unit */}
      <rect x="83" y="38" width="24" height="72" rx="3" fill="#0f1e2d" stroke="#2980b9" strokeWidth="1.5" />
      <rect x="85" y="41" width="20" height="6" rx="1" fill="#0a1520" stroke="#1a3a4a" strokeWidth="0.5" />
      <text x="95" y="46" textAnchor="middle" fontSize="4.5" fill="#7ec8e3" fontFamily="monospace">CRAC</text>
      <circle cx="95" cy="70" r="9" fill="#0a1520" stroke="#2980b9" strokeWidth="1.5" />
      <path d="M95 61 L95 79 M86 70 L104 70 M88.4 63.4 L101.6 76.6 M101.6 63.4 L88.4 76.6" stroke="#2980b9" strokeWidth="0.8" />
      <rect x="86" y="100" width="18" height="6" rx="1" fill="#0a1520" />
      <text x="95" y="105" textAnchor="middle" fontSize="3.8" fill="#555" fontFamily="monospace">UNIT B</text>

      {/* Server rack */}
      <rect x="33" y="14" width="44" height="96" rx="3" fill="#16162a" stroke="#556" strokeWidth="1.5" />
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i}>
          <rect x="36" y={18 + i * 11} width="38" height="8" rx="1"
            fill={i % 2 === 0 ? '#1c1c30' : '#1e1e36'} stroke="#2a2a44" strokeWidth="0.5" />
          <rect x="38" y={20 + i * 11} width="18" height="4" rx="0.5" fill="#111120" />
          <circle cx="68" cy={22 + i * 11} r="1.5" fill={i % 4 === 0 ? '#e74c3c' : '#27ae60'} />
          <circle cx="71" cy={22 + i * 11} r="1.5" fill="#27ae60" />
        </g>
      ))}
      <rect x="35" y="108" width="10" height="2" rx="1" fill="#333" />
      <rect x="65" y="108" width="10" height="2" rx="1" fill="#333" />

      {/* Cold air arrows into rack */}
      <line x1="28" y1="62" x2="32" y2="62" stroke="#2980b9" strokeWidth="1.5" markerEnd={`url(#${p}-ci)`} />
      <line x1="28" y1="74" x2="32" y2="74" stroke="#2980b9" strokeWidth="1.5" markerEnd={`url(#${p}-ci)`} />
      <line x1="82" y1="62" x2="78" y2="62" stroke="#2980b9" strokeWidth="1.5" markerEnd={`url(#${p}-ci)`} />
      <line x1="82" y1="74" x2="78" y2="74" stroke="#2980b9" strokeWidth="1.5" markerEnd={`url(#${p}-ci)`} />

      {/* Hot exhaust wavys out the top */}
      <path d="M44 14 Q41 6 45 1" stroke="#e74c3c" strokeWidth="1.5" fill="none" strokeDasharray="2,1.5" />
      <path d="M55 14 Q52 5 56 0" stroke="#e74c3c" strokeWidth="1.5" fill="none" strokeDasharray="2,1.5" opacity="0.75" />
      <path d="M66 14 Q69 6 65 1" stroke="#e74c3c" strokeWidth="1.5" fill="none" strokeDasharray="2,1.5" />
    </svg>
  );
}

function HotAisleCartoon({ uid }: { uid: string }) {
  const p = `ha-${uid}`;
  return (
    <svg viewBox="0 0 110 118" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <marker id={`${p}-hot`} viewBox="0 0 6 6" markerWidth="4" markerHeight="4" refX="5" refY="3" orient="auto">
          <path d="M0,1 L5,3 L0,5 Z" fill="#f39c12" />
        </marker>
        <marker id={`${p}-cold`} viewBox="0 0 6 6" markerWidth="4" markerHeight="4" refX="5" refY="3" orient="auto">
          <path d="M0,1 L5,3 L0,5 Z" fill="#2980b9" />
        </marker>
        <marker id={`${p}-up`} viewBox="0 0 6 6" markerWidth="4" markerHeight="4" refX="3" refY="0" orient="auto">
          <path d="M1,6 L3,1 L5,6 Z" fill="#f39c12" />
        </marker>
      </defs>

      {/* Floor */}
      <rect x="0" y="110" width="110" height="8" rx="2" fill="#1a1a2e" />

      {/* Cold aisle floors/zones - left and right */}
      <rect x="1" y="22" width="26" height="88" rx="2" fill="#0d1a2a" opacity="0.55" />
      <text x="14" y="32" textAnchor="middle" fontSize="4.5" fill="#2980b9" fontFamily="monospace">COLD</text>
      <text x="14" y="38" textAnchor="middle" fontSize="4.5" fill="#2980b9" fontFamily="monospace">AISLE</text>
      <rect x="83" y="22" width="26" height="88" rx="2" fill="#0d1a2a" opacity="0.55" />
      <text x="96" y="32" textAnchor="middle" fontSize="4.5" fill="#2980b9" fontFamily="monospace">COLD</text>
      <text x="96" y="38" textAnchor="middle" fontSize="4.5" fill="#2980b9" fontFamily="monospace">AISLE</text>

      {/* Hot aisle containment zone - center */}
      <rect x="38" y="22" width="34" height="88" rx="2" fill="#200f00" opacity="0.85" />
      {/* Containment cap */}
      <rect x="36" y="17" width="38" height="8" rx="2" fill="#2a1200" stroke="#f39c12" strokeWidth="1.5" />
      <text x="55" y="23" textAnchor="middle" fontSize="4" fill="#f39c12" fontFamily="monospace">HOT AISLE</text>
      {/* Rising hot air wavy paths */}
      <path d="M48 102 Q45 88 49 75 Q52 62 49 50" stroke="#f39c12" strokeWidth="1.2" fill="none" opacity="0.85" />
      <path d="M55 105 Q58 90 54 77 Q51 64 55 52" stroke="#f39c12" strokeWidth="1.2" fill="none" opacity="0.65" />
      <path d="M63 102 Q66 88 62 75 Q59 62 63 50" stroke="#f39c12" strokeWidth="1.2" fill="none" opacity="0.8" />
      <line x1="55" y1="47" x2="55" y2="30" stroke="#f39c12" strokeWidth="1.2" markerEnd={`url(#${p}-up)`} />

      {/* Left rack — exhaust faces right into hot aisle */}
      <rect x="27" y="24" width="13" height="86" rx="2" fill="#16162a" stroke="#555" strokeWidth="1.5" />
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} x="29" y={28 + i * 11} width="9" height="8" rx="1"
          fill={i % 2 === 0 ? '#1c1c30' : '#1e1e36'} stroke="#2a2a44" strokeWidth="0.5" />
      ))}
      <line x1="40" y1="50" x2="38" y2="50" stroke="#f39c12" strokeWidth="1.2" markerEnd={`url(#${p}-hot)`} />
      <line x1="40" y1="70" x2="38" y2="70" stroke="#f39c12" strokeWidth="1.2" markerEnd={`url(#${p}-hot)`} />
      <line x1="40" y1="90" x2="38" y2="90" stroke="#f39c12" strokeWidth="1.2" markerEnd={`url(#${p}-hot)`} />

      {/* Right rack — exhaust faces left into hot aisle */}
      <rect x="70" y="24" width="13" height="86" rx="2" fill="#16162a" stroke="#555" strokeWidth="1.5" />
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} x="72" y={28 + i * 11} width="9" height="8" rx="1"
          fill={i % 2 === 0 ? '#1c1c30' : '#1e1e36'} stroke="#2a2a44" strokeWidth="0.5" />
      ))}
      <line x1="70" y1="50" x2="72" y2="50" stroke="#f39c12" strokeWidth="1.2" markerEnd={`url(#${p}-hot)`} />
      <line x1="70" y1="70" x2="72" y2="70" stroke="#f39c12" strokeWidth="1.2" markerEnd={`url(#${p}-hot)`} />
      <line x1="70" y1="90" x2="72" y2="90" stroke="#f39c12" strokeWidth="1.2" markerEnd={`url(#${p}-hot)`} />

      {/* Cold supply arrows into rack fronts */}
      <line x1="16" y1="55" x2="26" y2="55" stroke="#2980b9" strokeWidth="1.2" markerEnd={`url(#${p}-cold)`} />
      <line x1="94" y1="55" x2="84" y2="55" stroke="#2980b9" strokeWidth="1.2" markerEnd={`url(#${p}-cold)`} />
    </svg>
  );
}

function LiquidCartoon({ uid }: { uid: string }) {
  const p = `liq-${uid}`;
  return (
    <svg viewBox="0 0 110 118" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <marker id={`${p}-dn`} viewBox="0 0 6 6" markerWidth="4" markerHeight="4" refX="3" refY="5" orient="auto">
          <path d="M1,0 L5,0 L3,5 Z" fill="#2980b9" />
        </marker>
        <marker id={`${p}-up`} viewBox="0 0 6 6" markerWidth="4" markerHeight="4" refX="3" refY="1" orient="auto">
          <path d="M1,6 L5,6 L3,1 Z" fill="#c0392b" />
        </marker>
      </defs>

      {/* Floor */}
      <rect x="0" y="110" width="110" height="8" rx="2" fill="#1a1a2e" />

      {/* CDU box */}
      <rect x="3" y="28" width="26" height="82" rx="4" fill="#0a1724" stroke="#2980b9" strokeWidth="1.5" />
      <text x="16" y="38" textAnchor="middle" fontSize="5" fill="#7ec8e3" fontFamily="monospace">CDU</text>
      <rect x="7" y="42" width="18" height="14" rx="1" fill="#060e18" stroke="#2980b9" strokeWidth="0.5" />
      <text x="16" y="50" textAnchor="middle" fontSize="3.5" fill="#2980b9">TEMP</text>
      <text x="16" y="55" textAnchor="middle" fontSize="5" fill="#27ae60" fontWeight="bold">OK</text>
      {/* pump circle */}
      <circle cx="16" cy="82" r="9" fill="#060e18" stroke="#2980b9" strokeWidth="1.5" />
      <path d="M12 79 L21 82 L12 85 Z" fill="#2980b9" />
      <text x="16" y="101" textAnchor="middle" fontSize="3.8" fill="#555" fontFamily="monospace">PUMP</text>

      {/* Supply manifold — cool, blue, left side of rack */}
      <rect x="34" y="16" width="5" height="92" rx="1.5" fill="#0d2233" stroke="#2980b9" strokeWidth="1" />
      <line x1="36" y1="30" x2="36" y2="42" stroke="#2980b9" strokeWidth="1" markerEnd={`url(#${p}-dn)`} />
      <line x1="36" y1="58" x2="36" y2="70" stroke="#2980b9" strokeWidth="1" markerEnd={`url(#${p}-dn)`} />
      <line x1="36" y1="82" x2="36" y2="94" stroke="#2980b9" strokeWidth="1" markerEnd={`url(#${p}-dn)`} />

      {/* Return manifold — warm, red, right side of rack */}
      <rect x="82" y="16" width="5" height="92" rx="1.5" fill="#2a0d0d" stroke="#c0392b" strokeWidth="1" />
      <line x1="84" y1="94" x2="84" y2="82" stroke="#c0392b" strokeWidth="1" markerEnd={`url(#${p}-up)`} />
      <line x1="84" y1="70" x2="84" y2="58" stroke="#c0392b" strokeWidth="1" markerEnd={`url(#${p}-up)`} />
      <line x1="84" y1="42" x2="84" y2="30" stroke="#c0392b" strokeWidth="1" markerEnd={`url(#${p}-up)`} />

      {/* CDU connections */}
      <line x1="29" y1="62" x2="35" y2="62" stroke="#2980b9" strokeWidth="1.5" />
      <path d="M87 55 Q98 55 98 45 Q98 30 29 30" stroke="#c0392b" strokeWidth="1.5" fill="none" />

      {/* Server rack */}
      <rect x="39" y="13" width="43" height="97" rx="3" fill="#16162a" stroke="#556" strokeWidth="1.5" />
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i}>
          <rect x="42" y={17 + i * 11} width="37" height="8" rx="1"
            fill={i % 2 === 0 ? '#1c1c30' : '#1e1e36'} stroke="#2a2a44" strokeWidth="0.5" />
          {/* cold plate inlet */}
          <rect x="42" y={18 + i * 11} width="5" height="6" rx="0.5" fill="#0d2233" stroke="#2980b9" strokeWidth="0.5" />
          {/* return outlet */}
          <rect x="74" y={18 + i * 11} width="5" height="6" rx="0.5" fill="#2a0d0d" stroke="#c0392b" strokeWidth="0.5" />
          {/* status LED */}
          <circle cx="68" cy={21 + i * 11} r="1.5" fill={i % 3 === 0 ? '#27ae60' : '#2980b9'} />
        </g>
      ))}

      {/* Droplet label */}
      <text x="101" y="56" fontSize="9" fill="#2980b9" opacity="0.85">💧</text>
      <text x="103" y="74" fontSize="7" fill="#2980b9" opacity="0.55">💧</text>
    </svg>
  );
}

const COOLING_CARTOON: Record<CoolingType, React.FC<{ uid: string }>> = {
  CRAC: CRACCartoon,
  HOT_AISLE: HotAisleCartoon,
  LIQUID: LiquidCartoon,
};

// ── Rack Tile ──────────────────────────────────────────────────────────────────

function RackTile({ rack }: { rack: { id: string; loadMW: number; coolingType: CoolingType } }) {
  const { removeRack, updateRackCooling, outsideTempC } = useSimulationStore();
  const [mode, setMode] = useState<'diagram' | 'specs'>('diagram');
  const rackPUE = calculateRackPUE(rack.coolingType, outsideTempC);
  const facilityPowerKW = rack.loadMW * rackPUE * 1000;
  const overheadKW = (facilityPowerKW - rack.loadMW * 1000);
  const color = COOLING_COLOR[rack.coolingType];
  const CartoonComponent = COOLING_CARTOON[rack.coolingType];

  return (
    <div className="rack-tile" style={{ borderColor: color }}>
      <div className="rack-header" style={{ background: color }}>
        <span>{COOLING_ICON[rack.coolingType]} {rack.id}</span>
        <button className="rack-remove" onClick={() => removeRack(rack.id)} title="Remove rack">✕</button>
      </div>

      {mode === 'diagram' ? (
        <div className="rack-cartoon">
          <CartoonComponent uid={rack.id} />
        </div>
      ) : (
        <div className="rack-body">
          <Tooltip position="bottom" content={
            <div className="tooltip-content">
              <div className="tooltip-title">IT Load</div>
              <p className="tooltip-desc">Raw compute power consumed by the server hardware itself, before any cooling overhead is added. Based on the NVIDIA GB200 NVL72 spec of 120 kW continuous draw.</p>
            </div>
          }>
            <div className="rack-stat rack-stat--hoverable">
              Load: {(rack.loadMW * 1000).toFixed(0)} kW
            </div>
          </Tooltip>

          <Tooltip position="bottom" content={
            <div className="tooltip-content">
              <div className="tooltip-title">Power Usage Effectiveness (PUE)</div>
              <p className="tooltip-desc">
                Total facility power ÷ IT load. A PUE of 1.0 is perfect (zero overhead). Every decimal above 1.0 represents wasted energy spent on cooling, lighting, and power conversion.
              </p>
              <table className="tooltip-table">
                <tbody>
                  <tr><td>Formula</td><td>Baseline + (penalty × max(0, temp − ideal))</td></tr>
                  <tr><td>Cooling type</td><td><strong>{constants.coolingTech[rack.coolingType].label}</strong></td></tr>
                  <tr><td>Current PUE</td><td><strong>{rackPUE.toFixed(4)}</strong></td></tr>
                </tbody>
              </table>
            </div>
          }>
            <div className="rack-stat rack-stat--hoverable">
              PUE: {rackPUE.toFixed(3)}
            </div>
          </Tooltip>

          <Tooltip position="bottom" content={
            <div className="tooltip-content">
              <div className="tooltip-title">Total Facility Power</div>
              <p className="tooltip-desc">
                IT Load × PUE. The additional {overheadKW.toFixed(1)} kW above the {(rack.loadMW * 1000).toFixed(0)} kW IT baseline is the cooling overhead — energy consumed solely to remove heat.
              </p>
            </div>
          }>
            <div className="rack-stat rack-stat--hoverable">
              Facility: {facilityPowerKW.toFixed(1)} kW
            </div>
          </Tooltip>

          <select
            className="rack-cooling-select"
            value={rack.coolingType}
            onChange={(e) => updateRackCooling(rack.id, e.target.value as CoolingType)}
          >
            {(Object.keys(constants.coolingTech) as CoolingType[]).map((ct) => (
              <option key={ct} value={ct}>{constants.coolingTech[ct].label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Mode toggle */}
      <div className="rack-mode-bar">
        <button
          className={`rack-mode-btn ${mode === 'diagram' ? 'rack-mode-btn--active' : ''}`}
          style={mode === 'diagram' ? { borderColor: color, color } : {}}
          onClick={() => setMode('diagram')}
        >
          Diagram
        </button>
        <button
          className={`rack-mode-btn ${mode === 'specs' ? 'rack-mode-btn--active' : ''}`}
          style={mode === 'specs' ? { borderColor: color, color } : {}}
          onClick={() => setMode('specs')}
        >
          Specs
        </button>
      </div>
    </div>
  );
}

export function DataCenterFloor() {
  const { racks } = useSimulationStore();
  const { setNodeRef, isOver } = useDroppable({ id: 'datacenter-floor' });
  const [view, setView] = useState<'interior' | 'exterior'>('interior');

  return (
    <main ref={setNodeRef} className={`floor ${isOver ? 'floor--over' : ''}`}>
      <h2 className="floor-title">
        Data Center Floor
        <span className="floor-count">{racks.length} rack{racks.length !== 1 ? 's' : ''} deployed</span>
        <button
          className={`view-toggle ${view === 'exterior' ? 'view-toggle--active' : ''}`}
          onClick={() => setView(v => v === 'interior' ? 'exterior' : 'interior')}
          title={view === 'interior' ? 'Switch to Exterior View' : 'Switch to Interior View'}
        >
          {view === 'interior' ? '🏢 Exterior View' : '⚙️ Interior View'}
        </button>
      </h2>

      {view === 'exterior' ? (
        <ExteriorView />
      ) : racks.length === 0 ? (
        <div className="floor-empty">
          <p>Drop a cooling module here to deploy a rack.</p>
          <p className="floor-empty-sub">Each rack represents an NVIDIA GB200 NVL72 (120 kW).</p>
        </div>
      ) : (
        <div className="rack-grid">
          {racks.map((rack) => (
            <RackTile key={rack.id} rack={rack} />
          ))}
        </div>
      )}
    </main>
  );
}
