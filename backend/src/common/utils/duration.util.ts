/**
 * Parses a simple duration string (e.g. "15m", "24h", "1h", "30s", "1d") into milliseconds.
 * Supports suffixes: s (seconds), m (minutes), h (hours), d (days).
 */
export function parseDurationToMs(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid duration string: "${value}"`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * unitMs[unit];
}
