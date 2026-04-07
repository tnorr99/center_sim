import React from 'react';

interface HomePageProps {
  onLaunch: () => void;
}

export function HomePage({ onLaunch }: HomePageProps) {
  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-hero-badge">McLean / Ashburn, VA — Loudoun County</div>
        <h1 className="home-title">Data Center Thermodynamics Simulator</h1>
        <p className="home-tagline">
          Explore how cooling technology choices and ambient temperature impact energy
          efficiency and heat rejection at hyperscale — in real time.
        </p>
        <button className="home-launch-btn" onClick={onLaunch}>
          Launch Simulator →
        </button>
      </div>

      <div className="home-grid">

        {/* What is this */}
        <section className="home-card home-card--wide">
          <h2>What This Simulates</h2>
          <p>
            This tool models the thermodynamic behaviour of a 100 MW data center campus
            based on the Loudoun County, Virginia baseline — the densest concentration of
            data center capacity on Earth. You deploy racks of <strong>NVIDIA GB200 NVL72</strong> hardware
            (120 kW each, 72 Blackwell GPUs per chassis) and assign each rack a cooling
            strategy. The simulator continuously calculates how your choices affect:
          </p>
          <ul>
            <li><strong>Power Usage Effectiveness (PUE)</strong> — the ratio of total facility power to useful IT load</li>
            <li><strong>Heat Rejected (MW)</strong> — thermal energy expelled into the environment</li>
            <li><strong>Seasonal degradation</strong> — how summer heat erodes air-cooled efficiency</li>
          </ul>
          <p>
            All formulas are derived from ASHRAE TC 9.9 guidelines, Uptime Institute survey
            data, and NVIDIA GB200 NVL72 technical specifications.
          </p>
        </section>

        {/* Cooling types */}
        <section className="home-card">
          <h2>Cooling Technologies</h2>
          <div className="home-cooling-list">
            <div className="home-cooling-item" style={{ borderColor: '#e74c3c' }}>
              <span className="home-cooling-icon" style={{ background: '#e74c3c' }}>❄️</span>
              <div>
                <strong>CRAC — Computer Room Air Conditioning</strong>
                <p>Traditional perimeter air cooling. Baseline PUE ≈ 1.45. Highly sensitive to summer heat — every degree above 15 °C adds 0.015 to PUE. Common in legacy facilities.</p>
              </div>
            </div>
            <div className="home-cooling-item" style={{ borderColor: '#f39c12' }}>
              <span className="home-cooling-icon" style={{ background: '#f39c12' }}>🔥</span>
              <div>
                <strong>Hot-Aisle Containment</strong>
                <p>Separates hot exhaust from cool intake air. Baseline PUE ≈ 1.25. Moderate temp sensitivity (penalty kicks in above 22 °C). Common in modern retrofitted facilities.</p>
              </div>
            </div>
            <div className="home-cooling-item" style={{ borderColor: '#2980b9' }}>
              <span className="home-cooling-icon" style={{ background: '#2980b9' }}>💧</span>
              <div>
                <strong>Direct-to-Chip Liquid Cooling</strong>
                <p>Coolant routed directly to GPU heatsinks. Baseline PUE ≈ 1.05. Nearly immune to ambient temperature (penalty above 30 °C is only 0.002 per degree). Mandatory for GB200 NVL72.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PUE explained */}
        <section className="home-card">
          <h2>Understanding PUE</h2>
          <p>
            <strong>Power Usage Effectiveness</strong> is the standard metric for data center
            energy efficiency, defined by the Green Grid:
          </p>
          <div className="home-formula">
            PUE = Total Facility Power ÷ IT Equipment Power
          </div>
          <table className="home-table">
            <thead>
              <tr><th>PUE</th><th>Rating</th><th>Equivalent to…</th></tr>
            </thead>
            <tbody>
              <tr><td>1.0</td><td>Perfect (theoretical)</td><td>Zero cooling overhead</td></tr>
              <tr><td>1.05–1.2</td><td>World-class</td><td>Liquid-cooled hyperscaler</td></tr>
              <tr><td>1.2–1.4</td><td>Efficient</td><td>Modern air-cooled campus</td></tr>
              <tr><td>1.4–1.6</td><td>Average</td><td>Typical enterprise DC</td></tr>
              <tr><td>&gt; 1.6</td><td>Poor</td><td>Legacy facility, summer peak</td></tr>
            </tbody>
          </table>
          <p className="home-note">
            At 100 MW IT load, moving from PUE 1.5 to 1.05 saves ~45 MW — enough to power
            approximately 37,000 U.S. homes.
          </p>
        </section>

        {/* How to use */}
        <section className="home-card">
          <h2>How to Use the Simulator</h2>
          <ol className="home-steps">
            <li>
              <span className="home-step-num">1</span>
              <div><strong>Drag a cooling module</strong> from the left palette onto the Data Center Floor to deploy a rack.</div>
            </li>
            <li>
              <span className="home-step-num">2</span>
              <div><strong>Watch the live gauges</strong> on the right update — PUE, heat rejected, and ambient temp all react immediately.</div>
            </li>
            <li>
              <span className="home-step-num">3</span>
              <div><strong>Move the temperature slider</strong> from winter (−2.2 °C) to summer peak (30.5 °C) to see how CRAC units degrade while liquid cooling stays flat.</div>
            </li>
            <li>
              <span className="home-step-num">4</span>
              <div><strong>Change a rack's cooling type</strong> via the dropdown on each rack tile to compare technologies side-by-side.</div>
            </li>
            <li>
              <span className="home-step-num">5</span>
              <div><strong>Hover any metric</strong> for a detailed tooltip explaining the underlying formula and real-world context.</div>
            </li>
            <li>
              <span className="home-step-num">6</span>
              <div><strong>Toggle °C / °F</strong> in the top-right header to switch temperature units at any time.</div>
            </li>
          </ol>
        </section>

        {/* Data sources */}
        <section className="home-card home-card--sources">
          <h2>Data Sources & Citations</h2>
          <ul>
            <li><strong>Hardware:</strong> NVIDIA GB200 NVL72 Technical Specifications (2024/2025) — 120 kW per rack, liquid cooling mandatory</li>
            <li><strong>PUE curves:</strong> Uptime Institute Annual Global Data Center Survey (2023/2024)</li>
            <li><strong>Temperature thresholds:</strong> ASHRAE TC 9.9 Environmental Guidelines for Datacom Equipment</li>
            <li><strong>Climate baseline:</strong> NOAA Historical Climatology Data — McLean, VA proxy for Ashburn</li>
            <li><strong>Facility baseline:</strong> Loudoun County, VA data center campus capacity modelling</li>
          </ul>
        </section>

      </div>

      <footer className="home-footer">
        <button className="home-launch-btn home-launch-btn--secondary" onClick={onLaunch}>
          Launch Simulator →
        </button>
      </footer>
    </div>
  );
}
