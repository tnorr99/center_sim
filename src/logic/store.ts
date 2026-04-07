import { create } from 'zustand';
import { Rack, CoolingType, calculateFacilityMetrics, calculateWaterMetrics } from './thermoCalc';
import constants from '../data/constants.json';

interface FacilityMetrics {
  totalITLoadMW: number;
  systemPUE: number;
  totalFacilityPowerMW: number;
  heatRejectedMW: number;
  totalWaterLitersPerDay: number;
  systemWUE: number;
}

interface SimulationStore {
  // State
  racks: Rack[];
  outsideTempC: number;
  useFahrenheit: boolean;

  // Derived (recalculated on every change)
  metrics: FacilityMetrics;

  // Actions
  addRack: (coolingType: CoolingType) => void;
  removeRack: (id: string) => void;
  updateRackCooling: (id: string, coolingType: CoolingType) => void;
  setOutsideTemp: (tempC: number) => void;
  toggleTempUnit: () => void;
  loadPreset: (racks: Rack[]) => void;
}

const ZERO_METRICS: FacilityMetrics = {
  totalITLoadMW: 0, systemPUE: 0, totalFacilityPowerMW: 0,
  heatRejectedMW: 0, totalWaterLitersPerDay: 0, systemWUE: 0,
};

const computeMetrics = (racks: Rack[], outsideTempC: number): FacilityMetrics =>
  racks.length > 0
    ? { ...calculateFacilityMetrics(racks, outsideTempC), ...calculateWaterMetrics(racks) }
    : ZERO_METRICS;

let rackCounter = 0;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  racks: [],
  outsideTempC: constants.simulation.defaultOutsideTempC,
  useFahrenheit: false,
  metrics: ZERO_METRICS,

  addRack: (coolingType) => {
    const newRack: Rack = {
      id: `rack-${++rackCounter}`,
      loadMW: constants.simulation.defaultRackLoadMW,
      coolingType,
    };
    const racks = [...get().racks, newRack];
    set({ racks, metrics: computeMetrics(racks, get().outsideTempC) });
  },

  removeRack: (id) => {
    const racks = get().racks.filter((r) => r.id !== id);
    set({ racks, metrics: computeMetrics(racks, get().outsideTempC) });
  },

  updateRackCooling: (id, coolingType) => {
    const racks = get().racks.map((r) => (r.id === id ? { ...r, coolingType } : r));
    set({ racks, metrics: computeMetrics(racks, get().outsideTempC) });
  },

  setOutsideTemp: (tempC) => {
    set({ outsideTempC: tempC, metrics: computeMetrics(get().racks, tempC) });
  },

  toggleTempUnit: () => {
    set({ useFahrenheit: !get().useFahrenheit });
  },

  loadPreset: (newRacks) => {
    rackCounter = newRacks.length;
    set({ racks: newRacks, metrics: computeMetrics(newRacks, get().outsideTempC) });
  },
}));
