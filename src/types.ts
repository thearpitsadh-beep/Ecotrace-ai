export interface CarbonActivity {
  id: string;
  type: 'transport' | 'diet' | 'energy' | 'shopping' | 'water';
  title: string;
  co2ImpactKg: number;
  date: string;
}

export interface UserProfile {
  name: string;
  totalFootprintKg: number;
  activities: CarbonActivity[];
  points: number;
}

export interface Insight {
  category: string;
  tip: string;
  potentialSavingsKg: number;
}
