import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useSimulationStore } from '../logic/store';
import { calculateRackPUE } from '../logic/thermoCalc';
import constants from '../data/constants.json';

// ── D3 Gauge: renders a single arc gauge ──────────────────────────────────────
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

    const W = 180;
    const H = 110;
    const R = 75;
    const cx = W / 2;
    const cy = H - 10;

    const arc = d3.arc<void>()
      .innerRadius(R - 18)
      .outerRadius(R)
      .startAngle(-Math.PI / 2) as unknown as (d: void) => string;

    // Background track
    svg.append('path')
      .attr('transform', `translate(${cx},${cy})`)
      .attr('d', (arc as any).endAngle(Math.PI / 2)())
      .attr('fill', '#2a2a3a');

    // Value arc
    const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
    const endAngle = -Math.PI / 2 + t * Math.PI;

    svg.append('path')
      .attr('transform', `translate(${cx},${cy})`)
      .attr('d', (arc as any).endAngle(endAngle)())
      .attr('fill', colorScale(t));

    // Value text
    svg.append('text')
      .attr('x', cx).attr('y', cy - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f0f0f0')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .text(value.toFixed(2));

    // Unit text
    svg.append('text')
      .attr('x', cx).attr('y', cy + 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#aaa')
      .attr('font-size', '11px')
      .text(unit);

    // Label
    svg.append('text')
      .attr('x', cx).attr('y', H - 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ccc')
      .attr('font-size', '12px')
      .text(label);

  }, [value, min, max, label, unit, colorScale]);

  return <svg ref={svgRef} width={180} height={110} />;
}

// ── D3 Heatmap: visualises rack-level PUE as a colour grid ───────────────────
function D3Heatmap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { racks, outsideTempC } = useSimulationStore();

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const W = 340;
    const H = 200;
    const cols = 10;
    const cellSize = 28;
    const gap = 4;

    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain([1.6, 1.05]); // red = bad PUE, green = good PUE

    const totalCells = Math.max(10, racks.length);

    for (let i = 0; i < totalCells; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const rack = racks[i];
      const pue = rack ? calculateRackPUE(rack.coolingType, outsideTempC) : null;

      svg.append('rect')
        .attr('x', col * (cellSize + gap))
        .attr('y', row * (cellSize + gap))
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('rx', 4)
        .attr('fill', pue ? colorScale(pue) : '#2a2a3a')
        .attr('stroke', pue ? '#fff3' : '#333')
        .attr('stroke-width', 1)
        .append('title')
        .text(rack ? `${rack.id}\nCooling: ${rack.coolingType}\nPUE: ${pue!.toFixed(3)}` : 'Empty slot');
    }

    // Legend
    const legendW = 120;
    const legendX = W - legendW - 10;
    const legendY = H - 24;
    const grad = svg.append('defs').append('linearGradient').attr('id', 'pue-grad');
    grad.append('stop').attr('offset', '0%').attr('stop-color', d3.interpolateRdYlGn(0));
    grad.append('stop').attr('offset', '100%').attr('stop-color', d3.interpolateRdYlGn(1));
    svg.append('rect').attr('x', legendX).attr('y', legendY).attr('width', legendW).attr('height', 10).attr('fill', 'url(#pue-grad)').attr('rx', 3);
    svg.append('text').attr('x', legendX).attr('y', legendY - 3).attr('fill', '#aaa').attr('font-size', '9px').text('PUE 1.60');
    svg.append('text').attr('x', legendX + legendW).attr('y', legendY - 3).attr('fill', '#aaa').attr('font-size', '9px').attr('text-anchor', 'end').text('1.05');
  }, [racks, outsideTempC]);

  return <svg ref={svgRef} width={340} height={200} style={{ overflow: 'visible' }} />;
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function MetricsDashboard() {
  const { metrics, outsideTempC, setOutsideTemp, racks } = useSimulationStore();

  const pueColor = d3.scaleSequential(d3.interpolateRdYlGn).domain([1.6, 1.05]);
  const heatColor = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 100]);
  const tempColor = d3.scaleSequential(d3.interpolateRdBu).domain([35, -5]);

  return (
    <section className="dashboard">
      <h2 className="dashboard-title">Live Metrics</h2>

      <div className="gauges">
        <D3Gauge
          value={metrics.systemPUE}
          min={1.0} max={1.7}
          label="System PUE"
          unit="lower = better"
          colorScale={(t) => pueColor(1.0 + t * 0.7)}
        />
        <D3Gauge
          value={metrics.heatRejectedMW}
          min={0} max={100}
          label="Heat Rejected"
          unit="MW"
          colorScale={(t) => heatColor(t * 100)}
        />
        <D3Gauge
          value={outsideTempC}
          min={-5} max={35}
          label="Outside Temp"
          unit="°C"
          colorScale={(t) => tempColor(35 - t * 40)}
        />
      </div>

      <div className="temp-slider-wrap">
        <label htmlFor="temp-slider">
          Outside Temperature: <strong>{outsideTempC.toFixed(1)}°C</strong>
          <span className="temp-labels">
            <span>Winter ({constants.climate.winterTroughC}°C)</span>
            <span>Summer Peak ({constants.climate.summerPeakC}°C)</span>
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

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-val">{metrics.totalITLoadMW.toFixed(2)}</span>
          <span className="stat-unit">MW IT Load</span>
        </div>
        <div className="stat-card">
          <span className="stat-val">{metrics.totalFacilityPowerMW.toFixed(2)}</span>
          <span className="stat-unit">MW Total Power</span>
        </div>
        <div className="stat-card">
          <span className="stat-val">{racks.length}</span>
          <span className="stat-unit">Racks Online</span>
        </div>
      </div>

      <div className="heatmap-wrap">
        <h3 className="heatmap-title">Rack PUE Heat Map</h3>
        <D3Heatmap />
      </div>
    </section>
  );
}
