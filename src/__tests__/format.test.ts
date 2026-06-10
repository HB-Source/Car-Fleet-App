import { describe, expect, it } from 'vitest';
import { formatMileage, timeAgo } from '../utils/format';

describe('formatMileage', () => {
  it('formats with thousands separators and km suffix', () => {
    expect(formatMileage(45200)).toBe('45,200 km');
    expect(formatMileage(0)).toBe('0 km');
  });
});

describe('timeAgo', () => {
  it('formats recent timestamps as relative time', () => {
    expect(timeAgo(new Date(Date.now() - 30_000).toISOString())).toBe('Just now');
    expect(timeAgo(new Date(Date.now() - 5 * 60_000).toISOString())).toBe('5 min ago');
    expect(timeAgo(new Date(Date.now() - 3 * 3_600_000).toISOString())).toBe('3 h ago');
    expect(timeAgo(new Date(Date.now() - 2 * 86_400_000).toISOString())).toBe('2 d ago');
  });

  it('handles invalid input gracefully', () => {
    expect(timeAgo('not-a-date')).toBe('Unknown');
  });
});
