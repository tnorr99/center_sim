import React from 'react';
import { PRESETS } from '../data/presets';
import { useSimulationStore } from '../logic/store';

export function PresetBar() {
  const loadPreset = useSimulationStore((s) => s.loadPreset);

  return (
    <div className="preset-bar">
      <span className="preset-bar-label">Quick Load:</span>
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          className="preset-btn"
          onClick={() => loadPreset(preset.racks)}
          title={preset.citation ? `${preset.description}\n\nSource: ${preset.citation}` : preset.description}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
