import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useSimulationStore } from '../logic/store';
import { calculateRackPUE } from '../logic/thermoCalc';
import { toF, formatTemp } from '../logic/tempUtils';
import { Tooltip } from './Tooltip';
import constants from '../data/constants.json';

// ── D3 Gauge ──────────────────────────────────────────────────────────────────
interface GaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  colorScale: (t: number) => string;
}

function D3Gauge({ value, min, max, label, unit, colorScale }: GaugeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const W = 180, H = 130, R = 75, cx = W / 2, cy = H - 30;

    const arc = d3.arc<void>()
      .innerRadius(R - 18).outerRadius(R)
      .startAngle(-Math.PI / 2) as unknown as (d: void) => string;

    svg.append('path')
      .attr('transform', `translate(${cx},${cy})`)
      .attr('d', (arc as any).endAngle(Math.PI / 2)())
      .attr('fill', '#2a2a3a');

    const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
    svg.append('path')
      .attr('transform', `translate(${cx},${cy})`)
      .attr('d', (arc as any).endAngle(-Math.PI / 2 + t * Math.PI)())
      .attr('fill', colorScale(t));

    svg.append('text').attr('x', cx).attr('y', cy - 6).attr('text-anchor', 'middle')
      .attr('fill', '#f0f0f0').attr('font-size', '18px').attr('font-weight', 'bold')
      .text(value.toFixed(2));

    svg.append('text').attr('x', cx).attr('y', cy + 14).attr('text-anchor', 'middle')
      .attr('fill', '#aaa').attr('font-size', '11px').text(unit);

    svg.append('text').attr('x', cx).attr('y', H - 4).attr('text-anchor', 'middle')
      .attr('fill', '#ccc').attr('font-size', '12px').text(label);

  }, [value, min, max, label, unit, colorScale]);

  return <svg ref={svgRef} width={180} height={130} />;
}

// ── D3 Heatmap ────────────────────────────────────────────────────────────────
function D3Heatmap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { racks, outsideTempC, useFahrenheit } = useSimulationStore();

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const W = 316, H = 200, cols = 10, cellSize = 28, gap = 4; // W = cols*(cellSize+gap)-gap
    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([1.6, 1.05]);
    const totalCells = Math.max(10, racks.length);

    for (let i = 0; i < totalCells; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const rack = racks[i];
      const pue = rack ? calculateRackPUE(rack.coolingType, outsideTempC) : null;

      svg.append('rect')
        .attr('x', col * (cellSize + gap))
        .attr('y', row * (cellSize + gap))
        .attr('width', cellSize).attr('height', cellSize).attr('rx', 4)
        .attr('fill', pue ? colorScale(pue) : '#2a2a3a')
        .attr('stroke', pue ? '#fff3' : '#333').attr('stroke-width', 1)
        .append('title')
        .text(rack
          ? `${rack.id}\nCooling: ${rack.coolingType}\nPUE: ${pue!.toFixed(3)}\nFacility Power: ${(rack.loadMW * pue! * 1000).toFixed(1)} kW`
          : 'Empty rack slot');
    }

    // Legend
    const legendW = 120, legendX = W - legendW, legendY = H - 24;
    const grad = svg.append('defs').append('linearGradient').attr('id', 'pue-grad');
    grad.append('stop').attr('offset', '0%').attr('stop-color', d3.interpolateRdYlGn(0));
    grad.append('stop').attr('offset', '100%').attr('stop-color', d3.interpolateRdYlGn(1));
    svg.append('rect').attr('x', legendX).attr('y', legendY).attr('width', legendW).attr('height', 10).attr('fill', 'url(#pue-grad)').attr('rx', 3);
    svg.append('text').attr('x', legendX).attr('y', legendY - 3).attr('fill', '#aaa').attr('font-size', '9px').text('PUE 1.60 ▶');
    svg.append('text').attr('x', legendX + legendW).attr('y', legendY - 3).attr('fill', '#aaa').attr('font-size', '9px').attr('text-anchor', 'end').text('◀ 1.05');
  }, [racks, outsideTempC, useFahrenheit]);

  return <svg ref={svgRef} width={316} height={200} />;
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function MetricsDashboard() {
  const { metrics, outsideTempC, setOutsideTemp, racks, useFahrenheit } = useSimulationStore();

  const pueColor = d3.scaleSequential(d3.interpolateRdYlGn).domain([1.6, 1.05]);
  const heatColor = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 100]);
  const tempColor = d3.scaleSequential(d3.interpolateRdBu).domain([35, -5]);

  // Temperature gauge display values — convert to display unit
  const displayTemp = useFahrenheit ? toF(outsideTempC) : outsideTempC;
  const displayMin  = useFahrenheit ? toF(constants.climate.winterTroughC) : constants.climate.winterTroughC;
  const displayMax  = useFahrenheit ? toF(constants.climate.summerPeakC)   : constants.climate.summerPeakC;
  const tempUnit    = useFahrenheit ? '°F' : '°C';

  return (
    <section className="dashboard">
      <h2 className="dashboard-title">Live Metrics</h2>

      <div className="gauges">
        <Tooltip position="left" content={
          <div className="tooltip-content">
            <div className="tooltip-title">System PUE</div>
            <p className="tooltip-desc">Power Usage Effectiveness — total facility power divided by IT load. A PUE of 1.0 is theoretical perfection. Every point above 1.0 is wasted energy. World-class hyperscalers target ≤ 1.2; legacy air-cooled data centers often exceed 1.5.</p>
            <table className="tooltip-table">
              <tbody>
                <tr><td>Good (≤ {constants.simulation.pueGoodThreshold})</td><td style={{color:'#2ecc71'}}>■ Green</td></tr>
                <tr><td>Warning (≤ {constants.simulation.pueWarningThreshold})</td><td style={{color:'#f1c40f'}}>■ Yellow</td></tr>
                <tr><td>Poor (&gt; {constants.simulation.pueWarningThreshold})</td><td style={{color:'#e74c3c'}}>■ Red</td></tr>
              </tbody>
            </table>
          </div>
        }>
          <D3Gauge value={metrics.systemPUE} min={1.0} max={1.7}
            label="System PUE" unit="lower = better"
            colorScale={(t) => pueColor(1.0 + t * 0.7)} />
        </Tooltip>

        <Tooltip position="left" content={
          <div className="tooltip-content">
            <div className="tooltip-title">Heat Rejected (MW)</div>
            <p className="tooltip-desc">
              Virtually 100% of the electrical power drawn by the facility is eventually released into the environment as thermal energy (2nd Law of Thermodynamics). Heat Rejected ≈ Total Facility Power. This figure represents the thermal burden on the local environment and cooling infrastructure.
            </p>
            <table className="tooltip-table">
              <tbody>
                <tr><td>IT Load</td><td>{metrics.totalITLoadMW.toFixed(2)} MW</td></tr>
                <tr><td>Cooling overhead</td><td>{(metrics.totalFacilityPowerMW - metrics.totalITLoadMW).toFixed(2)} MW</td></tr>
                <tr><td>Total rejected</td><td><strong>{metrics.heatRejectedMW.toFixed(2)} MW</strong></td></tr>
              </tbody>
            </table>
          </div>
        }>
          <D3Gauge value={metrics.heatRejectedMW} min={0} max={100}
            label="Heat Rejected" unit="MW"
            colorScale={(t) => heatColor(t * 100)} />
        </Tooltip>

        <Tooltip position="left" content={
          <div className="tooltip-content">
            <div className="tooltip-title">Outside Air Temperature</div>
            <p className="tooltip-desc">
              Ambient temperature at the facility perimeter (McLean / Ashburn, VA). Air-cooled systems (CRAC, Hot-Aisle) are directly penalised by heat above their ideal operating threshold. Liquid-cooled systems are nearly immune.
            </p>
            <table className="tooltip-table">
              <tbody>
                <tr><td>Winter trough</td><td>{formatTemp(constants.climate.winterTroughC, useFahrenheit, 1)} (NOAA)</td></tr>
                <tr><td>Summer peak</td><td>{formatTemp(constants.climate.summerPeakC, useFahrenheit, 1)} (NOAA)</td></tr>
                <tr><td>Annual avg</td><td>{formatTemp(constants.climate.annualAverageC, useFahrenheit, 1)}</td></tr>
              </tbody>
            </table>
          </div>
        }>
          <D3Gauge
            value={displayTemp}
            min={displayMin}
            max={displayMax}
            label="Outside Temp"
            unit={tempUnit}
            colorScale={(t) => tempColor(35 - t * 40)}
          />
        </Tooltip>
      </div>

      {/* Temperature slider — always stored in °C, display labels convert */}
      <div className="temp-slider-wrap">
        <label htmlFor="temp-slider">
          Outside Temperature: <strong>{formatTemp(outsideTempC, useFahrenheit)}</strong>
          <span className="temp-labels">
            <span>Winter ({formatTemp(constants.climate.winterTroughC, useFahrenheit, 1)})</span>
            <span>Summer Peak ({formatTemp(constants.climate.summerPeakC, useFahrenheit, 1)})</span>
          </span>
        </label>
        <input
          id="temp-slider"
          type="range"
          min={constants.climate.winterTroughC}
          max={constants.climate.summerPeakC}
          step={0.1}
          value={outsideTempC}
          onChange={(e) => setOutsideTemp(parseFloat(e.target.value))}
          className="temp-slider"
        />
      </div>

      {/* Stat cards */}
      <div className="stats-row">
        <Tooltip position="top" content={
          <div className="tooltip-content">
            <div className="tooltip-title">Total IT Load</div>
            <p className="tooltip-desc">Sum of raw compute power across all deployed racks. Each NVIDIA GB200 NVL72 contributes 120 kW. This is the useful work the facility performs.</p>
          </div>
        }>
          <div className="stat-card">
            <span className="stat-val">{metrics.totalITLoadMW.toFixed(2)}</span>
            <span className="stat-unit">MW IT Load</span>
          </div>
        </Tooltip>

        <Tooltip position="top" content={
          <div className="tooltip-content">
            <div className="tooltip-title">Total Facility Power</div>
            <p className="tooltip-desc">IT Load multiplied by the weighted system PUE. Includes all cooling overhead. This is what the utility meter reads — and what Dominion Energy bills for.</p>
          </div>
        }>
          <div className="stat-card">
            <span className="stat-val">{metrics.totalFacilityPowerMW.toFixed(2)}</span>
            <span className="stat-unit">MW Total Power</span>
          </div>
        </Tooltip>

        <Tooltip position="top" content={
          <div className="tooltip-content">
            <div className="tooltip-title">Racks Online</div>
            <p className="tooltip-desc">Each rack is an NVIDIA GB200 NVL72 chassis — 72 GPUs, 120 kW continuous draw. The Loudoun County campus baseline is modelled at 100 MW capacity, supporting up to {constants.simulation.maxRacks} racks in this simulation.</p>
          </div>
        }>
          <div className="stat-card">
            <span className="stat-val">{racks.length}</span>
            <span className="stat-unit">Racks Online</span>
          </div>
        </Tooltip>

        <Tooltip position="top" content={
          <div className="tooltip-content">
            <div className="tooltip-title">Daily Water Consumption</div>
            <p className="tooltip-desc">
              Estimated water consumed per day across the facility. Calculated as IT load (kW) × WUE (L/kWh) × 24 hours per cooling type.
            </p>
            <table className="tooltip-table">
              <tbody>
                <tr><td>CRAC</td><td>0.20 L/kWh (ASHRAE TC 9.9)</td></tr>
                <tr><td>Hot-Aisle</td><td>0.40 L/kWh (Uptime Institute 2023)</td></tr>
                <tr><td>Liquid</td><td>0.90 L/kWh (Green Grid / LBNL 2023)</td></tr>
              </tbody>
            </table>
          </div>
        }>
          <div className="stat-card">
            <span className="stat-val">{metrics.totalWaterLitersPerDay.toFixed(0)}</span>
            <span className="stat-unit">L/day Water</span>
          </div>
        </Tooltip>

        <Tooltip position="top" content={
          <div className="tooltip-content">
            <div className="tooltip-title">System WUE</div>
            <p className="tooltip-desc">
              Water Usage Effectiveness — total liters consumed per kWh of IT load (Green Grid standard). Lower is better. World-class facilities target WUE ≤ 0.5 L/kWh. Liquid-cooled systems are higher due to makeup water in evaporative heat rejection loops.
            </p>
          </div>
        }>
          <div className="stat-card">
            <span className="stat-val">{metrics.systemWUE.toFixed(2)}</span>
            <span className="stat-unit">L/kWh WUE</span>
          </div>
        </Tooltip>
      </div>

      <div className="heatmap-wrap">
        <Tooltip position="top" content={
          <div className="tooltip-content">
            <div className="tooltip-title">Rack PUE Heat Map</div>
            <p className="tooltip-desc">Each cell is one deployed rack. Colour encodes its real-time PUE at the current ambient temperature. Hover any filled cell for individual rack details. Empty slots are shown in dark grey.</p>
            <table className="tooltip-table">
              <tbody>
                <tr><td style={{color:'#2ecc71'}}>■ Green</td><td>Low PUE (efficient)</td></tr>
                <tr><td style={{color:'#f1c40f'}}>■ Yellow</td><td>Mid PUE</td></tr>
                <tr><td style={{color:'#e74c3c'}}>■ Red</td><td>High PUE (wasteful)</td></tr>
              </tbody>
            </table>
          </div>
        }>
          <h3 className="heatmap-title heatmap-title--hoverable">Rack PUE Heat Map ⓘ</h3>
        </Tooltip>
        <D3Heatmap />
      </div>
    </section>
  );
}
