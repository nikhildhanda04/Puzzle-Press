const DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

// Devanagari numerals are decoration only — issue numbers, section counters.
export function devanagariNumber(value) {
  return String(value)
    .split('')
    .map((char) => (char >= '0' && char <= '9' ? DIGITS[Number(char)] : char))
    .join('')
}
