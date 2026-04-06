import { describe, it, expect } from 'vitest';
import { calculateRackPUE, calculateFacilityMetrics, Rack } from '../logic/thermoCalc';

// ── Climate constants from McLean, VA (NOAA) ─────────────────────────────────
const SUMMER_PEAK_C = 30.5;
const WINTER_TROUGH_C = -2.2;
const RACK_LOAD_MW = 0.12; // NVIDIA GB200 NVL72 baseline

// ── calculateRackPUE ─────────────────────────────────────────────────────────
describe('calculateRackPUE', () => {
  describe('at ideal/below-ideal temperature (no penalty)', () => {
    it('CRAC returns baseline PUE 1.45 at its ideal 15°C', () => {
      expect(calculateRackPUE('CRAC', 15)).toBeCloseTo(1.45, 5);
    });

    it('CRAC returns baseline PUE 1.45 below its ideal temp', () => {
      expect(calculateRackPUE('CRAC', 10)).toBeCloseTo(1.45, 5);
    });

    it('HOT_AISLE returns baseline PUE 1.25 at its ideal 22°C', () => {
      expect(calculateRackPUE('HOT_AISLE', 22)).toBeCloseTo(1.25, 5);
    });

    it('LIQUID returns baseline PUE 1.05 at its ideal 30°C', () => {
      expect(calculateRackPUE('LIQUID', 30)).toBeCloseTo(1.05, 5);
    });

    it('LIQUID returns baseline PUE 1.05 even in winter', () => {
      expect(calculateRackPUE('LIQUID', WINTER_TROUGH_C)).toBeCloseTo(1.05, 5);
    });
  });

  describe('CRAC vs LIQUID: summer peak degradation', () => {
    it('CRAC PUE is higher (worse) than LIQUID at summer peak', () => {
      const cracPUE = calculateRackPUE('CRAC', SUMMER_PEAK_C);
      const liquidPUE = calculateRackPUE('LIQUID', SUMMER_PEAK_C);
      expect(cracPUE).toBeGreaterThan(liquidPUE);
    });

    it('CRAC summer PUE matches formula: 1.45 + 0.015*(30.5-15)', () => {
      const expected = 1.45 + 0.015 * (SUMMER_PEAK_C - 15);
      expect(calculateRackPUE('CRAC', SUMMER_PEAK_C)).toBeCloseTo(expected, 5);
    });

    it('LIQUID summer PUE matches formula: 1.05 + 0.002*(30.5-30)', () => {
      const expected = 1.05 + 0.002 * (SUMMER_PEAK_C - 30);
      expect(calculateRackPUE('LIQUID', SUMMER_PEAK_C)).toBeCloseTo(expected, 5);
    });

    it('CRAC degrades significantly more than LIQUID between winter and summer', () => {
      const cracDelta = calculateRackPUE('CRAC', SUMMER_PEAK_C) - calculateRackPUE('CRAC', WINTER_TROUGH_C);
      const liquidDelta = calculateRackPUE('LIQUID', SUMMER_PEAK_C) - calculateRackPUE('LIQUID', WINTER_TROUGH_C);
      expect(cracDelta).toBeGreaterThan(liquidDelta * 5); // CRAC degrades >5x more
    });
  });

  describe('HOT_AISLE: intermediate efficiency', () => {
    it('HOT_AISLE PUE at summer peak is between CRAC and LIQUID', () => {
      const cracPUE = calculateRackPUE('CRAC', SUMMER_PEAK_C);
      const hotAislePUE = calculateRackPUE('HOT_AISLE', SUMMER_PEAK_C);
      const liquidPUE = calculateRackPUE('LIQUID', SUMMER_PEAK_C);
      expect(hotAislePUE).toBeLessThan(cracPUE);
      expect(hotAislePUE).toBeGreaterThan(liquidPUE);
    });
  });

  describe('temperature sensitivity ordering', () => {
    it('penalty ordering holds: CRAC > HOT_AISLE > LIQUID at any temp above each ideal', () => {
      const testTemp = 35;
      const cracPUE = calculateRackPUE('CRAC', testTemp);
      const hotAislePUE = calculateRackPUE('HOT_AISLE', testTemp);
      const liquidPUE = calculateRackPUE('LIQUID', testTemp);
      expect(cracPUE).toBeGreaterThan(hotAislePUE);
      expect(hotAislePUE).toBeGreaterThan(liquidPUE);
    });

    it('PUE never drops below its baseline (no negative penalties)', () => {
      expect(calculateRackPUE('CRAC', -50)).toBeCloseTo(1.45, 5);
      expect(calculateRackPUE('HOT_AISLE', -50)).toBeCloseTo(1.25, 5);
      expect(calculateRackPUE('LIQUID', -50)).toBeCloseTo(1.05, 5);
    });
  });
});

// ── calculateFacilityMetrics ─────────────────────────────────────────────────
describe('calculateFacilityMetrics', () => {
  describe('empty facility', () => {
    it('returns zero metrics for no racks', () => {
      const result = calculateFacilityMetrics([], 20);
      expect(result.totalITLoadMW).toBe(0);
      expect(result.systemPUE).toBe(0);
      expect(result.totalFacilityPowerMW).toBe(0);
      expect(result.heatRejectedMW).toBe(0);
    });
  });

  describe('single rack validation', () => {
    it('totalITLoadMW equals rack loadMW', () => {
      const racks: Rack[] = [{ id: 'r1', loadMW: RACK_LOAD_MW, coolingType: 'CRAC' }];
      const result = calculateFacilityMetrics(racks, 20);
      expect(result.totalITLoadMW).toBeCloseTo(RACK_LOAD_MW, 5);
    });

    it('systemPUE equals rackPUE when only one rack exists', () => {
      const racks: Rack[] = [{ id: 'r1', loadMW: RACK_LOAD_MW, coolingType: 'LIQUID' }];
      const result = calculateFacilityMetrics(racks, SUMMER_PEAK_C);
      const expectedPUE = calculateRackPUE('LIQUID', SUMMER_PEAK_C);
      expect(result.systemPUE).toBeCloseTo(expectedPUE, 5);
    });

    it('heatRejectedMW equals totalFacilityPowerMW (thermodynamic identity)', () => {
      const racks: Rack[] = [{ id: 'r1', loadMW: RACK_LOAD_MW, coolingType: 'CRAC' }];
      const result = calculateFacilityMetrics(racks, 20);
      expect(result.heatRejectedMW).toBeCloseTo(result.totalFacilityPowerMW, 10);
    });
  });

  describe('CRAC → LIQUID swap reduces PUE and heat output', () => {
    const TEMP = SUMMER_PEAK_C;

    it('swapping CRAC for LIQUID reduces systemPUE', () => {
      const cracRacks: Rack[] = [{ id: 'r1', loadMW: RACK_LOAD_MW, coolingType: 'CRAC' }];
      const liquidRacks: Rack[] = [{ id: 'r1', loadMW: RACK_LOAD_MW, coolingType: 'LIQUID' }];
      const cracMetrics = calculateFacilityMetrics(cracRacks, TEMP);
      const liquidMetrics = calculateFacilityMetrics(liquidRacks, TEMP);
      expect(liquidMetrics.systemPUE).toBeLessThan(cracMetrics.systemPUE);
    });

    it('swapping CRAC for LIQUID reduces heatRejectedMW', () => {
      const cracRacks: Rack[] = [{ id: 'r1', loadMW: RACK_LOAD_MW, coolingType: 'CRAC' }];
      const liquidRacks: Rack[] = [{ id: 'r1', loadMW: RACK_LOAD_MW, coolingType: 'LIQUID' }];
      const cracMetrics = calculateFacilityMetrics(cracRacks, TEMP);
      const liquidMetrics = calculateFacilityMetrics(liquidRacks, TEMP);
      expect(liquidMetrics.heatRejectedMW).toBeLessThan(cracMetrics.heatRejectedMW);
    });

    it('LIQUID saves meaningful power vs CRAC at summer peak with 10 racks', () => {
      const cracRacks: Rack[] = Array.from({ length: 10 }, (_, i) => ({
        id: `r${i}`, loadMW: RACK_LOAD_MW, coolingType: 'CRAC' as const,
      }));
      const liquidRacks: Rack[] = cracRacks.map((r) => ({ ...r, coolingType: 'LIQUID' as const }));
      const cracMetrics = calculateFacilityMetrics(cracRacks, TEMP);
      const liquidMetrics = calculateFacilityMetrics(liquidRacks, TEMP);
      const savedMW = cracMetrics.heatRejectedMW - liquidMetrics.heatRejectedMW;
      expect(savedMW).toBeGreaterThan(0.1); // >100 kW saved
    });
  });

  describe('mixed rack fleet', () => {
    it('system PUE is weighted average across different cooling types', () => {
      const racks: Rack[] = [
        { id: 'r1', loadMW: RACK_LOAD_MW, coolingType: 'CRAC' },
        { id: 'r2', loadMW: RACK_LOAD_MW, coolingType: 'LIQUID' },
      ];
      const result = calculateFacilityMetrics(racks, 20);
      const cracPUE = calculateRackPUE('CRAC', 20);
      const liquidPUE = calculateRackPUE('LIQUID', 20);
      const expectedSystemPUE = (cracPUE + liquidPUE) / 2; // equal loads → simple average
      expect(result.systemPUE).toBeCloseTo(expectedSystemPUE, 5);
    });
  });

  describe('summer vs winter temperature comparison', () => {
    it('CRAC facility uses more power in summer than winter', () => {
      const racks: Rack[] = [{ id: 'r1', loadMW: RACK_LOAD_MW, coolingType: 'CRAC' }];
      const summer = calculateFacilityMetrics(racks, SUMMER_PEAK_C);
      const winter = calculateFacilityMetrics(racks, WINTER_TROUGH_C);
      expect(summer.totalFacilityPowerMW).toBeGreaterThan(winter.totalFacilityPowerMW);
    });

    it('LIQUID facility power is nearly identical summer vs winter', () => {
      const racks: Rack[] = [{ id: 'r1', loadMW: RACK_LOAD_MW, coolingType: 'LIQUID' }];
      const summer = calculateFacilityMetrics(racks, SUMMER_PEAK_C);
      const winter = calculateFacilityMetrics(racks, WINTER_TROUGH_C);
      const delta = summer.totalFacilityPowerMW - winter.totalFacilityPowerMW;
      expect(delta).toBeLessThan(0.001); // <1 kW difference for a 120 kW rack
    });

    it('summer degrades air-cooled (CRAC) more than liquid-cooled facilities', () => {
      const cracRacks: Rack[] = [{ id: 'r1', loadMW: RACK_LOAD_MW, coolingType: 'CRAC' }];
      const liquidRacks: Rack[] = [{ id: 'r1', loadMW: RACK_LOAD_MW, coolingType: 'LIQUID' }];
      const cracSummerPower = calculateFacilityMetrics(cracRacks, SUMMER_PEAK_C).totalFacilityPowerMW;
      const cracWinterPower = calculateFacilityMetrics(cracRacks, WINTER_TROUGH_C).totalFacilityPowerMW;
      const liquidSummerPower = calculateFacilityMetrics(liquidRacks, SUMMER_PEAK_C).totalFacilityPowerMW;
      const liquidWinterPower = calculateFacilityMetrics(liquidRacks, WINTER_TROUGH_C).totalFacilityPowerMW;
      const cracSeasonalDelta = cracSummerPower - cracWinterPower;
      const liquidSeasonalDelta = liquidSummerPower - liquidWinterPower;
      expect(cracSeasonalDelta).toBeGreaterThan(liquidSeasonalDelta * 5);
    });
  });
});
