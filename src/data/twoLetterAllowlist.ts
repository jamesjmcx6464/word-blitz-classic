/** The only 2-letter words accepted in play. Keep in sync with
 *  scripts/dictionary/two-letter-allowlist.txt (everyday words + solfège + OK).
 *  Enforced in dictionary.ts so runtime splits cannot re-inject junk such as AU.
 */
export const TWO_LETTER_ALLOWLIST: ReadonlySet<string> = new Set([
  'AD', 'AH', 'AM', 'AN', 'AS', 'AT', 'AW', 'AX', 'AY', 'BE', 'BY', 'DO', 'EH', 'EX', 'GO', 'HA', 'HE', 'HI', 'HO', 'ID', 'IF', 'IN', 'IS', 'IT', 'MA', 'ME', 'MY', 'NO', 'OF', 'OH', 'ON', 'OR', 'OW', 'OX', 'OY', 'PA', 'SO', 'TO', 'UH', 'UM', 'UP', 'US', 'WE', 'YE', 'YO', 'FA', 'LA', 'MI', 'RE', 'SI', 'TI', 'OK',
]);

export function isAllowedTwoLetter(word: string): boolean {
  return TWO_LETTER_ALLOWLIST.has(word.toUpperCase().trim());
}
