import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CoolingType } from '../logic/thermoCalc';
import constants from '../data/constants.json';

interface PaletteItemProps {
  coolingType: CoolingType;
}

function PaletteItem({ coolingType }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${coolingType}`,
    data: { coolingType },
  });

  const info = constants.coolingTech[coolingType];

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  const colorMap: Record<CoolingType, string> = {
    CRAC: '#e74c3c',
    HOT_AISLE: '#f39c12',
    LIQUID: '#2980b9',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="palette-item"
      data-cooling={coolingType}
      title={info.description}
    >
      <div className="palette-icon" style={{ background: colorMap[coolingType] }}>
        {coolingType === 'CRAC' ? '❄️' : coolingType === 'HOT_AISLE' ? '🔥' : '💧'}
      </div>
      <div className="palette-label">{info.label}</div>
      <div className="palette-pue">PUE ≈ {info.baselinePUE.toFixed(2)}</div>
      <div className={`palette-sensitivity sensitivity-${info.tempSensitivity.toLowerCase()}`}>
        Temp Sensitivity: {info.tempSensitivity}
      </div>
    </div>
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
