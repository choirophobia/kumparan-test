const MONTHS = [
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
];

/**
 * Parses kumparan's publish date, e.g. "9 Oktober 2026 9:34 WIB".
 * Returns a Date in UTC (WIB = UTC+7), or null when the text does not match.
 */
export function parseIndonesianDate(text: string): Date | null {
  const match = text.trim().match(/^(\d{1,2}) (\w+) (\d{4}) (\d{1,2}):(\d{2}) WIB$/i);
  if (!match) return null;

  const [, day, monthName, year, hour, minute] = match;
  const month = MONTHS.indexOf(monthName.toLowerCase());
  if (month === -1) return null;

  return new Date(Date.UTC(Number(year), month, Number(day), Number(hour) - 7, Number(minute)));
}
