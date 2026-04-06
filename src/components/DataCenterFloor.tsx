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

function RackTile({ rack }: { rack: { id: string; loadMW: number; coolingType: CoolingType } }) {
  const { removeRack, updateRackCooling, outsideTempC } = useSimulationStore();
  const rackPUE = calculateRackPUE(rack.coolingType, outsideTempC);
  const facilityPowerKW = rack.loadMW * rackPUE * 1000;
  const overheadKW = (facilityPowerKW - rack.loadMW * 1000);
  const color = COOLING_COLOR[rack.coolingType];

  return (
    <div className="rack-tile" style={{ borderColor: color }}>
      <div className="rack-header" style={{ background: color }}>
        <span>{COOLING_ICON[rack.coolingType]} {rack.id}</span>
        <button className="rack-remove" onClick={() => removeRack(rack.id)} title="Remove rack">✕</button>
      </div>
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
            Facility Power: {facilityPowerKW.toFixed(1)} kW
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
