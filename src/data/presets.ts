import { Rack, CoolingType } from '../logic/thermoCalc';

export interface Preset {
  id: string;
  label: string;
  description: string;
  citation: string;
  racks: Rack[];
}

const makeRacks = (specs: Array<{ coolingType: CoolingType; count: number }>): Rack[] => {
  let i = 0;
  return specs.flatMap(({ coolingType, count }) =>
    Array.from({ length: count }, () => ({
      id: `rack-${++i}`,
      loadMW: 0.12,
      coolingType,
    }))
  );
};

export const PRESETS: Preset[] = [
  {
    id: 'hyperscaler-ai',
    label: 'Hyperscaler AI Campus',
    description: '20 liquid-cooled GB200 racks — modern GPU cluster baseline',
    citation: 'Uptime Institute Global DC Survey 2024; Meta / Google AI campus disclosures',
    racks: makeRacks([{ coolingType: 'LIQUID', count: 20 }]),
  },
  {
    id: 'modern-colo',
    label: 'Modern Co-location',
    description: '10 hot-aisle + 5 liquid racks — mixed-density co-lo',
    citation: 'Equinix / CoreWeave typical mixed-density colocation configuration',
    racks: makeRacks([
      { coolingType: 'HOT_AISLE', count: 10 },
      { coolingType: 'LIQUID', count: 5 },
    ]),
  },
  {
    id: 'legacy-enterprise',
    label: 'Legacy Enterprise DC',
    description: '10 CRAC racks — pre-2015 enterprise average (PUE ≈ 1.8–2.0)',
    citation: 'Uptime Institute Annual Survey; pre-2015 enterprise DC average',
    racks: makeRacks([{ coolingType: 'CRAC', count: 10 }]),
  },
  {
    id: 'financial-hft',
    label: 'Financial / HFT',
    description: '8 hot-aisle racks — low density, precision thermal control',
    citation: 'NYSE / Equinix NY4–NY11 colocation facility profiles',
    racks: makeRacks([{ coolingType: 'HOT_AISLE', count: 8 }]),
  },
  {
    id: 'empty',
    label: 'Clear Floor',
    description: 'Remove all racks from the floor',
    citation: '',
    racks: [],
  },
];
