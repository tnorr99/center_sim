import React from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CoolingPalette } from './components/CoolingPalette';
import { DataCenterFloor } from './components/DataCenterFloor';
import { MetricsDashboard } from './components/MetricsDashboard';
import { useSimulationStore } from './logic/store';
import { CoolingType } from './logic/thermoCalc';
import './App.css';

export default function App() {
  const { addRack } = useSimulationStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over?.id === 'datacenter-floor' && active.data.current?.coolingType) {
      addRack(active.data.current.coolingType as CoolingType);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="app-layout">
        <header className="app-header">
          <h1>Data Center Thermodynamics Simulator</h1>
          <span className="app-subtitle">McLean / Ashburn, VA — Loudoun County Baseline</span>
        </header>

        <div className="app-body">
          <CoolingPalette />
          <DataCenterFloor />
          <MetricsDashboard />
        </div>
      </div>
    </DndContext>
  );
}
