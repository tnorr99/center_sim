import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CoolingType } from '../logic/thermoCalc';
import { useSimulationStore } from '../logic/store';
import { formatTemp } from '../logic/tempUtils';
import { Tooltip } from './Tooltip';
import constants from '../data/constants.json';

interface PaletteItemProps {
  coolingType: CoolingType;
}

const COLOR: Record<CoolingType, string> = {
  CRAC: '#e74c3c',
  HOT_AISLE: '#f39c12',
  LIQUID: '#2980b9',
};

const ICON: Record<CoolingType, string> = {
  CRAC: '❄️',
  HOT_AISLE: '🔥',
  LIQUID: '💧',
};

function PaletteItem({ coolingType }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${coolingType}`,
    data: { coolingType },
  });
  const { useFahrenheit } = useSimulationStore();
  const info = constants.coolingTech[coolingType];

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  const tooltipContent = (
    <div className="tooltip-content">
      <div className="tooltip-title">{info.label}</div>
      <p className="tooltip-desc">{info.description}</p>
      <table className="tooltip-table">
        <tbody>
          <tr><td>Baseline PUE</td><td><strong>{info.baselinePUE.toFixed(2)}</strong></td></tr>
          <tr><td>Ideal temp</td><td><strong>{formatTemp(info.idealTempC, useFahrenheit, 0)}</strong></td></tr>
          <tr><td>Penalty / °{useFahrenheit ? 'F' : 'C'} over ideal</td>
              <td><strong>+{useFahrenheit ? (info.penaltyPerDegreeK * 5/9).toFixed(4) : info.penaltyPerDegreeK.toFixed(3)} PUE</strong></td></tr>
          <tr><td>Temp sensitivity</td><td><strong>{info.tempSensitivity}</strong></td></tr>
          <tr><td>Liquid required</td><td><strong>{info.liquidRequired ? 'Yes' : 'No'}</strong></td></tr>
        </tbody>
      </table>
      <div className="tooltip-source">Source: {info.source}</div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position="right">
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="palette-item"
        data-cooling={coolingType}
      >
        <div className="palette-icon" style={{ background: COLOR[coolingType] }}>
          {ICON[coolingType]}
        </div>
        <div className="palette-label">{info.label}</div>
        <div className="palette-pue">PUE ≈ {info.baselinePUE.toFixed(2)}</div>
        <div className={`palette-sensitivity sensitivity-${info.tempSensitivity.toLowerCase()}`}>
          Temp Sensitivity: {info.tempSensitivity}
        </div>
      </div>
    </Tooltip>
  );
}

export function CoolingPalette() {
  const coolingTypes: CoolingType[] = ['CRAC', 'HOT_AISLE', 'LIQUID'];
  return (
    <aside className="palette">
      <h2 className="palette-title">Cooling Module Palette</h2>
      <p className="palette-subtitle">Drag a module onto the floor to deploy it.</p>
      {coolingTypes.map((ct) => (
        <PaletteItem key={ct} coolingType={ct} />
      ))}
    </aside>
  );
}
