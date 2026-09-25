import type { Entity } from './types';

export const ENTITIES: Entity[] = [
  { id: 'US', name: 'Solace Living Inc. (parent)', ccy: 'USD', role: 'HQ, D2C + wholesale', opening: 13_700_000, headcount: 310, avgAnnualSalaryLocal: 96_000 },
  { id: 'UK', name: 'Solace UK Ltd', ccy: 'GBP', role: 'UK retail/wholesale', opening: 2_100_000, headcount: 95, avgAnnualSalaryLocal: 52_000 },
  { id: 'DE', name: 'Solace GmbH', ccy: 'EUR', role: 'EU distribution', opening: 3_050_000, headcount: 60, avgAnnualSalaryLocal: 61_000 },
  { id: 'MX', name: 'Solace Manufactura S.A. de C.V.', ccy: 'MXN', role: 'Manufacturing', opening: 58_000_000, headcount: 120, avgAnnualSalaryLocal: 290_000 },
  { id: 'IN', name: 'Solace Design India Pvt Ltd', ccy: 'INR', role: 'Design & engineering', opening: 145_000_000, headcount: 55, avgAnnualSalaryLocal: 2_400_000 },
];

export const entityById = (id: string) => ENTITIES.find((e) => e.id === id);
