import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSimulationStore } from '../logic/store';
import { CoolingType, calculateRackPUE } from '../logic/thermoCalc';
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
  const color = COOLING_COLOR[rack.coolingType];

  return (
    <div className="rack-tile" style={{ borderColor: color }}>
      <div className="rack-header" style={{ background: color }}>
        <span>{COOLING_ICON[rack.coolingType]} {rack.id}</span>
        <button className="rack-remove" onClick={() => removeRack(rack.id)} title="Remove rack">✕</button>
      </div>
      <div className="rack-body">
        <div className="rack-stat">Load: {(rack.loadMW * 1000).toFixed(0)} kW</div>
        <div className="rack-stat">PUE: {rackPUE.toFixed(3)}</div>
        <div className="rack-stat">
          Facility Power: {(rack.loadMW * rackPUE * 1000).toFixed(1)} kW
        </div>
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

  return (
    <main
      ref={setNodeRef}
      className={`floor ${isOver ? 'floor--over' : ''}`}
    >
      <h2 className="floor-title">
        Data Center Floor
        <span className="floor-count">{racks.length} rack{racks.length !== 1 ? 's' : ''} deployed</span>
      </h2>

      {racks.length === 0 ? (
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
