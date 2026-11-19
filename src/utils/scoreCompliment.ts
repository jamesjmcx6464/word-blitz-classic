/** End-of-round compliment for a final (or winning) score. */
const TIERS: ReadonlyArray<{ min: number; text: string }> = [
  { min: 5000, text: 'Word Blitz Master!' },
  { min: 2500, text: 'Legendary!' },
  { min: 2000, text: 'Unstoppable!' },
  { min: 1500, text: 'Phenomenal!' },
  { min: 1000, text: 'Spectacular!' },
  { min: 800, text: 'Outstanding!' },
  { min: 600, text: 'Word Wizard!' },
  { min: 400, text: 'Impressive!' },
  { min: 300, text: 'Great Job!' },
  { min: 200, text: 'Solid Round!' },
  { min: 150, text: 'Getting Warmer!' },
  { min: 100, text: 'Nice Work!' },
  { min: 50, text: 'Good Start!' },
];

export function getScoreCompliment(score: number): string {
  for (const tier of TIERS) {
    if (score >= tier.min) return tier.text;
  }
  return 'Nice Try!';
}
