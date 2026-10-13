import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from '../logic/store';
import { calculateFacilityMetrics } from '../logic/thermoCalc';
import constants from '../data/constants.json';

const store = () => useSimulationStore.getState();

beforeEach(() => {
  store().loadPreset([]);
  store().setOutsideTemp(constants.simulation.defaultOutsideTempC);
});

describe('addRack', () => {
  it('appends a rack at the default load and recomputes metrics', () => {
    store().addRack('LIQUID');
    expect(store().racks).toHaveLength(1);
    expect(store().racks[0].loadMW).toBe(constants.simulation.defaultRackLoadMW);
    expect(store().metrics.totalITLoadMW).toBeCloseTo(0.12, 10);
    expect(store().metrics.systemPUE).toBeCloseTo(1.05, 10);
  });

  it(`stops at maxRacks (${constants.simulation.maxRacks})`, () => {
    for (let i = 0; i < constants.simulation.maxRacks + 5; i++) store().addRack('CRAC');
    expect(store().racks).toHaveLength(constants.simulation.maxRacks);
  });

  it('assigns unique ids after a preset load', () => {
    store().loadPreset([
      { id: 'rack-1', loadMW: 0.12, coolingType: 'CRAC' },
      { id: 'rack-2', loadMW: 0.12, coolingType: 'CRAC' },
    ]);
    store().addRack('LIQUID');
    const ids = store().racks.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('metric recomputation', () => {
  it('removeRack and updateRackCooling keep metrics in sync with the racks', () => {
    store().addRack('CRAC');
    store().addRack('CRAC');
    const [a, b] = store().racks;

    store().updateRackCooling(a.id, 'LIQUID');
    expect(store().metrics).toMatchObject(calculateFacilityMetrics(store().racks, store().outsideTempC));

    store().removeRack(b.id);
    expect(store().racks.map((r) => r.id)).toEqual([a.id]);
    expect(store().metrics.systemPUE).toBeCloseTo(1.05, 10);
  });

  it('setOutsideTemp recomputes PUE for the new temperature', () => {
    store().addRack('CRAC');
    store().setOutsideTemp(constants.climate.summerPeakC);
    // CRAC: 1.45 + 0.015 × (30.5 − 15)
    expect(store().metrics.systemPUE).toBeCloseTo(1.45 + 0.015 * 15.5, 10);
  });

  it('an empty floor reports zero metrics', () => {
    expect(store().metrics.systemPUE).toBe(0);
    expect(store().metrics.totalWaterLitersPerDay).toBe(0);
  });
});
