// /src/logic/thermoCalc.ts

/**
 * DATA CENTER THERMODYNAMIC ENGINE
 * * ==========================================
 * CITATIONS & RESEARCH SOURCES
 * ==========================================
 * 1. Hardware Baseline (NVIDIA GB200 NVL72): 
 * - Power/Heat: ~120 kW continuous per rack.
 * - Requirement: Direct-to-chip liquid cooling mandatory.
 * - Source: NVIDIA Blackwell Architecture & GB200 NVL72 Technical Specifications (2024/2025).
 * * 2. Temperature & PUE Degradation Curves:
 * - Thresholds based on ASHRAE TC 9.9 Environmental Guidelines for Datacom Equipment.
 * - Baseline PUE averages derived from Uptime Institute Annual Data Center Surveys.
 * - Liquid Cooling resilience modeled on standard Direct Liquid Cooling (DLC) thermal capacity.
 * * 3. Climate Baseline (McLean, VA proxy for Ashburn):
 * - Summer Peak: 30.5°C (87°F).
 * - Source: NOAA Historical Climatology Data.
 * ==========================================
 */

export type CoolingType = 'CRAC' | 'HOT_AISLE' | 'LIQUID';

export interface Rack {
  id: string;
  loadMW: number; // e.g., 0.12 MW (120kW for NVIDIA GB200)
  coolingType: CoolingType;
}

// PUE formula: Baseline + (Penalty * degrees above ideal temp)
const COOLING_PROFILES = {
  // CRAC: Highly sensitive to outside summer heat (30.5°C)
  CRAC: { baseline: 1.45, idealTempC: 15, penaltyK: 0.015 },
  
  // Hot-Aisle: Better airflow management raises the efficiency threshold
  HOT_AISLE: { baseline: 1.25, idealTempC: 22, penaltyK: 0.010 },
  
  // Liquid: Water has superior heat capacity; highly resilient to summer peaks
  LIQUID: { baseline: 1.05, idealTempC: 30, penaltyK: 0.002 }
};

/**
 * Calculates the real-time PUE for a single rack based on outside temperature.
 */
export const calculateRackPUE = (coolingType: CoolingType, outsideTempC: number): number => {
  const profile = COOLING_PROFILES[coolingType];
  const tempOverhead = Math.max(0, outsideTempC - profile.idealTempC);
  return profile.baseline + (profile.penaltyK * tempOverhead);
};

/**
 * Calculates the total system metrics for the entire facility.
 * * NOTE: In thermodynamics, virtually 100% of electrical power drawn by the 
 * facility is eventually rejected into the environment as thermal energy. 
 * Therefore, Heat Rejected (MW) = Total Facility Power (MW).
 */
export const calculateFacilityMetrics = (racks: Rack[], outsideTempC: number) => {
  let totalITLoadMW = 0;
  let totalFacilityPowerMW = 0;

  racks.forEach(rack => {
    const rackPUE = calculateRackPUE(rack.coolingType, outsideTempC);
    const rackTotalPower = rack.loadMW * rackPUE;
    
    totalITLoadMW += rack.loadMW;
    totalFacilityPowerMW += rackTotalPower;
  });

  const systemPUE = totalITLoadMW > 0 ? totalFacilityPowerMW / totalITLoadMW : 0;
  const heatRejectedMW = totalFacilityPowerMW; 

  return {
    totalITLoadMW,
    systemPUE,
    totalFacilityPowerMW,
    heatRejectedMW
  };
};

/**
 * Water Usage Effectiveness (WUE) per cooling type — liters consumed per kWh of IT load.
 * Sources:
 *   CRAC 0.20 L/kWh      — ASHRAE TC 9.9; Green Grid WUE Guidelines (air-cooled, primarily humidification)
 *   HOT_AISLE 0.40 L/kWh — Uptime Institute WUE Benchmarks 2023 (supplemental evaporative cooling)
 *   LIQUID 0.90 L/kWh    — Green Grid WUE Report 2022; LBNL 2023 (closed-loop DLC + evaporative reject makeup)
 */
const WUE_L_PER_KWH: Record<CoolingType, number> = {
  CRAC: 0.20,
  HOT_AISLE: 0.40,
  LIQUID: 0.90,
};

/**
 * Calculates water consumption metrics for the facility.
 * waterLitersPerHour per rack = rack.loadMW × 1000 (kW) × wueL_per_kWh
 * totalWaterLitersPerDay = Σ(waterLitersPerHour) × 24
 * systemWUE = totalWaterLitersPerDay / (totalITLoadKWh over 24h)
 */
export const calculateWaterMetrics = (racks: Rack[]) => {
  let totalWaterLitersPerHour = 0;
  let totalITLoadMW = 0;

  racks.forEach((rack) => {
    totalWaterLitersPerHour += rack.loadMW * 1000 * WUE_L_PER_KWH[rack.coolingType];
    totalITLoadMW += rack.loadMW;
  });

  const totalWaterLitersPerDay = totalWaterLitersPerHour * 24;
  const itLoadKWh24 = totalITLoadMW * 1000 * 24;

  return {
    totalWaterLitersPerDay,
    systemWUE: itLoadKWh24 > 0 ? totalWaterLitersPerDay / itLoadKWh24 : 0,
  };
};